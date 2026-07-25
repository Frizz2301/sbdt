/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Database, 
  History, 
  Settings as SettingsIcon, 
  FileText, 
  LogOut, 
  User, 
  Radio, 
  Layers, 
  DatabaseBackup,
  Lock,
  Compass
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'webgis' | 'fusion' | 'db_cluster' | 'history' | 'settings' | 'paper';
  setActiveTab: (tab: 'dashboard' | 'webgis' | 'fusion' | 'db_cluster' | 'history' | 'settings' | 'paper') => void;
  user: { email: string; role: string; name: string } | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  alertCount: number;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout, 
  onOpenLogin,
  alertCount 
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Control', icon: LayoutDashboard },
    { id: 'webgis', label: 'Live WebGIS Map', icon: MapIcon },
    { id: 'fusion', label: 'Fusion Processing', icon: Radio },
    { id: 'db_cluster', label: 'Database Cluster', icon: Database },
    { id: 'history', label: 'Historical Trails', icon: History },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
    { id: 'paper', label: 'Academic Report', icon: FileText },
  ] as const;

  return (
    <aside id="sidebar-container" className="w-80 h-screen bg-slate-950 border-r border-slate-900 flex flex-col z-20 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Compass className="h-6 w-6 text-white animate-spin" style={{ animationDuration: '20s' }} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none">AERO-MET </h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Distributed WebGIS v1.0</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase px-3 mb-2">Navigation Centre</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-tab-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.id === 'webgis' && alertCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full animate-pulse">
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Connection Indicator Bar */}
      <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-900 space-y-2">
        <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">Node Interfaces</div>
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>ADS-B Receiver</span>
          </div>
          <span className="text-emerald-500 font-semibold">ONLINE</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>BMKG Radar Feed</span>
          </div>
          <span className="text-emerald-500 font-semibold">ONLINE</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
            <span>WebSocket Sync</span>
          </div>
          <span className="text-indigo-400 font-semibold">SYNCING</span>
        </div>
      </div>

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950 flex flex-col gap-2">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-900">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{user.role}</p>
              </div>
            </div>
            <button 
              id="sidebar-logout-btn"
              onClick={onLogout}
              title="Log Out"
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            id="sidebar-login-btn"
            onClick={onOpenLogin}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all duration-200"
          >
            <Lock className="h-3.5 w-3.5 text-indigo-500" />
            <span>Operational Admin Login</span>
          </button>
        )}
        <div className="text-[9px] font-mono text-slate-600 text-center">
          SBDT Lab Assignment © 2026
        </div>
      </div>
    </aside>
  );
}
