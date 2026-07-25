/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Database, 
  Radio, 
  CloudRain, 
  CheckCircle2, 
  Server,
  RefreshCw
} from 'lucide-react';
import { SystemSettings } from '../types';

interface SettingsPanelProps {
  onSettingsSaved: () => void;
}

export default function SettingsPanel({ onSettingsSaved }: SettingsPanelProps) {
  const [config, setConfig] = useState<SystemSettings>({
    adsbUrl: "https://api.air-telemetry.net/adsb/v1/live",
    radarUrl: "https://api.bmkg.go.id/radar/v1/reflectivity",
    scanIntervalMs: 1500,
    redisReplicationCount: 3,
    spatialShardingCount: 3,
    dangerDbzThreshold: 50,
    warningDbzThreshold: 40,
    cautionDbzThreshold: 20
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch current config on load
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Error fetching settings:", err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        setSaveSuccess(true);
        onSettingsSaved();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="settings-container-panel" className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-900 pb-4">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-400" />
          <span>SBDT Operational Settings Panel</span>
        </h2>
        <p className="text-xs text-slate-400">
          Ubah konfigurasi kluster database terdistribusi, API feeds, dan ambang batas analisis risiko meteorologi penerbangan.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. API Feed Connections Settings */}
          <div className="glass-panel p-5 rounded-xl border border-slate-900 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-900">
              <Radio className="h-4 w-4 text-indigo-400" />
              <span>Distributed API Feeds</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">ADS-B Ground Receiver Feed</label>
                <input
                  id="settings-adsb-url"
                  type="text"
                  value={config.adsbUrl}
                  onChange={(e) => setConfig({ ...config, adsbUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">BMKG Meteorological Radar Feed</label>
                <input
                  id="settings-radar-url"
                  type="text"
                  value={config.radarUrl}
                  onChange={(e) => setConfig({ ...config, radarUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Fusion polling Interval (ms)</label>
                <input
                  id="settings-scan-interval"
                  type="number"
                  min="500"
                  max="10000"
                  value={config.scanIntervalMs}
                  onChange={(e) => setConfig({ ...config, scanIntervalMs: parseInt(e.target.value) || 1500 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. SBDT Distributed Storage Sizing */}
          <div className="glass-panel p-5 rounded-xl border border-slate-900 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-900">
              <Database className="h-4 w-4 text-emerald-400" />
              <span>Distributed Database Cluster</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Redis Cache Replication Factor</label>
                <select
                  id="settings-redis-replication"
                  value={config.redisReplicationCount}
                  onChange={(e) => setConfig({ ...config, redisReplicationCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="1">1 Node (Standalone No Replica)</option>
                  <option value="3">3 Nodes (1 Master + 2 Replicas)</option>
                  <option value="5">5 Nodes (1 Master + 4 Replicas)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">PostgreSQL / PostGIS Spatial Shards</label>
                <select
                  id="settings-spatial-shards"
                  value={config.spatialShardingCount}
                  onChange={(e) => setConfig({ ...config, spatialShardingCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  disabled
                >
                  <option value="3">3 Regional Shards (WID, CID, EID)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Meteorological dbZ Risk Limits */}
          <div className="glass-panel p-5 rounded-xl border border-slate-900 col-span-1 md:col-span-2 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-900">
              <CloudRain className="h-4 w-4 text-amber-500" />
              <span>Weather Reflectivity dBZ Threshold Analysis</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest block">Danger Limit (dBZ)</label>
                <input
                  id="settings-danger-dbz"
                  type="number"
                  min="45"
                  max="80"
                  value={config.dangerDbzThreshold}
                  onChange={(e) => setConfig({ ...config, dangerDbzThreshold: parseInt(e.target.value) || 50 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-rose-900/40 rounded-lg text-slate-300 font-mono text-xs focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest block">Warning Limit (dBZ)</label>
                <input
                  id="settings-warning-dbz"
                  type="number"
                  min="30"
                  max="44"
                  value={config.warningDbzThreshold}
                  onChange={(e) => setConfig({ ...config, warningDbzThreshold: parseInt(e.target.value) || 40 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-orange-900/40 rounded-lg text-slate-300 font-mono text-xs focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">Caution Limit (dBZ)</label>
                <input
                  id="settings-caution-dbz"
                  type="number"
                  min="10"
                  max="29"
                  value={config.cautionDbzThreshold}
                  onChange={(e) => setConfig({ ...config, cautionDbzThreshold: parseInt(e.target.value) || 20 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-amber-900/40 rounded-lg text-slate-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-900 pt-4">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Config successfully synced to cluster!</span>
            </div>
          )}
          
          <button
            id="save-settings-btn"
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg text-xs tracking-wide shadow-md transition-all font-sans"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Cluster Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
