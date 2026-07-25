/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  FileDown, 
  MapPin, 
  Calendar, 
  RefreshCw,
  Database,
  Grid
} from 'lucide-react';
import { FusionResult } from '../types';

interface HistoryLogsProps {
  onSelectFlight: (id: string | null) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function HistoryLogs({ onSelectFlight, activeTab, setActiveTab }: HistoryLogsProps) {
  const [history, setHistory] = useState<FusionResult[]>([]);
  const [searchCallsign, setSearchCallsign] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [filterShard, setFilterShard] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch from our API endpoint
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        callsign: searchCallsign,
        riskStatus: filterRisk,
        shard: filterShard
      });
      const res = await fetch(`/api/history?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Error fetching history: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [searchCallsign, filterRisk, filterShard]);

  // Export CSV generator
  const handleExportCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['ID', 'Callsign', 'Latitude', 'Longitude', 'Altitude (ft)', 'Heading (deg)', 'Speed (kts)', 'Radar Reflectivity (dBZ)', 'Risk Status', 'Spatial Partition', 'Timestamp'];
    const rows = history.map(row => [
      row.id,
      row.callsign,
      row.latitude,
      row.longitude,
      row.altitude,
      row.heading,
      row.groundSpeed,
      row.radarDbz,
      row.riskStatus,
      row.spatialShard,
      row.timestamp
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SBDT_AERO_MET_EXPORT_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Styled PDF Print sheet
  const handleExportPDF = () => {
    window.print();
  };

  const getRiskStyle = (status: FusionResult['riskStatus']) => {
    switch (status) {
      case 'DANGER': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'WARNING': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'CAUTION': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
  };

  return (
    <div id="history-section-container" className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            <span>Historical Flight & Meteorology Registry</span>
          </h2>
          <p className="text-xs text-slate-400">
            Arsip terpusat data ADS-B yang dilebur (fused) dengan reflektivitas radar BMKG dan disimpan pada kluster sharding PostgreSQL/PostGIS.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-lg text-xs font-semibold font-mono transition-all shadow"
          >
            <Download className="h-4 w-4 text-indigo-400" />
            <span>CSV Export</span>
          </button>
          <button
            id="export-pdf-btn"
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-lg text-xs font-semibold font-mono transition-all shadow"
          >
            <FileDown className="h-4 w-4 text-emerald-400" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Query Filters */}
      <div className="glass-panel p-4 rounded-xl border border-slate-900 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Callsign search */}
        <div className="space-y-1.5 col-span-1 md:col-span-2">
          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Search Callsign</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              id="search-callsign-input"
              type="text"
              placeholder="e.g. GIA123, LNI504"
              value={searchCallsign}
              onChange={(e) => setSearchCallsign(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Risk Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Meteorological Risk</label>
          <select
            id="filter-risk-select"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-colors font-mono"
          >
            <option value="ALL">ALL RISK LEVELS</option>
            <option value="SAFE">SAFE (&lt;20 dBZ)</option>
            <option value="CAUTION">CAUTION (20-40 dBZ)</option>
            <option value="WARNING">WARNING (40-50 dBZ)</option>
            <option value="DANGER">DANGER (&gt;50 dBZ)</option>
          </select>
        </div>

        {/* Shard Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Spatial partition Shard</label>
          <select
            id="filter-shard-select"
            value={filterShard}
            onChange={(e) => setFilterShard(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-colors font-mono"
          >
            <option value="ALL">ALL DB SHARDS</option>
            <option value="WID_SHARD">WID_SHARD (&lt;110°E)</option>
            <option value="CID_SHARD">CID_SHARD (110°-120°E)</option>
            <option value="EID_SHARD">EID_SHARD (&gt;120°E)</option>
          </select>
        </div>
      </div>

      {/* Registry Table */}
      <div className="glass-panel rounded-xl border border-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Callsign</th>
                <th className="py-3 px-4 font-semibold">Coordinates (Lat, Lon)</th>
                <th className="py-3 px-4 font-semibold">Altitude (FT)</th>
                <th className="py-3 px-4 font-semibold">Speed (KTS)</th>
                <th className="py-3 px-4 font-semibold">Radar dbz</th>
                <th className="py-3 px-4 font-semibold">Risk Status</th>
                <th className="py-3 px-4 font-semibold">Target Shard</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 font-mono text-xs text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                    <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin mx-auto mb-2" />
                    <span>Querying sharded PostgreSQL cluster...</span>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                    <span>Tidak ada data historis yang sesuai dengan kriteria filter.</span>
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-3 px-4 text-slate-500 text-[10px]">
                      {new Date(row.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-200">{row.callsign}</td>
                    <td className="py-3 px-4 text-slate-400">{row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}</td>
                    <td className="py-3 px-4">{row.altitude.toLocaleString()} FT</td>
                    <td className="py-3 px-4">{row.groundSpeed} KTS</td>
                    <td className="py-3 px-4 font-bold text-indigo-300">{row.radarDbz} dBZ</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${getRiskStyle(row.riskStatus)}`}>
                        {row.riskStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 text-slate-400 font-bold uppercase">
                        {row.spatialShard}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          onSelectFlight(row.aircraftId);
                          setActiveTab('webgis');
                        }}
                        className="px-2 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded text-[10px] font-semibold transition-all"
                      >
                        Locate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
