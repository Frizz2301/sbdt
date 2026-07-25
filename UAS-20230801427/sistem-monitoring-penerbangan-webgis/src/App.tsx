/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  Settings as SettingsIcon, 
  Activity, 
  RefreshCw, 
  Lock, 
  Compass, 
  MapPin, 
  Layers, 
  HelpCircle,
  Volume2,
  VolumeX,
  Database,
  CheckCircle2
} from 'lucide-react';
import { 
  Aircraft, 
  FusionResult, 
  AlertNotification, 
  SystemStatus, 
  DatabaseLog 
} from './types';

// Importing subcomponents
import Sidebar from './components/Sidebar';
import StatsCards from './components/StatsCards';
import MapContainer from './components/MapContainer';
import DatabaseVisualizer from './components/DatabaseVisualizer';
import HistoryLogs from './components/HistoryLogs';
import SettingsPanel from './components/SettingsPanel';
import AcademicPaper from './components/AcademicPaper';
import LoginModal from './components/LoginModal';
import FusionFeed from './components/FusionFeed';
import TelemetryChart from './components/TelemetryChart';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'webgis' | 'fusion' | 'db_cluster' | 'history' | 'settings' | 'paper'>('dashboard');
  const [flights, setFlights] = useState<Aircraft[]>([]);
  const [fusions, setFusions] = useState<FusionResult[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [logs, setLogs] = useState<DatabaseLog[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string; name: string } | null>(null);
  const [isSirenMuted, setIsSirenMuted] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // SBDT Telemetry data collection
  const [telemetryHistory, setTelemetryHistory] = useState<{
    time: string;
    fusionDelay: number;
    flightCount: number;
    writeRate: number;
  }[]>(() => {
    const arr = [];
    const baseTime = Date.now() - 15 * 1500;
    for (let i = 0; i < 15; i++) {
      const t = new Date(baseTime + i * 1500);
      const timeStr = t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      arr.push({
        time: timeStr,
        fusionDelay: Math.round(25 + Math.random() * 20),
        flightCount: 9,
        writeRate: 36 + Math.round(Math.random() * 5)
      });
    }
    return arr;
  });

  // Default initial metrics state
  const [stats, setStats] = useState<SystemStatus>({
    redis: { status: 'ONLINE', latencyMs: 1, activeKeys: 25, replicationFactor: 3, nodeRole: 'MASTER', cacheHitRate: 98.4 },
    postgres: {
      status: 'ONLINE',
      latencyMs: 3,
      shards: [
        { id: 'WID_SHARD', region: 'Sumatra, Java, West Kalimantan', recordsCount: 14202, status: 'ONLINE' },
        { id: 'CID_SHARD', region: 'Bali, Sulawesi, Nusa Tenggara, South Kalimantan', recordsCount: 9845, status: 'ONLINE' },
        { id: 'EID_SHARD', region: 'Maluku, Papua', recordsCount: 4123, status: 'ONLINE' }
      ],
      spatialIndexType: 'GIST (PostGIS)'
    },
    feeds: { adsb: 'CONNECTED', radar: 'CONNECTED', websocket: 'CONNECTED', connectedClients: 1, fusionDelayMs: 45 }
  });
  
  const [stormCells, setStormCells] = useState<any[]>([]);

  // Web Audio Context for acoustic alerts
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play warning audio tone if severe hazard is triggered
  const playSirenTone = (hz: number = 880, durationMs: number = 150) => {
    if (isSirenMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      // Fade out audio slightly
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      console.warn("Audio Context block:", e);
    }
  };

  // Check active session on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(err => console.warn("Session check offline:", err));
  }, []);

  // Poll database syncing logs
  const fetchDbLogs = () => {
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.warn("Log endpoint offline:", err));
  };

  useEffect(() => {
    fetchDbLogs();
    const interval = setInterval(fetchDbLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  // Set up Live WebSocket sync connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    let socket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    function connectWS() {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("[WebSocket] Connected to SBDT Real-Time Feed");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'REALTIME_UPDATE' || data.type === 'HANDSHAKE_CONNECTED') {
            if (data.flights) setFlights(data.flights);
            if (data.fusions) setFusions(data.fusions);
            if (data.alerts) {
              setAlerts(data.alerts);
              // Trigger acoustic alert tone if danger statuses exist
              const hasDanger = data.alerts.some((a: any) => a.status === 'DANGER');
              if (hasDanger) {
                playSirenTone(1000, 250);
              } else if (data.alerts.length > 0) {
                playSirenTone(660, 100);
              }
            }
            if (data.stats) {
              setStats(data.stats);
              
              // Append to telemetry history
              const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              setTelemetryHistory(prev => {
                const next = [
                  ...prev,
                  {
                    time: nowStr,
                    fusionDelay: data.stats.feeds.fusionDelayMs || 45,
                    flightCount: data.flights?.length || 0,
                    writeRate: (data.flights?.length || 0) * 4 + Math.round(Math.random() * 5)
                  }
                ];
                if (next.length > 15) next.shift();
                return next;
              });
            }
            if (data.stormCells) setStormCells(data.stormCells);
          }
        } catch (err) {
          console.warn("WebSocket parse error:", err);
        }
      };

      socket.onclose = () => {
        console.log("[WebSocket] Connection lost. Reconnecting in 3s...");
        reconnectTimeout = setTimeout(connectWS, 3000);
      };

      socket.onerror = (err) => {
        console.warn("[WebSocket] Error: ", err);
        socket.close();
      };
    }

    connectWS();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isSirenMuted]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Counter configurations for stats summary
  const dangerAlerts = alerts.filter(a => a.status === 'DANGER');
  const warningAlerts = alerts.filter(a => a.status === 'WARNING');
  const cautionAlerts = alerts.filter(a => a.status === 'CAUTION');

  // Filter flights list for live map sidebar
  const filteredFlights = flights.filter(f => 
    f.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="sbdt-aviation-app" className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* 1. Sidebar Panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'webgis') setSelectedFlightId(null);
        }}
        user={user}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        alertCount={alerts.length}
      />

      {/* 2. Main Work Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Control Header Bar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950 px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
            <h2 className="text-sm font-bold tracking-wider font-mono text-slate-300 uppercase">
              Flight Operations & Meteorology Fusion Control
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Audio Alert Toggle */}
            <button
              id="acoustic-siren-toggle"
              onClick={() => {
                setIsSirenMuted(!isSirenMuted);
                // Prompt browser to activate audio context
                playSirenTone(880, 50);
              }}
              title={isSirenMuted ? "Enable Sound Alarms" : "Mute Sound Alarms"}
              className={`p-2 rounded-lg border transition-all ${
                isSirenMuted 
                  ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
              }`}
            >
              {isSirenMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* User credentials badge */}
            {user ? (
              <span className="text-xs font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-semibold">
                OPERATOR ID: {user.name.split(' ')[0].toUpperCase()}
              </span>
            ) : (
              <span className="text-xs font-mono bg-slate-900 border border-slate-800 text-slate-500 px-3 py-1 rounded-full font-medium">
                READ-ONLY MONITOR
              </span>
            )}
          </div>
        </header>

        {/* Dynamic Inner Panel View Wrapper */}
        <div className="flex-1 overflow-y-auto bg-[#080b11]">
          
          {/* Tab 1: Dashboard Control */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 pb-8">
              {/* Metric rows */}
              <StatsCards 
                stats={stats} 
                flightsCount={flights.length}
                alertCount={alerts.length}
                dangerCount={dangerAlerts.length}
                warningCount={warningAlerts.length}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
                
                {/* Visual Map Overview Card (Quick action to full screen) */}
                <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-slate-900 flex flex-col space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">Live WebGIS Tactical Overview</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Archipelago Real-Time Coverage</p>
                    </div>
                    <button
                      id="dashboard-goto-map-btn"
                      onClick={() => setActiveTab('webgis')}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded transition-all"
                    >
                      Maximize Map GIS
                    </button>
                  </div>

                  {/* Lightweight miniature map viewport */}
                  <div className="flex-1 min-h-[300px] relative bg-slate-950/40 rounded-xl overflow-hidden border border-slate-900 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="text-center space-y-3 z-10 px-4">
                      <Compass className="h-10 w-10 text-indigo-400 mx-auto animate-spin" style={{ animationDuration: '30s' }} />
                      <div>
                        <p className="text-xs font-bold text-slate-300 font-mono">MAP COMPONENT LOADED IN ACTIVE CLUSTER</p>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto">
                          Klik tombol &ldquo;Maximize Map GIS&rdquo; atau tab menu untuk melihat visualisasi taktis Leaflet interaktif secara real-time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Urgent Weather Alerts Stream */}
                <div className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col h-[400px] shadow-xl">
                  <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-3 mb-3 flex items-center gap-2">
                    <Bell className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
                    <span>Acoustic Meteorological Warnings</span>
                  </h3>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {alerts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4 font-sans">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="text-xs font-bold text-slate-300">Semua Wilayah Penerbangan Aman</p>
                        <p className="text-[10px] text-slate-600 mt-1">Sinyal ADS-B mendeteksi seluruh penerbangan berada di luar koordinat refleksivitas badai.</p>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div 
                          key={alert.id}
                          onClick={() => {
                            setSelectedFlightId(alert.callsign);
                            setActiveTab('webgis');
                          }}
                          className={`p-3 rounded-lg border cursor-pointer hover:border-slate-700 transition-all ${
                            alert.status === 'DANGER' 
                              ? 'bg-rose-500/10 border-rose-500/25 text-rose-300' 
                              : alert.status === 'WARNING'
                                ? 'bg-orange-500/10 border-orange-500/25 text-orange-300'
                                : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="font-bold px-1.5 py-0.2 bg-slate-950 rounded border border-slate-800">{alert.callsign}</span>
                            <span className="font-semibold text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs font-sans mt-1.5 leading-snug">{alert.message}</p>
                          <div className="mt-2 text-[9px] font-mono flex justify-between text-slate-500">
                            <span>Reflectivity: {alert.dbz} dBZ</span>
                            <span>Altitude: {alert.altitude.toLocaleString()} FT</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Telemetry Chart Monitoring Row */}
              <div className="px-6 pb-6">
                <TelemetryChart data={telemetryHistory} />
              </div>
            </div>
          )}

          {/* Tab 2: Full WebGIS Interactive Map */}
          {activeTab === 'webgis' && (
            <div className="h-[calc(screen-16rem)] min-h-[500px] flex p-6 gap-6">
              {/* Side Flights Search Drawer */}
              <div className="w-80 h-full glass-panel p-4 rounded-xl border border-slate-900 flex flex-col shadow-2xl shrink-0">
                <div className="pb-3 border-b border-slate-900 mb-3 space-y-1.5">
                  <h3 className="font-bold text-xs font-mono text-slate-400 uppercase tracking-widest">Aviation Radar Contacts</h3>
                  <input
                    id="search-flights-sidebar-input"
                    type="text"
                    placeholder="Search callsign / route..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-700"
                  />
                </div>

                {/* Flights List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredFlights.length === 0 ? (
                    <p className="text-center text-slate-600 text-[11px] py-4">No radar contacts matching query.</p>
                  ) : (
                    filteredFlights.map((flight) => {
                      const isSelected = selectedFlightId === flight.id;
                      return (
                        <div
                          key={flight.id}
                          onClick={() => setSelectedFlightId(flight.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-indigo-950/20 border-indigo-500 shadow-md' 
                              : 'bg-slate-950/35 border-slate-900 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs font-mono text-slate-200">{flight.callsign}</span>
                            <span className="text-[10px] text-indigo-400 font-mono font-semibold uppercase">{flight.aircraftType}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-1">{flight.route}</p>
                          <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-500 border-t border-slate-900/40 pt-1.5">
                            <div>Alt: {flight.altitude.toLocaleString()} FT</div>
                            <div className="text-right">Speed: {flight.groundSpeed} KTS</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Central Map Target */}
              <div className="flex-1 h-full min-h-[450px]">
                <MapContainer 
                  flights={flights}
                  stormCells={stormCells}
                  activeAlerts={alerts}
                  selectedFlightId={selectedFlightId}
                  setSelectedFlightId={setSelectedFlightId}
                  dangerDbz={stats.redis.status === 'ONLINE' ? 50 : 50} // placeholder check
                  warningDbz={40}
                  cautionDbz={20}
                />
              </div>
            </div>
          )}

          {/* Tab 3: Fusion Processing */}
          {activeTab === 'fusion' && (
            <FusionFeed flights={flights} fusions={fusions} />
          )}

          {/* Tab 4: Database Cluster Visualizer */}
          {activeTab === 'db_cluster' && (
            <DatabaseVisualizer stats={stats} logs={logs} />
          )}

          {/* Tab 5: History Logs Registry */}
          {activeTab === 'history' && (
            <HistoryLogs 
              onSelectFlight={setSelectedFlightId} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
          )}

          {/* Tab 6: Operational Settings */}
          {activeTab === 'settings' && (
            <SettingsPanel onSettingsSaved={() => {
              // Refresh cluster metrics
              setStats(prev => ({
                ...prev,
                redis: {
                  ...prev.redis,
                  activeKeys: prev.redis.activeKeys + 1
                }
              }));
            }} />
          )}

          {/* Tab 7: Academic Report Paper */}
          {activeTab === 'paper' && (
            <AcademicPaper />
          )}

        </div>
      </main>

      {/* 3. Secure login modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={(authorizedUser) => {
          setUser(authorizedUser);
          // Auto route configuration triggers
          setStats(prev => ({
            ...prev,
            redis: {
              ...prev.redis,
              activeKeys: prev.redis.activeKeys + 1
            }
          }));
        }}
      />
    </div>
  );
}
