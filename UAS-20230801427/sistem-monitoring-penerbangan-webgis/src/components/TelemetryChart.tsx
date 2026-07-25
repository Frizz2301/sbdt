/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, Cpu, Database, Server, Clock, RefreshCw } from 'lucide-react';

interface TelemetryPoint {
  time: string;
  fusionDelay: number;
  flightCount: number;
  writeRate: number;
}

interface TelemetryChartProps {
  data: TelemetryPoint[];
}

export default function TelemetryChart({ data }: TelemetryChartProps) {
  const [activeMetric, setActiveMetric] = useState<'latency' | 'throughput' | 'density'>('latency');

  // SVG dimensions
  const width = 600;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Extract values based on active metric
  const getValues = () => {
    switch (activeMetric) {
      case 'latency':
        return data.map(d => d.fusionDelay);
      case 'throughput':
        return data.map(d => d.writeRate);
      case 'density':
        return data.map(d => d.flightCount);
    }
  };

  const values = getValues();
  const maxVal = Math.max(...values, 10) * 1.15; // padding top
  const minVal = 0;

  // Generate SVG coordinates
  const getCoordinates = () => {
    if (data.length === 0) return [];
    return data.map((d, index) => {
      const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
      const val = activeMetric === 'latency' ? d.fusionDelay : activeMetric === 'throughput' ? d.writeRate : d.flightCount;
      const y = height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartHeight;
      return { x, y, value: val, label: d.time };
    });
  };

  const coords = getCoordinates();

  // Create path strings
  const getLinePath = () => {
    if (coords.length === 0) return '';
    return coords.reduce((acc, coord, idx) => {
      return idx === 0 ? `M ${coord.x} ${coord.y}` : `${acc} L ${coord.x} ${coord.y}`;
    }, '');
  };

  const getAreaPath = () => {
    if (coords.length === 0) return '';
    const linePath = getLinePath();
    const firstX = coords[0].x;
    const lastX = coords[coords.length - 1].x;
    const baseY = height - paddingBottom;
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  const getMetricColor = () => {
    switch (activeMetric) {
      case 'latency': return { border: 'stroke-indigo-500', fill: 'url(#indigo-grad)', text: 'text-indigo-400', label: 'Fusion Delay (ms)' };
      case 'throughput': return { border: 'stroke-emerald-500', fill: 'url(#emerald-grad)', text: 'text-emerald-400', label: 'DB Writes/Sec' };
      case 'density': return { border: 'stroke-sky-500', fill: 'url(#sky-grad)', text: 'text-sky-400', label: 'Radar Targets' };
    }
  };

  const themeColor = getMetricColor();

  // Grid lines
  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps }).map((_, idx) => {
    const val = minVal + (idx / (gridSteps - 1)) * (maxVal - minVal);
    const y = height - paddingBottom - (idx / (gridSteps - 1)) * chartHeight;
    return { y, label: Math.round(val) };
  });

  return (
    <div id="telemetry-monitoring-chart" className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col space-y-4 shadow-xl">
      {/* Chart Headers & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3">
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-indigo-400" />
            <span>SBDT Operations & Performance Telemetry</span>
          </h3>
          <p className="text-[10px] text-slate-500 font-mono">Real-Time Data Fusion & Storage Performance Monitor</p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded border border-slate-900">
          <button
            id="tab-chart-latency"
            onClick={() => setActiveMetric('latency')}
            className={`px-3 py-1 text-[10px] font-mono font-bold rounded transition-all ${
              activeMetric === 'latency'
                ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            LATENCY (ms)
          </button>
          <button
            id="tab-chart-throughput"
            onClick={() => setActiveMetric('throughput')}
            className={`px-3 py-1 text-[10px] font-mono font-bold rounded transition-all ${
              activeMetric === 'throughput'
                ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            THROUGHPUT (W/s)
          </button>
          <button
            id="tab-chart-density"
            onClick={() => setActiveMetric('density')}
            className={`px-3 py-1 text-[10px] font-mono font-bold rounded transition-all ${
              activeMetric === 'density'
                ? 'bg-sky-600/20 border border-sky-500/30 text-sky-400'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            TARGETS
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto text-slate-500 overflow-visible"
        >
          {/* Definitions for Gradients */}
          <defs>
            <linearGradient id="indigo-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="emerald-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={line.y} 
                x2={width - paddingRight} 
                y2={line.y} 
                className="stroke-slate-900/60" 
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 8} 
                y={line.y + 3} 
                className="fill-slate-600 font-mono text-[9px] text-right"
                textAnchor="end"
              >
                {line.label}
              </text>
            </g>
          ))}

          {/* Area Path */}
          {coords.length > 0 && (
            <path 
              d={getAreaPath()} 
              fill={themeColor.fill}
              className="transition-all duration-300"
            />
          )}

          {/* Line Path */}
          {coords.length > 0 && (
            <path 
              d={getLinePath()} 
              fill="none" 
              className={`${themeColor.border} transition-all duration-300`}
              strokeWidth={1.8}
            />
          )}

          {/* Interactive Data Nodes */}
          {coords.map((coord, idx) => (
            <g key={idx} className="group cursor-pointer">
              {/* Invisible touch/hover target */}
              <circle 
                cx={coord.x} 
                cy={coord.y} 
                r={8} 
                className="fill-transparent hover:fill-slate-500/10 transition-colors"
              />
              {/* Real indicator node */}
              <circle 
                cx={coord.x} 
                cy={coord.y} 
                r={2.5} 
                className={`fill-slate-950 stroke-2 ${themeColor.border} transition-all`}
              />
              {/* Tooltip value on node hover */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                <rect 
                  x={coord.x - 22} 
                  y={coord.y - 22} 
                  width={44} 
                  height={15} 
                  rx={3} 
                  className="fill-slate-950 stroke stroke-slate-800" 
                  strokeWidth={1}
                />
                <text 
                  x={coord.x} 
                  y={coord.y - 12} 
                  className="fill-slate-200 font-mono text-[8px] font-bold text-center"
                  textAnchor="middle"
                >
                  {coord.value} {activeMetric === 'latency' ? 'ms' : activeMetric === 'throughput' ? 'W/s' : 'AC'}
                </text>
              </g>
            </g>
          ))}

          {/* X-Axis labels */}
          {coords.map((coord, idx) => {
            // Render labels on intervals to avoid crowding
            if (coords.length > 8 && idx % 2 !== 0 && idx !== coords.length - 1) return null;
            return (
              <text
                key={idx}
                x={coord.x}
                y={height - 8}
                className="fill-slate-600 font-mono text-[8px]"
                textAnchor="middle"
              >
                {coord.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Auxiliary Statistics Cards */}
      <div className="grid grid-cols-3 gap-3 pt-1 text-center font-mono">
        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-900/60">
          <span className="text-[9px] text-slate-500 uppercase block mb-1">Median Delay</span>
          <span className="text-sm font-bold text-indigo-400">
            {data.length > 0 ? Math.round(data.reduce((acc, d) => acc + d.fusionDelay, 0) / data.length) : 0} ms
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-900/60">
          <span className="text-[9px] text-slate-500 uppercase block mb-1">Avg Commit Rate</span>
          <span className="text-sm font-bold text-emerald-400">
            {data.length > 0 ? Math.round(data.reduce((acc, d) => acc + d.writeRate, 0) / data.length) : 0} ops/s
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-900/60">
          <span className="text-[9px] text-slate-500 uppercase block mb-1">Throughput Efficiency</span>
          <span className="text-sm font-bold text-sky-400">99.87%</span>
        </div>
      </div>
    </div>
  );
}
