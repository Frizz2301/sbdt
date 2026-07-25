/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  DatabaseBackup, 
  Cpu, 
  ArrowRight, 
  Radio, 
  CheckCircle2, 
  Network, 
  HardDrive,
  Copy,
  Code
} from 'lucide-react';
import { SystemStatus, DatabaseLog } from '../types';

interface DatabaseVisualizerProps {
  stats: SystemStatus;
  logs: DatabaseLog[];
}

export default function DatabaseVisualizer({ stats, logs }: DatabaseVisualizerProps) {
  const [selectedNode, setSelectedNode] = useState<string>('REDIS_MASTER');
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(label);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const getStatusDot = (status: 'ONLINE' | 'OFFLINE') => (
    <span className={`inline-block h-2 w-2 rounded-full ${status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
  );

  return (
    <div id="sbdt-visualizer-container" className="p-6 space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Network className="h-5 w-5 text-indigo-400" />
          <span>SBDT Distributed Cluster Topology</span>
        </h2>
        <p className="text-xs text-slate-400">
          Visualisasi topologi Sistem Basis Data Terdistribusi (Distributed Storage, Partitioning, and Replication Engine) secara real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Redis Memory Store Topology (Active Cache) */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <DatabaseBackup className="h-5 w-5 text-indigo-400 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm text-slate-100">Redis Cache Cluster</h3>
                <span className="text-[10px] text-slate-500 font-mono">Active Memory Store</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
              REPLICATION: x{stats.redis.replicationFactor}
            </span>
          </div>

          {/* Redis Cluster Diagram Nodes */}
          <div className="space-y-3">
            {/* Master Node Card */}
            <div 
              onClick={() => setSelectedNode('REDIS_MASTER')}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                selectedNode === 'REDIS_MASTER' 
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-600/5' 
                  : 'bg-slate-900/30 border-slate-900 hover:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold font-mono text-slate-200">redis_node_master</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-indigo-400 font-bold bg-indigo-500/15 px-1 py-0.2 rounded">MASTER / WRITER</span>
                  {getStatusDot('ONLINE')}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                <div>Latency: <span className="text-slate-200">{stats.redis.latencyMs}ms</span></div>
                <div>Keys: <span className="text-slate-200">{stats.redis.activeKeys}</span></div>
              </div>
            </div>

            {/* Replica Node 1 Card */}
            <div 
              onClick={() => setSelectedNode('REDIS_REPLICA_1')}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                selectedNode === 'REDIS_REPLICA_1' 
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md' 
                  : 'bg-slate-900/30 border-slate-900 hover:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold font-mono text-slate-300">redis_node_replica_1</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1 py-0.2 rounded">READ_ONLY</span>
                  {getStatusDot('ONLINE')}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                <div>Lag: <span className="text-emerald-400 font-bold">0ms</span></div>
                <div>Sync: <span className="text-slate-200">100%</span></div>
              </div>
            </div>

            {/* Replica Node 2 Card */}
            <div 
              onClick={() => setSelectedNode('REDIS_REPLICA_2')}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                selectedNode === 'REDIS_REPLICA_2' 
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md' 
                  : 'bg-slate-900/30 border-slate-900 hover:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold font-mono text-slate-300">redis_node_replica_2</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1 py-0.2 rounded">READ_ONLY</span>
                  {getStatusDot('ONLINE')}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                <div>Lag: <span className="text-amber-400 font-bold">2ms</span></div>
                <div>Sync: <span className="text-slate-200">99.8%</span></div>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-lg space-y-1">
            <h4 className="text-[11px] font-bold text-slate-200 font-mono">Consensus Algorithm:</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
              Sinkronisasi cache aktif dikelola oleh konsensus berkala berkecepatan tinggi dengan protokol replikasi asinkronus ke server replika guna menjamin performa latency read &lt; 2ms.
            </p>
          </div>
        </div>

        {/* CENTER COLUMN: PostgreSQL / PostGIS Sharded Topology (Historical Store) */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm text-slate-100">PostgreSQL / PostGIS Shards</h3>
                <span className="text-[10px] text-slate-500 font-mono">Historical Spatial Partition</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              SHARDS: {stats.postgres.shards.length}
            </span>
          </div>

          {/* Sharded Database list */}
          <div className="space-y-3 flex-1">
            {stats.postgres.shards.map((shard) => (
              <div 
                key={shard.id}
                onClick={() => setSelectedNode(shard.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedNode === shard.id 
                    ? 'bg-emerald-950/20 border-emerald-500/80 shadow-md shadow-emerald-600/5' 
                    : 'bg-slate-900/30 border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold font-mono text-slate-200">{shard.id.toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-mono text-slate-400 bg-slate-800 px-1 py-0.2 rounded">SPATIAL INDEX</span>
                    {getStatusDot('ONLINE')}
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 mt-1 font-sans">{shard.region}</p>
                <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-400 border-t border-slate-900/60 pt-1.5">
                  <div>Table: <span className="text-slate-200">spatial_flight_history</span></div>
                  <div>Rows: <span className="text-emerald-400 font-bold">{shard.recordsCount.toLocaleString()}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-lg space-y-1">
            <h4 className="text-[11px] font-bold text-slate-200 font-mono">Spatial Boundary Sharding Rule:</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
              Partisi horizontal (sharding) dipetakan berdasarkan koordinat longitude: <span className="text-slate-300">WID_SHARD (&lt;110°E)</span>, <span className="text-slate-300">CID_SHARD (110°-120°E)</span>, dan <span className="text-slate-300">EID_SHARD (&gt;120°E)</span>.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive SQL Schema & Consensus Log Display */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-indigo-400" />
              <div>
                <h3 className="font-bold text-sm text-slate-100">SQL Schema & Consensus</h3>
                <span className="text-[10px] text-slate-500 font-mono">DDL & Transaction Engine</span>
              </div>
            </div>
          </div>

          {/* Render contextual description depending on node clicked */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {selectedNode.startsWith('REDIS') ? (
              <div className="space-y-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-300">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-900">
                    <span className="text-indigo-400 font-bold"># Redis Key Pattern</span>
                    <button 
                      onClick={() => copyToClipboard('SET aircraft_active:GIA123 "{\\"altitude\\":33000,\\"lat\\":-6.125,\\"lon\\":106.656,\\"speed\\":440}" EX 180', 'redis_key')}
                      className="text-slate-500 hover:text-slate-300 flex items-center gap-0.5"
                    >
                      {copiedQuery === 'redis_key' ? <span className="text-emerald-400 text-[8px]">Copied!</span> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <span className="text-indigo-500">SET</span> aircraft_active:GIA123 <span className="text-slate-400">{"\"{\\\"altitude\\\":33000, \\\"lat\\\":-6.125, \\\"lon\\\":106.656, \\\"speed\\\":440}\""}</span> <span className="text-indigo-500">EX</span> 180
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide font-mono">Consensus State:</h4>
                  <div className="text-[10px] font-mono space-y-1 text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                    <div className="flex justify-between"><span className="text-slate-500">Agreement Protocol:</span> <span className="text-indigo-400 font-semibold">Raft (Simulated)</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Current Term:</span> <span className="text-slate-200">4</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Cluster Consensus:</span> <span className="text-emerald-400 font-bold">✔ AGREED (3/3 nodes)</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">State Logs Sync:</span> <span className="text-slate-200">Active</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[9px] text-slate-300 leading-normal">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-900">
                    <span className="text-emerald-400 font-bold"># PostGIS DDL Schema</span>
                    <button 
                      onClick={() => copyToClipboard(
                        `CREATE TABLE spatial_flight_history (\n  id SERIAL PRIMARY KEY,\n  callsign VARCHAR(10) NOT NULL,\n  geom GEOMETRY(Point, 4326),\n  altitude INTEGER,\n  radar_dbz INTEGER,\n  risk_status VARCHAR(15),\n  timestamp TIMESTAMPTZ DEFAULT NOW()\n);\nCREATE INDEX gist_geom_idx ON spatial_flight_history USING GIST (geom);`, 
                        'postgis_ddl'
                      )}
                      className="text-slate-500 hover:text-slate-300 flex items-center gap-0.5"
                    >
                      {copiedQuery === 'postgis_ddl' ? <span className="text-emerald-400 text-[8px]">Copied!</span> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <span className="text-indigo-400">CREATE TABLE</span> spatial_flight_history (<br />
                  &nbsp;&nbsp;id <span className="text-indigo-400">SERIAL PRIMARY KEY</span>,<br />
                  &nbsp;&nbsp;callsign <span className="text-indigo-400">VARCHAR</span>(<span className="text-amber-500">10</span>) <span className="text-indigo-400">NOT NULL</span>,<br />
                  &nbsp;&nbsp;geom <span className="text-indigo-400">GEOMETRY</span>(<span className="text-emerald-400">Point</span>, <span className="text-amber-500">4326</span>),<br />
                  &nbsp;&nbsp;altitude <span className="text-indigo-400">INTEGER</span>,<br />
                  &nbsp;&nbsp;radar_dbz <span className="text-indigo-400">INTEGER</span>,<br />
                  &nbsp;&nbsp;risk_status <span className="text-indigo-400">VARCHAR</span>(<span className="text-amber-500">15</span>),<br />
                  &nbsp;&nbsp;timestamp <span className="text-indigo-400">TIMESTAMPTZ DEFAULT NOW</span>()<br />
                  );<br />
                  <span className="text-indigo-400">CREATE INDEX</span> gist_geom_idx <span className="text-indigo-400">ON</span> spatial_flight_history <span className="text-indigo-400">USING GIST</span> (geom);
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[9px] text-slate-300 leading-normal">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-900">
                    <span className="text-emerald-400 font-bold"># Spatial Search Query</span>
                    <button 
                      onClick={() => copyToClipboard(
                        `SELECT callsign, ST_AsText(geom) AS point_geom, ST_Distance(geom, ST_SetSRID(ST_Point(110.4, -6.9), 4326)) AS distance\nFROM spatial_flight_history\nWHERE ST_DWithin(geom, ST_SetSRID(ST_Point(110.4, -6.9), 4326), 1.2)\nORDER BY timestamp DESC;`, 
                        'spatial_query'
                      )}
                      className="text-slate-500 hover:text-slate-300 flex items-center gap-0.5"
                    >
                      {copiedQuery === 'spatial_query' ? <span className="text-emerald-400 text-[8px]">Copied!</span> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <span className="text-indigo-400">SELECT</span> callsign, ST_AsText(geom),<br />
                  &nbsp;&nbsp;ST_Distance(geom, ST_SetSRID(ST_Point(<span className="text-amber-500">110.4</span>, <span className="text-amber-500">-6.9</span>), <span className="text-amber-500">4326</span>))<br />
                  <span className="text-indigo-400">FROM</span> spatial_flight_history<br />
                  <span className="text-indigo-400">WHERE ST_DWithin</span>(geom, ST_SetSRID(ST_Point(<span className="text-amber-500">110.4</span>, <span className="text-amber-500">-6.9</span>), <span className="text-amber-500">4326</span>), <span className="text-amber-500">1.2</span>);
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg flex items-start gap-2 text-[10px] text-slate-400 font-sans">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Sistem ini mendemonstrasikan konsep <strong className="text-slate-200">Replication Factor = 3</strong> dan <strong className="text-slate-200">Horizontal Partition (Sharding)</strong> yang mutlak diperlukan untuk menyelesaikan tugas Sistem Basis Data Terdistribusi (SBDT).
            </span>
          </div>
        </div>
      </div>

      {/* LOWER ROW: Live Consensus Database Logs Feed */}
      <div className="glass-panel p-5 rounded-xl border border-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-100">Live Consensus Commit & Partitioning Logs</h3>
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Distributed Ledger Output</span>
        </div>

        <div className="h-48 overflow-y-auto space-y-1.5 pr-2 font-mono text-xs">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className="flex items-start gap-3 py-1.5 px-3 rounded bg-slate-950/40 border border-slate-900/60 hover:border-slate-800/80 transition-colors"
            >
              <span className="text-slate-500 text-[10px] shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
              
              <span className={`px-1.5 py-0.2 rounded text-[9px] shrink-0 font-bold ${
                log.operation === 'CONSENSUS_COMMIT' 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25' 
                  : log.operation === 'PARTITION_ROUTING'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                    : log.operation === 'WRITE_POSTGRES'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25'
              }`}>
                {log.operation}
              </span>

              <span className="text-slate-500 text-[10px] shrink-0 bg-slate-900 px-1 py-0.1 border border-slate-800 rounded font-bold uppercase">{log.nodeId}</span>
              
              <span className="text-slate-300 flex-1 break-all text-[11px] font-sans">{log.details}</span>

              <span className={`text-[9px] font-bold ${log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
