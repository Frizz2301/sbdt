/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Plane, 
  AlertTriangle, 
  ShieldAlert, 
  Database, 
  Activity, 
  Clock, 
  Radio, 
  CloudRain,
  Cpu
} from 'lucide-react';
import { SystemStatus } from '../types';

interface StatsCardsProps {
  stats: SystemStatus;
  flightsCount: number;
  alertCount: number;
  dangerCount: number;
  warningCount: number;
}

export default function StatsCards({ 
  stats, 
  flightsCount, 
  alertCount, 
  dangerCount, 
  warningCount 
}: StatsCardsProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const getStatusBadge = (status: 'ONLINE' | 'OFFLINE' | 'CONNECTED' | 'DISCONNECTED') => {
    const isGood = status === 'ONLINE' || status === 'CONNECTED';
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
        isGood 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      }`}>
        {status}
      </span>
    );
  };

  return (
    <div id="stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      {/* 1. Realtime UTC / Local Operational Clock */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-lg">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase">System Clock (WIB)</p>
          <p className="text-2xl font-mono font-bold text-slate-100 tracking-tight">
            {formatTime(time)}
          </p>
          <p className="text-[9px] font-mono text-slate-500">UTC+7 • Jakarta Time</p>
        </div>
        <div className="h-12 w-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Clock className="h-6 w-6 text-indigo-400 animate-pulse" />
        </div>
      </div>

      {/* 2. Active Flights Stats */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-lg">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase">Active Flights (ADS-B)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-100 tracking-tight">{flightsCount}</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">● Live Feed</span>
          </div>
          <p className="text-[9px] font-mono text-slate-500">Polling: {stats.feeds.fusionDelayMs}ms latency</p>
        </div>
        <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Plane className="h-6 w-6 text-emerald-400 animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
      </div>

      {/* 3. Weather Alerts (Warning vs Danger) */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-lg">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase">Meteorological Risks</p>
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-400">{warningCount}</span>
              <span className="text-[10px] text-amber-500 font-mono font-bold">Caution</span>
            </div>
            <div className="h-4 w-px bg-slate-800"></div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-rose-500">{dangerCount}</span>
              <span className="text-[10px] text-rose-500 font-mono font-bold">Hazard</span>
            </div>
          </div>
          <p className="text-[9px] font-mono text-slate-500">Fusion alert queue: {alertCount} active</p>
        </div>
        <div className="h-12 w-12 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          {dangerCount > 0 ? (
            <ShieldAlert className="h-6 w-6 text-rose-400 animate-bounce" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-amber-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* 4. Distributed Systems Status Summary */}
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase">Storage Cluster Nodes</span>
          <Cpu className="h-4 w-4 text-slate-500" />
        </div>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          <div className="flex items-center justify-between text-[10px] font-mono bg-slate-900/40 px-2 py-1 rounded border border-slate-900">
            <span className="text-slate-400">Redis Active:</span>
            {getStatusBadge(stats.redis.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE')}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono bg-slate-900/40 px-2 py-1 rounded border border-slate-900">
            <span className="text-slate-400">PostGIS Shards:</span>
            {getStatusBadge(stats.postgres.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE')}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono bg-slate-900/40 px-2 py-1 rounded border border-slate-900">
            <span className="text-slate-400">ADS-B Feed:</span>
            {getStatusBadge(stats.feeds.adsb)}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono bg-slate-900/40 px-2 py-1 rounded border border-slate-900">
            <span className="text-slate-400">BMKG Radar:</span>
            {getStatusBadge(stats.feeds.radar)}
          </div>
        </div>
      </div>
    </div>
  );
}
