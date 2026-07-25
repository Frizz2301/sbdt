/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Radio, 
  Cpu, 
  ArrowRight, 
  Code, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  FileJson,
  Layers,
  MapPin
} from 'lucide-react';
import { Aircraft, FusionResult } from '../types';

interface FusionFeedProps {
  flights: Aircraft[];
  fusions: FusionResult[];
}

export default function FusionFeed({ flights, fusions }: FusionFeedProps) {
  const [selectedFusionId, setSelectedFusionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeFusion = fusions.find(f => f.id === selectedFusionId) || fusions[0];

  // Helper to generate compliant GeoJSON Feature Collection representing the fusion result
  const generateGeoJson = (f: FusionResult): string => {
    if (!f) return "{}";
    const geojson = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [f.longitude, f.latitude]
      },
      properties: {
        id: f.id,
        aircraftId: f.aircraftId,
        callsign: f.callsign,
        altitude_ft: f.altitude,
        heading_deg: f.heading,
        groundSpeed_kts: f.groundSpeed,
        radar_dbz: f.radarDbz,
        risk_status: f.riskStatus,
        spatial_shard: f.spatialShard,
        timestamp: f.timestamp
      }
    };
    return JSON.stringify(geojson, null, 2);
  };

  const copyGeoJson = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskColor = (status: string) => {
    switch (status) {
      case 'DANGER': return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
      case 'WARNING': return 'text-orange-400 border-orange-500/20 bg-orange-500/5';
      case 'CAUTION': return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
      default: return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    }
  };

  return (
    <div id="fusion-engine-section" className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Radio className="h-5 w-5 text-indigo-400 animate-pulse" />
          <span>Real-Time Meteorological Data Fusion Engine</span>
        </h2>
        <p className="text-xs text-slate-400">
          Sistem penyelarasan spasial (Spatial Alignment) dan temporal (Timestamp Matching) yang meleburkan sinyal ADS-B pesawat dengan reflektivitas radar BMKG.
        </p>
      </div>

      {/* Fusion Flow Steps Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Step 1 */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-1">
          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Step 1: ADSB Input</span>
          <h4 className="font-bold text-xs text-slate-200">ADS-B Stream Poller</h4>
          <p className="text-[10px] text-slate-500 leading-normal">
            Mengambil koordinat lintang, bujur, ketinggian, dan kecepatan pesawat secara real-time dari transponder udara.
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-1">
          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Step 2: Radar Sync</span>
          <h4 className="font-bold text-xs text-slate-200">BMKG Radar Alignment</h4>
          <p className="text-[10px] text-slate-500 leading-normal">
            Mengekstrak data reflektivitas radar cuaca regional terdekat dalam bentuk koordinat spasial multi-dimensi.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-1">
          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Step 3: Distance Check</span>
          <h4 className="font-bold text-xs text-slate-200">Spatial Distance Calculation</h4>
          <p className="text-[10px] text-slate-500 leading-normal">
            Menghitung nilai dBZ terdekat di posisi koordinat pesawat menggunakan algoritma spatial distance.
          </p>
        </div>

        {/* Step 4 */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-1">
          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Step 4: Output GeoJSON</span>
          <h4 className="font-bold text-xs text-slate-200">JSON/GeoJSON Generator</h4>
          <p className="text-[10px] text-slate-500 leading-normal">
            Menyusun data fusi spasial terpadu ke dalam objek standar GeoJSON untuk divisualisasikan langsung pada WebGIS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Active Fused Flights List */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-slate-900 flex flex-col h-[480px]">
          <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
            <span>Penerbangan yang Dilebur (Live Fusions)</span>
            <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
              {fusions.length} ACTIVE
            </span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {fusions.map((fus) => (
              <div
                key={fus.id}
                onClick={() => setSelectedFusionId(fus.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  (selectedFusionId === fus.id || (!selectedFusionId && fusions[0]?.id === fus.id))
                    ? 'bg-indigo-950/20 border-indigo-500' 
                    : 'bg-slate-950/20 border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-200 font-mono">{fus.callsign}</h4>
                    <span className="text-[9px] text-slate-500 font-mono uppercase">{fus.spatialShard}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getRiskColor(fus.riskStatus)}`}>
                    {fus.radarDbz} dBZ • {fus.riskStatus}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Alt: {fus.altitude.toLocaleString()} FT</span>
                  <span>Lat: {fus.latitude.toFixed(3)}, Lon: {fus.longitude.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic GeoJSON Live Inspector */}
        <div className="lg:col-span-3 glass-panel p-5 rounded-xl border border-slate-900 flex flex-col h-[480px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-indigo-400" />
              <div>
                <h3 className="font-bold text-sm text-slate-100">Live Spatial GeoJSON Inspector</h3>
                <span className="text-[10px] text-slate-500 font-mono">Real-time fusion payload</span>
              </div>
            </div>
            
            {activeFusion && (
              <button
                id="copy-geojson-btn"
                onClick={() => copyGeoJson(generateGeoJson(activeFusion))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold font-mono transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Copy GeoJSON</span>
                  </>
                )}
              </button>
            )}
          </div>

          {activeFusion ? (
            <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[10px] text-slate-300 overflow-y-auto leading-normal">
              <pre>{generateGeoJson(activeFusion)}</pre>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-sans">
              <Radio className="h-8 w-8 text-slate-700 animate-pulse mb-2" />
              <span>Menunggu data stream dari sistem...</span>
            </div>
          )}

          <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-lg flex items-center gap-2 text-[10px] text-slate-400 mt-3">
            <Layers className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>
              Format GeoJSON ini kompatibel penuh dengan pustaka SIG standar seperti Leaflet.js, OpenLayers, MapLibre, maupun QGIS Desktop.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
