/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Aircraft {
  id: string;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number; // in feet
  heading: number; // in degrees (0-359)
  groundSpeed: number; // in knots
  verticalSpeed: number; // in feet per minute
  aircraftType: string;
  route: string;
  trail: [number, number][]; // array of [lat, lon]
  lastUpdated: string;
}

export interface RadarPoint {
  lat: number;
  lon: number;
  dbz: number; // reflectivity value
  status: 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER';
}

export interface FusionResult {
  id: string; // fusion log id
  aircraftId: string;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  groundSpeed: number;
  radarDbz: number;
  riskStatus: 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER';
  timestamp: string;
  spatialShard: string; // e.g., "WID_SHARD" (Western), "CID_SHARD" (Central), "EID_SHARD" (Eastern)
  consensusReplicated: boolean; // Paxos / Raft replication status
}

export interface SystemStatus {
  redis: {
    status: 'ONLINE' | 'OFFLINE';
    latencyMs: number;
    activeKeys: number;
    replicationFactor: number;
    nodeRole: 'MASTER' | 'REPLICA_1' | 'REPLICA_2';
    cacheHitRate: number;
  };
  postgres: {
    status: 'ONLINE' | 'OFFLINE';
    latencyMs: number;
    shards: {
      id: string;
      region: string;
      recordsCount: number;
      status: 'ONLINE' | 'OFFLINE';
    }[];
    spatialIndexType: string; // "GIST (PostGIS)"
  };
  feeds: {
    adsb: 'CONNECTED' | 'DISCONNECTED';
    radar: 'CONNECTED' | 'DISCONNECTED';
    websocket: 'CONNECTED' | 'DISCONNECTED';
    connectedClients: number;
    fusionDelayMs: number;
  };
}

export interface DatabaseLog {
  id: string;
  timestamp: string;
  operation: 'WRITE_REDIS' | 'WRITE_POSTGRES' | 'SYNC_BATCH' | 'PARTITION_ROUTING' | 'REPLICATION_SYNC' | 'CONSENSUS_COMMIT';
  nodeId: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface AlertNotification {
  id: string;
  timestamp: string;
  callsign: string;
  altitude: number;
  dbz: number;
  status: 'CAUTION' | 'WARNING' | 'DANGER';
  message: string;
  latitude: number;
  longitude: number;
}

export interface SystemSettings {
  adsbUrl: string;
  radarUrl: string;
  scanIntervalMs: number;
  redisReplicationCount: number;
  spatialShardingCount: number;
  dangerDbzThreshold: number;
  warningDbzThreshold: number;
  cautionDbzThreshold: number;
}
