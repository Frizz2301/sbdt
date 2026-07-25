import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { 
  Aircraft, 
  RadarPoint, 
  FusionResult, 
  SystemStatus, 
  DatabaseLog, 
  AlertNotification, 
  SystemSettings 
} from './src/types';

const PORT = 3000;
const app = express();
const server = createServer(app);

// Enable JSON body parsing
app.use(express.json());

// --- IN-MEMORY DATABASE & SIMULATOR DATA STATE ---
let settings: SystemSettings = {
  adsbUrl: "https://api.air-telemetry.net/adsb/v1/live",
  radarUrl: "https://api.bmkg.go.id/radar/v1/reflectivity",
  scanIntervalMs: 1500,
  redisReplicationCount: 3, // Master + 2 Replicas
  spatialShardingCount: 3,  // WID (Western), CID (Central), EID (Eastern)
  dangerDbzThreshold: 50,
  warningDbzThreshold: 40,
  cautionDbzThreshold: 20
};

// Simulated distributed nodes state
let activeClientsCount = 0;
let systemStats: SystemStatus = {
  redis: {
    status: 'ONLINE',
    latencyMs: 1,
    activeKeys: 10,
    replicationFactor: 3,
    nodeRole: 'MASTER',
    cacheHitRate: 98.4
  },
  postgres: {
    status: 'ONLINE',
    latencyMs: 3,
    shards: [
      { id: 'WID_SHARD', region: 'Sumatra, Java, West Kalimantan (100°E - 110°E)', recordsCount: 14202, status: 'ONLINE' },
      { id: 'CID_SHARD', region: 'Bali, Sulawesi, Nusa Tenggara, South Kalimantan (110°E - 120°E)', recordsCount: 9845, status: 'ONLINE' },
      { id: 'EID_SHARD', region: 'Maluku, Papua (120°E - 140°E)', recordsCount: 4123, status: 'ONLINE' }
    ],
    spatialIndexType: 'GIST (PostGIS)'
  },
  feeds: {
    adsb: 'CONNECTED',
    radar: 'CONNECTED',
    websocket: 'CONNECTED',
    connectedClients: 0,
    fusionDelayMs: 45
  }
};

// In-Memory Database storage representing Redis and PostgreSQL/PostGIS
const redisStore = new Map<string, Aircraft>();
const postgresHistoricalStore: FusionResult[] = [];
const systemLogs: DatabaseLog[] = [];
const activeAlerts: AlertNotification[] = [];

// Session store for mock authentication
let sessionUser: { email: string; role: string; name: string } | null = null;

// --- INITIALIZE DOCK METADATA ---
function addDatabaseLog(
  operation: DatabaseLog['operation'],
  nodeId: string,
  details: string,
  status: DatabaseLog['status'] = 'SUCCESS'
) {
  const log: DatabaseLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    operation,
    nodeId,
    details,
    status
  };
  systemLogs.unshift(log);
  if (systemLogs.length > 300) {
    systemLogs.pop();
  }
}

// Pre-fill some historical logs
addDatabaseLog('CONSENSUS_COMMIT', 'REDIS_MASTER', 'Paxos proposal accepted for active flight state synch (Epoch 102).');
addDatabaseLog('REPLICATION_SYNC', 'REDIS_REPLICA_1', 'Replica 1 successfully synchronized from Master. Lag: 0ms.');
addDatabaseLog('REPLICATION_SYNC', 'REDIS_REPLICA_2', 'Replica 2 successfully synchronized from Master. Lag: 2ms.');
addDatabaseLog('PARTITION_ROUTING', 'WID_SHARD', 'Historical flight entry for GIA123 routed to Western Indonesia Shard based on spatial coordinate (106.8° E).');
addDatabaseLog('WRITE_POSTGRES', 'WID_SHARD', 'Spatial record committed to spatial_flight_history table with GiST R-Tree index updated.');

// Pre-fill history data
const historicalPredefinedRoutes = [
  { callsign: "GIA123", dep: "CGK", arr: "SUB", path: "WID_SHARD" },
  { callsign: "LNI504", dep: "DPS", arr: "CGK", path: "CID_SHARD" },
  { callsign: "AWQ302", dep: "SIN", arr: "SUB", path: "WID_SHARD" },
  { callsign: "BTK401", dep: "CGK", arr: "UPG", path: "CID_SHARD" }
];

for (let i = 20; i >= 1; i--) {
  const time = new Date(Date.now() - i * 60 * 1000);
  const route = historicalPredefinedRoutes[i % historicalPredefinedRoutes.length];
  postgresHistoricalStore.push({
    id: `fus-${Date.now() - i * 60000}`,
    aircraftId: `AC-${1000 + i}`,
    callsign: route.callsign,
    latitude: -6.2 + (i * 0.05),
    longitude: 106.8 + (i * 0.08),
    altitude: 24000 + (i * 200),
    heading: 95,
    groundSpeed: 420 + (i % 10),
    radarDbz: (i % 5) * 12,
    riskStatus: (i % 5) * 12 > 50 ? 'DANGER' : (i % 5) * 12 > 40 ? 'WARNING' : (i % 5) * 12 > 20 ? 'CAUTION' : 'SAFE',
    timestamp: time.toISOString(),
    spatialShard: route.path,
    consensusReplicated: true
  });
}

// --- FLIGHT PATH SIMULATOR & WEATHER RADAR MODEL ---
interface RouteDefinition {
  callsign: string;
  aircraftType: string;
  from: string;
  to: string;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  altitude: number;
  groundSpeed: number;
}

const flightRoutes: RouteDefinition[] = [
  { callsign: "GIA123", aircraftType: "B773", from: "Jakarta (CGK)", to: "Surabaya (SUB)", startLat: -6.125, startLon: 106.656, endLat: -7.380, endLon: 112.784, altitude: 33000, groundSpeed: 440 },
  { callsign: "LNI504", aircraftType: "B739", from: "Denpasar (DPS)", to: "Jakarta (CGK)", startLat: -8.748, startLon: 115.167, endLat: -6.125, endLon: 106.656, altitude: 31000, groundSpeed: 410 },
  { callsign: "AWQ302", aircraftType: "A320", from: "Singapore (SIN)", to: "Surabaya (SUB)", startLat: -5.0, startLon: 105.0, endLat: -7.380, endLon: 112.784, altitude: 35000, groundSpeed: 450 },
  { callsign: "SJY882", aircraftType: "B738", from: "Jakarta (CGK)", to: "Pontianak (PNK)", startLat: -6.125, startLon: 106.656, endLat: -0.150, endLon: 109.400, altitude: 28000, groundSpeed: 390 },
  { callsign: "BTK401", aircraftType: "A321", from: "Jakarta (CGK)", to: "Makassar (UPG)", startLat: -6.125, startLon: 106.656, endLat: -5.061, endLon: 119.554, altitude: 36000, groundSpeed: 435 },
  { callsign: "SVR210", aircraftType: "C208", from: "Bandung (BDO)", to: "Cilacap (CXP)", startLat: -6.900, startLon: 107.576, endLat: -7.633, endLon: 109.006, altitude: 9500, groundSpeed: 160 },
  { callsign: "GIA088", aircraftType: "A333", from: "Jakarta (CGK)", to: "Denpasar (DPS)", startLat: -6.125, startLon: 106.656, endLat: -8.748, endLon: 115.167, altitude: 34000, groundSpeed: 445 },
  { callsign: "LNI700", aircraftType: "B739", from: "Medan (KNO)", to: "Jakarta (CGK)", startLat: -4.5, startLon: 104.0, endLat: -6.125, endLon: 106.656, altitude: 32000, groundSpeed: 420 },
  { callsign: "BTK306", aircraftType: "A320", from: "Surabaya (SUB)", to: "Denpasar (DPS)", startLat: -7.380, startLon: 112.784, endLat: -8.748, endLon: 115.167, altitude: 24000, groundSpeed: 380 }
];

// Instantiating initial aircraft states with progress markers
interface SimulatedAircraft {
  def: RouteDefinition;
  progress: number; // 0 to 1
  direction: 1 | -1; // 1 = flying dep->arr, -1 = arr->dep
  trail: [number, number][];
}

const simulatedFlights: SimulatedAircraft[] = flightRoutes.map((route, idx) => ({
  def: route,
  progress: (idx * 0.11) % 1.0, // spread them out
  direction: 1,
  trail: []
}));

// Storm cells representing BMKG Weather Radar
interface StormCell {
  id: string;
  name: string;
  lat: number;
  lon: number;
  radius: number; // in degrees
  peakDbz: number;
  v_lat: number; // speed/direction of storm movement
  v_lon: number;
}

const stormCells: StormCell[] = [
  { id: "storm-1", name: "Semarang Convective Cell", lat: -6.9, lon: 110.4, radius: 1.2, peakDbz: 56, v_lat: 0.005, v_lon: -0.01 },
  { id: "storm-2", name: "Cirebon Convection Zone", lat: -6.7, lon: 108.5, radius: 0.8, peakDbz: 46, v_lat: -0.002, v_lon: -0.005 },
  { id: "storm-3", name: "South Bali Storm Cell", lat: -9.1, lon: 114.5, radius: 1.0, peakDbz: 38, v_lat: 0.008, v_lon: 0.008 }
];

// Calculates reflectivity (dBZ) at a given spatial point
function getRadarDbzAt(lat: number, lon: number): number {
  let maxDbz = 0;
  for (const storm of stormCells) {
    const dist = Math.sqrt(Math.pow(lat - storm.lat, 2) + Math.pow(lon - storm.lon, 2));
    if (dist < storm.radius) {
      // Linear degradation of reflectivity from center
      const factor = 1 - (dist / storm.radius);
      const cellDbz = Math.round(storm.peakDbz * factor);
      if (cellDbz > maxDbz) {
        maxDbz = cellDbz;
      }
    }
  }
  return maxDbz;
}

// Determines spatial shard based on longitude bounds
function getSpatialShard(lon: number): string {
  if (lon < 110.0) return "WID_SHARD"; // Western Indonesia Shard
  if (lon < 120.0) return "CID_SHARD"; // Central Indonesia Shard
  return "EID_SHARD"; // Eastern Indonesia Shard
}

// Core fusion operation
function executeDataFusion(ac: Aircraft, radarDbz: number): FusionResult {
  const shard = getSpatialShard(ac.longitude);
  
  // Decide risk status
  let status: FusionResult['riskStatus'] = 'SAFE';
  if (radarDbz >= settings.dangerDbzThreshold) status = 'DANGER';
  else if (radarDbz >= settings.warningDbzThreshold) status = 'WARNING';
  else if (radarDbz >= settings.cautionDbzThreshold) status = 'CAUTION';

  const fusion: FusionResult = {
    id: `fus-${Date.now()}-${ac.id}`,
    aircraftId: ac.id,
    callsign: ac.callsign,
    latitude: ac.latitude,
    longitude: ac.longitude,
    altitude: ac.altitude,
    heading: ac.heading,
    groundSpeed: ac.groundSpeed,
    radarDbz,
    riskStatus: status,
    timestamp: new Date().toISOString(),
    spatialShard: shard,
    consensusReplicated: true // Simulated Raft / Paxos replication
  };

  return fusion;
}

// Simulation loop triggered every scanIntervalMs
let simulationTimer: NodeJS.Timeout | null = null;
const wssClients = new Set<WebSocket>();

function startSimulationLoop() {
  if (simulationTimer) clearInterval(simulationTimer);

  simulationTimer = setInterval(() => {
    // 1. Update weather storm cells
    for (const storm of stormCells) {
      storm.lat += storm.v_lat;
      storm.lon += storm.v_lon;

      // Bounce storm cells inside simulation boundaries so they stay on screen
      if (storm.lat < -10.0 || storm.lat > -2.0) storm.v_lat *= -1;
      if (storm.lon < 102.0 || storm.lon > 125.0) storm.v_lon *= -1;
    }

    // 2. Update flights, fuse data, write to simulated Redis and Postgres sharded stores
    const activeFlights: Aircraft[] = [];
    const fusionResults: FusionResult[] = [];

    for (const flight of simulatedFlights) {
      // Move progress
      flight.progress += (flight.def.groundSpeed / 360000) * (settings.scanIntervalMs / 1000);
      if (flight.progress >= 1.0) {
        flight.progress = 0.0;
        flight.direction = flight.direction === 1 ? -1 : 1; // reverse flight
        flight.trail = [];
      }

      // Calculate coordinates based on current progression
      let curLat, curLon, curHeading;
      if (flight.direction === 1) {
        curLat = flight.def.startLat + (flight.def.endLat - flight.def.startLat) * flight.progress;
        curLon = flight.def.startLon + (flight.def.endLon - flight.def.startLon) * flight.progress;
        // Simple angle estimation
        const dy = flight.def.endLat - flight.def.startLat;
        const dx = flight.def.endLon - flight.def.startLon;
        curHeading = Math.round((Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360);
      } else {
        curLat = flight.def.endLat + (flight.def.startLat - flight.def.endLat) * flight.progress;
        curLon = flight.def.endLon + (flight.def.startLon - flight.def.endLon) * flight.progress;
        const dy = flight.def.startLat - flight.def.endLat;
        const dx = flight.def.startLon - flight.def.endLon;
        curHeading = Math.round((Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360);
      }

      // Perturb coordinate slightly for realistic ADS-B signal drift
      curLat += (Math.random() - 0.5) * 0.005;
      curLon += (Math.random() - 0.5) * 0.005;

      // Keep historical trails
      flight.trail.push([curLat, curLon]);
      if (flight.trail.length > 25) {
        flight.trail.shift();
      }

      // Aircraft profile representation
      const ac: Aircraft = {
        id: flight.def.callsign,
        callsign: flight.def.callsign,
        latitude: parseFloat(curLat.toFixed(5)),
        longitude: parseFloat(curLon.toFixed(5)),
        altitude: flight.def.altitude + Math.round((Math.random() - 0.5) * 200),
        heading: curHeading,
        groundSpeed: flight.def.groundSpeed + Math.round((Math.random() - 0.5) * 10),
        verticalSpeed: Math.round((Math.random() - 0.5) * 100),
        aircraftType: flight.def.aircraftType,
        route: `${flight.def.from} ➔ ${flight.def.to}`,
        trail: [...flight.trail],
        lastUpdated: new Date().toISOString()
      };

      activeFlights.push(ac);

      // Save to Simulated Redis Active cache
      redisStore.set(ac.id, ac);

      // Fusion Engine implementation
      const radarDbz = getRadarDbzAt(ac.latitude, ac.longitude);
      const fusion = executeDataFusion(ac, radarDbz);
      fusionResults.push(fusion);

      // Shard spatial mapping and log writes
      const shardId = fusion.spatialShard;
      
      // Update PostgreSQL Shards counter metadata
      const shardIndex = systemStats.postgres.shards.findIndex(s => s.id === shardId);
      if (shardIndex !== -1) {
        systemStats.postgres.shards[shardIndex].recordsCount += 1;
      }

      // Save record into Historical Database
      postgresHistoricalStore.push(fusion);
      if (postgresHistoricalStore.length > 500) {
        postgresHistoricalStore.shift();
      }

      // Consensus Log triggers for research documentation
      if (Math.random() < 0.15) {
        addDatabaseLog(
          'WRITE_REDIS', 
          'REDIS_MASTER', 
          `Active flight ${ac.callsign} cache updated. Eviction: TTL 180s.`
        );
        addDatabaseLog(
          'CONSENSUS_COMMIT', 
          'REDIS_MASTER', 
          `Consensus reached (Raft Term 4, Index ${Math.floor(Math.random() * 1000)}) to replicate flight state of ${ac.callsign}.`
        );
        addDatabaseLog(
          'WRITE_POSTGRES', 
          shardId, 
          `PostGIS record inserted: INSERT INTO spatial_flight_history(geom, callsign, dbz) VALUES(ST_SetSRID(ST_Point(${ac.longitude}, ${ac.latitude}), 4326), '${ac.callsign}', ${radarDbz}).`
        );
      }

      // Alert Warning triggers
      if (fusion.riskStatus !== 'SAFE') {
        const alreadyAlerted = activeAlerts.find(a => a.callsign === ac.callsign && a.status === fusion.riskStatus);
        if (!alreadyAlerted) {
          const alert: AlertNotification = {
            id: `alt-${Date.now()}-${ac.callsign}`,
            timestamp: new Date().toISOString(),
            callsign: ac.callsign,
            altitude: ac.altitude,
            dbz: radarDbz,
            status: fusion.riskStatus as AlertNotification['status'],
            message: `${ac.callsign} memasuki wilayah awan badai (reflektivitas ${radarDbz} dBZ) di wilayah shard ${shardId}. Segera rekomendasikan pengalihan arah penerbangan!`,
            latitude: ac.latitude,
            longitude: ac.longitude
          };
          activeAlerts.unshift(alert);
          if (activeAlerts.length > 30) activeAlerts.pop();

          addDatabaseLog(
            'PARTITION_ROUTING', 
            shardId, 
            `MET WEATHER WARNING: Flight ${ac.callsign} triggered ${fusion.riskStatus} alarm at ${radarDbz} dBZ in sharded zone.`,
            'WARNING'
          );
        }
      }
    }

    // Refresh dynamic system variables
    systemStats.redis.activeKeys = redisStore.size + activeAlerts.length + systemLogs.length;
    systemStats.feeds.connectedClients = wssClients.size;
    systemStats.feeds.fusionDelayMs = Math.round(25 + Math.random() * 20);

    // Broadcast the payload via WebSocket to clients
    const payload = JSON.stringify({
      type: 'REALTIME_UPDATE',
      flights: activeFlights,
      fusions: fusionResults,
      alerts: activeAlerts,
      stats: systemStats,
      stormCells
    });

    for (const ws of wssClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }

  }, settings.scanIntervalMs);
}

// Start simulation immediately
startSimulationLoop();


// --- REST API ENDPOINTS ---

// GET: Current Live Status
app.get('/api/status', (req, res) => {
  res.json(systemStats);
});

// GET: Filterable Historical Fusion logs
app.get('/api/history', (req, res) => {
  const { callsign, riskStatus, shard } = req.query;
  let results = [...postgresHistoricalStore];

  if (callsign) {
    results = results.filter(f => f.callsign.toLowerCase().includes((callsign as string).toLowerCase()));
  }
  if (riskStatus && riskStatus !== 'ALL') {
    results = results.filter(f => f.riskStatus === riskStatus);
  }
  if (shard && shard !== 'ALL') {
    results = results.filter(f => f.spatialShard === shard);
  }

  // Sorted by newest
  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(results);
});

// GET: Database sync logging entries for audit log visualizer
app.get('/api/logs', (req, res) => {
  res.json(systemLogs);
});

// GET: Current hazard/risk notifications
app.get('/api/alerts', (req, res) => {
  res.json(activeAlerts);
});

// POST: Save updated settings
app.post('/api/settings', (req, res) => {
  const newSettings: SystemSettings = req.body;
  settings = { ...settings, ...newSettings };
  
  systemStats.redis.replicationFactor = settings.redisReplicationCount;
  
  // Re-start simulation loop with new scan intervals
  startSimulationLoop();

  addDatabaseLog(
    'CONSENSUS_COMMIT', 
    'REDIS_MASTER', 
    `SBDT configurations re-propagated and stored successfully across all cluster nodes.`
  );

  res.json({ success: true, settings });
});

// GET: Fetch current settings
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

// POST: Authenticate user
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple administrative authentication for demonstration
  if (username === 'admin' && password === 'sbdt2026') {
    sessionUser = {
      email: 'frizz2301@gmail.com',
      role: 'Chief Operations Officer',
      name: 'Administrator SBDT'
    };
    return res.json({ success: true, user: sessionUser });
  }

  return res.status(401).json({ success: false, message: 'Username atau password salah. Silakan gunakan username: admin & password: sbdt2026' });
});

// POST: Logout user
app.post('/api/auth/logout', (req, res) => {
  sessionUser = null;
  res.json({ success: true });
});

// GET: Fetch active session
app.get('/api/auth/session', (req, res) => {
  res.json({ user: sessionUser });
});


// --- VITE INTERPRETATION AND PRODUCTION BINDING ---
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- WEBSOCKET UPGRADE ATTACHMENT ---
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws) => {
    wssClients.add(ws);
    
    // Send immediate initial handshake and current state
    const currentFlights = Array.from(redisStore.values());
    const initialPayload = JSON.stringify({
      type: 'HANDSHAKE_CONNECTED',
      flights: currentFlights,
      alerts: activeAlerts,
      stats: systemStats,
      stormCells
    });
    ws.send(initialPayload);

    ws.on('close', () => {
      wssClients.delete(ws);
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Fusion-Engine] SBDT Operations Core listening on http://0.0.0.0:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error("Critical error starting Express + SBDT Fusion Server: ", err);
});
