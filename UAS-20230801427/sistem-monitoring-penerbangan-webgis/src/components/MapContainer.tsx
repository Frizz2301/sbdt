/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Aircraft, AlertNotification } from '../types';
import { Layers, Shield, RefreshCw } from 'lucide-react';

interface MapContainerProps {
  flights: Aircraft[];
  stormCells: any[];
  activeAlerts: AlertNotification[];
  selectedFlightId: string | null;
  setSelectedFlightId: (id: string | null) => void;
  dangerDbz: number;
  warningDbz: number;
  cautionDbz: number;
}

export default function MapContainer({
  flights,
  stormCells,
  activeAlerts,
  selectedFlightId,
  setSelectedFlightId,
  dangerDbz,
  warningDbz,
  cautionDbz
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const trailsRef = useRef<{ [key: string]: L.Polyline }>({});
  const stormsRef = useRef<L.Circle[]>([]);
  
  // Layer controls (Original simple states)
  const [showFlights, setShowFlights] = useState(true);
  const [showRadar, setShowRadar] = useState(true);
  const [showTrails, setShowTrails] = useState(true);

  // Inject Leaflet CSS dynamically to guarantee correct display inside our iframe
  useEffect(() => {
    const leafletCssId = 'leaflet-cdn-css';
    if (!document.getElementById(leafletCssId)) {
      const link = document.createElement('link');
      link.id = leafletCssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Initialize Map object (centered on Central Indonesia)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-4.5, 115.0],
      zoom: 5,
      zoomControl: false,
      minZoom: 4,
      maxZoom: 11,
      attributionControl: false
    });

    // Zoom control positioned on the top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Static CartoDB Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      attribution: 'SBDT GeoGIS Systems'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Storm Radar Cell Overlays
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove stale radar cells
    stormsRef.current.forEach(circle => circle.remove());
    stormsRef.current = [];

    if (!showRadar) return;

    stormCells.forEach((storm) => {
      // 1. Core High Reflectivity Cell (>50 dBZ)
      const centerCircle = L.circle([storm.lat, storm.lon], {
        radius: storm.radius * 20000,
        color: '#ef4444',
        weight: 1.5,
        fillColor: '#ef4444',
        fillOpacity: 0.35
      }).addTo(map);

      // 2. Warning Envelope (40-50 dBZ)
      const warningCircle = L.circle([storm.lat, storm.lon], {
        radius: storm.radius * 50000,
        color: '#f97316',
        weight: 1.2,
        fillColor: '#f97316',
        fillOpacity: 0.22
      }).addTo(map);

      // 3. Caution Fringe (20-40 dBZ)
      const outerCircle = L.circle([storm.lat, storm.lon], {
        radius: storm.radius * 100000,
        color: '#f59e0b',
        weight: 0.8,
        fillColor: '#eab308',
        fillOpacity: 0.1
      }).addTo(map);

      stormsRef.current.push(centerCircle, warningCircle, outerCircle);
    });

  }, [stormCells, showRadar]);

  // Calculate local dBZ peak value at airplane location
  const getRadarDbzAtFlight = (flight: Aircraft): number => {
    let maxDbz = 0;
    stormCells.forEach((storm) => {
      const dist = Math.sqrt(Math.pow(flight.latitude - storm.lat, 2) + Math.pow(flight.longitude - storm.lon, 2));
      if (dist < storm.radius) {
        const factor = 1 - (dist / storm.radius);
        const cellDbz = Math.round(storm.peakDbz * factor);
        if (cellDbz > maxDbz) maxDbz = cellDbz;
      }
    });
    return maxDbz;
  };

  // Update Active Flight Trails Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!showTrails) {
      Object.keys(trailsRef.current).forEach((key) => {
        trailsRef.current[key].remove();
        delete trailsRef.current[key];
      });
      return;
    }

    flights.forEach((flight) => {
      if (flight.trail && flight.trail.length > 1) {
        const radarDbz = getRadarDbzAtFlight(flight);
        let trailColor = '#4f46e5'; // default indigo
        if (radarDbz >= dangerDbz) trailColor = '#ef4444';
        else if (radarDbz >= warningDbz) trailColor = '#f97316';
        else if (radarDbz >= cautionDbz) trailColor = '#f59e0b';

        if (selectedFlightId === flight.id) {
          trailColor = '#38bdf8'; // Highlight selected
        }

        const isSelected = selectedFlightId === flight.id;

        if (trailsRef.current[flight.id]) {
          trailsRef.current[flight.id].setLatLngs(flight.trail);
          trailsRef.current[flight.id].setStyle({
            color: trailColor,
            weight: isSelected ? 3 : 1.5,
            dashArray: isSelected ? undefined : '3, 5'
          });
        } else {
          const polyline = L.polyline(flight.trail, {
            color: trailColor,
            weight: isSelected ? 3 : 1.5,
            dashArray: isSelected ? undefined : '3, 5',
            opacity: 0.8
          }).addTo(map);

          trailsRef.current[flight.id] = polyline;
        }
      }
    });

    // Cleanup obsolete flight trails
    Object.keys(trailsRef.current).forEach((key) => {
      if (!flights.find(f => f.id === key)) {
        trailsRef.current[key].remove();
        delete trailsRef.current[key];
      }
    });

  }, [flights, showTrails, selectedFlightId]);

  // Update Flight markers, headings, rotations & popups
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!showFlights) {
      Object.keys(markersRef.current).forEach((key) => {
        markersRef.current[key].remove();
        delete markersRef.current[key];
      });
      return;
    }

    flights.forEach((flight) => {
      const radarDbz = getRadarDbzAtFlight(flight);
      
      let statusColor = 'text-emerald-400';
      let bgColor = 'bg-emerald-500/20';
      let borderColor = 'border-emerald-500';
      let rippleAnimation = '';

      if (radarDbz >= dangerDbz) {
        statusColor = 'text-rose-500 font-bold';
        bgColor = 'bg-rose-500/20';
        borderColor = 'border-rose-500';
        rippleAnimation = 'animate-danger-pulse border-2';
      } else if (radarDbz >= warningDbz) {
        statusColor = 'text-orange-500';
        bgColor = 'bg-orange-500/20';
        borderColor = 'border-orange-500';
        rippleAnimation = 'animate-warning-pulse border';
      } else if (radarDbz >= cautionDbz) {
        statusColor = 'text-amber-500';
        bgColor = 'bg-amber-500/20';
        borderColor = 'border-amber-500';
      }

      if (selectedFlightId === flight.id) {
        statusColor = 'text-sky-400 font-black';
        bgColor = 'bg-sky-400/30';
        borderColor = 'border-sky-400 scale-110';
      }

      const customHtmlIcon = `
        <div class="relative flex items-center justify-center w-10 h-10">
          <div class="absolute inset-0 rounded-full ${bgColor} ${borderColor} ${rippleAnimation}"></div>
          
          <div style="transform: rotate(${flight.heading}deg);" class="absolute transition-transform duration-300">
            <svg class="w-6 h-6 ${statusColor}" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/>
            </svg>
          </div>
          
          <span class="absolute -bottom-5 bg-slate-950/90 text-[8px] font-mono border border-slate-800 text-slate-300 px-1 py-0.2 rounded shadow whitespace-nowrap z-30 pointer-events-none">
            ${flight.callsign}
          </span>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: customHtmlIcon,
        className: 'custom-flight-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const riskBadge = radarDbz >= dangerDbz 
        ? '<span class="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-400 font-mono text-[9px] font-bold font-sans">DANGER HAZARD</span>'
        : radarDbz >= warningDbz
          ? '<span class="px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono text-[9px] font-bold font-sans">WARNING CAUTION</span>'
          : radarDbz >= cautionDbz
            ? '<span class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono text-[9px] font-bold font-sans">CAUTION ZONE</span>'
            : '<span class="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold font-sans">SAFE FLIGHT</span>';

      const cardinal = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(flight.heading / 45) % 8];

      const popupHtml = `
        <div class="p-3 w-56 font-sans text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <div>
              <h3 class="font-bold text-sm tracking-tight text-white">${flight.callsign}</h3>
              <p class="text-[9px] text-slate-500 font-mono font-semibold uppercase">${flight.aircraftType}</p>
            </div>
            ${riskBadge}
          </div>
          
          <div class="space-y-1.5 text-xs font-mono">
            <div class="flex justify-between">
              <span class="text-slate-500 text-[10px]">Route:</span>
              <span class="text-indigo-300 text-right font-medium max-w-[120px] truncate">${flight.route}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 text-[10px]">Altitude:</span>
              <span class="text-slate-300">${flight.altitude.toLocaleString()} FT</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 text-[10px]">Speed:</span>
              <span class="text-slate-300">${flight.groundSpeed} KTS</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 text-[10px]">Heading:</span>
              <span class="text-slate-300">${flight.heading}° (${cardinal})</span>
            </div>
            <div class="h-px bg-slate-800 my-1.5"></div>
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400">BMKG Radar:</span>
              <span class="font-bold font-mono ${
                radarDbz >= dangerDbz ? 'text-rose-400' : radarDbz >= warningDbz ? 'text-orange-400' : radarDbz >= cautionDbz ? 'text-amber-400' : 'text-emerald-400'
              }">${radarDbz} dBZ</span>
            </div>
            <div class="text-[9px] text-slate-500 text-right mt-1.5">
              Lat: ${flight.latitude.toFixed(4)}, Lon: ${flight.longitude.toFixed(4)}
            </div>
          </div>
        </div>
      `;

      if (markersRef.current[flight.id]) {
        markersRef.current[flight.id].setLatLng([flight.latitude, flight.longitude]);
        markersRef.current[flight.id].setIcon(markerIcon);
        markersRef.current[flight.id].setPopupContent(popupHtml);
      } else {
        const marker = L.marker([flight.latitude, flight.longitude], { icon: markerIcon })
          .addTo(map)
          .bindPopup(popupHtml, { closeButton: false });

        marker.on('click', () => {
          setSelectedFlightId(flight.id);
        });

        markersRef.current[flight.id] = marker;
      }
    });

    // Remove obsolete flight markers
    Object.keys(markersRef.current).forEach((key) => {
      if (!flights.find(f => f.id === key)) {
        markersRef.current[key].remove();
        delete markersRef.current[key];
      }
    });

  }, [flights, showFlights, selectedFlightId, stormCells, dangerDbz, warningDbz, cautionDbz]);

  // Center/Pan automatically on flight selected
  useEffect(() => {
    if (selectedFlightId && mapRef.current) {
      const flight = flights.find(f => f.id === selectedFlightId);
      if (flight) {
        mapRef.current.setView([flight.latitude, flight.longitude], 6.5, {
          animate: true,
          duration: 1
        });
        
        setTimeout(() => {
          if (markersRef.current[selectedFlightId]) {
            markersRef.current[selectedFlightId].openPopup();
          }
        }, 500);
      }
    }
  }, [selectedFlightId]);

  return (
    <div id="webgis-card" className="flex-1 w-full rounded-xl overflow-hidden glass-panel border border-slate-900 shadow-2xl flex flex-col bg-slate-950">
      
      {/* Map Target Render Container */}
      <div 
        id="leaflet-gis-map"
        ref={mapContainerRef} 
        className="w-full h-[450px] md:h-[480px] z-0 focus:outline-none"
      />

      {/* Control Panels Zone: Rendered side-by-side below the map canvas */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/80 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. GIS Control Console Layer Panel */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold font-mono text-slate-200 tracking-wider">GIS LAYER CONTROLLER</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 font-sans">
            {/* Aircraft Toggle */}
            <label className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-900 hover:bg-slate-900/20 cursor-pointer transition-all">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Aircraft Markers
              </span>
              <input 
                type="checkbox"
                checked={showFlights}
                onChange={(e) => setShowFlights(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
              />
            </label>

            {/* Weather Radar Toggle */}
            <label className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-900 hover:bg-slate-900/20 cursor-pointer transition-all">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                Weather Radar
              </span>
              <input 
                type="checkbox"
                checked={showRadar}
                onChange={(e) => setShowRadar(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 cursor-pointer"
              />
            </label>

            {/* Flight Trails Toggle */}
            <label className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-900 hover:bg-slate-900/20 cursor-pointer transition-all">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                Path Trails
              </span>
              <input 
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* 2. Weather dBZ Reflectivity Scale Legend */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col space-y-3">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-900 text-xs font-bold text-slate-200 uppercase tracking-wide">
            <Shield className="h-4 w-4 text-indigo-400" />
            <span>Weather dBZ Reflectivity Scale</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-950/40 border border-slate-900/40">
              <span className="h-2.5 w-2.5 rounded-sm bg-rose-500/70 shrink-0"></span>
              <div className="flex flex-col">
                <span className="text-rose-400 font-bold font-sans">DANGER</span>
                <span className="text-[8px] text-slate-500">&gt;50 dBZ Storm</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-950/40 border border-slate-900/40">
              <span className="h-2.5 w-2.5 rounded-sm bg-orange-500/70 shrink-0"></span>
              <div className="flex flex-col">
                <span className="text-orange-400 font-bold font-sans">WARNING</span>
                <span className="text-[8px] text-slate-500">40-50 dBZ Rain</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-950/40 border border-slate-900/40">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/70 shrink-0"></span>
              <div className="flex flex-col">
                <span className="text-amber-400 font-bold font-sans">CAUTION</span>
                <span className="text-[8px] text-slate-500">20-40 dBZ Showers</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-950/40 border border-slate-900/40">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/70 shrink-0"></span>
              <div className="flex flex-col">
                <span className="text-emerald-400 font-bold font-sans">SAFE</span>
                <span className="text-[8px] text-slate-500">&lt;20 dBZ Clear</span>
              </div>
            </div>
          </div>

          {selectedFlightId && (
            <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between">
              <span className="text-[9px] font-semibold text-sky-400">Selected flight is tracked on radar</span>
              <button
                id="clear-gis-select-btn"
                onClick={() => setSelectedFlightId(null)}
                className="text-[9px] font-bold text-slate-400 hover:text-slate-200 font-mono flex items-center gap-1 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-900 transition-colors"
              >
                <RefreshCw className="h-2 w-2" />
                <span>Reset selection</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
