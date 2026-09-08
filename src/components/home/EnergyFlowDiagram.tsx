import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Zap, Home, Battery, Radio, AlertTriangle } from 'lucide-react';

export const EnergyFlowDiagram: React.FC = () => {
  const { meterData, activeSession, receivingSession, setActiveTab } = useMeter();

  const isGridOnline = meterData.grid_status === 'online';
  const isHouseConnected = meterData.main_supply_connected;
  const isSharing = !!activeSession;
  const isReceiving = !!receivingSession;

  const currentPowerKw = isHouseConnected ? meterData.active_power : 0;

  return (
    <div className="glass-card p-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#ff5b26]/12 text-[#ff5b26]">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-neutral-400">
              Live Power Distribution Flow
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isGridOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span className="text-[11px] font-bold text-slate-700 dark:text-neutral-300">
            {isGridOnline ? 'Grid Synced' : 'Islanded (Battery)'}
          </span>
        </div>
      </div>

      {/* Interactive Topology Graph Area */}
      <div className="relative py-2 px-1">
        
        {/* Top: Utility Grid Node */}
        <div className="flex justify-center mb-3">
          <div
            className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 transition-all shadow-2xs ${
              isGridOnline
                ? 'bg-slate-50 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${isGridOnline ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
              {isGridOnline ? <Zap className="w-4 h-4 fill-current" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block">
                Utility Feed
              </span>
              <span className="text-xs font-bold mono-num">
                {isGridOnline ? `${meterData.voltage.toFixed(0)}V · ${meterData.frequency.toFixed(1)}Hz` : 'Grid Outage'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic SVG Animated Flow Lines */}
        <div className="relative h-14 w-full flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 320 60" fill="none">
            {/* Main Central Bus Junction Point */}
            <circle
              cx="160"
              cy="25"
              r="4"
              className={isGridOnline ? 'fill-emerald-500' : 'fill-amber-500'}
            />
            <circle
              cx="160"
              cy="25"
              r="8"
              className={`opacity-30 ${isGridOnline ? 'stroke-emerald-500' : 'stroke-amber-500'}`}
              strokeWidth="1.5"
            />

            {/* Path 1: Utility Grid -> Central Bus */}
            <path
              d="M 160 0 L 160 25"
              stroke={isGridOnline ? '#10b981' : '#f59e0b'}
              strokeWidth="2.5"
              className={isGridOnline ? 'animate-flow-line' : ''}
            />

            {/* Path 2: Central Bus -> House Load (Left) */}
            <path
              d="M 160 25 L 80 55"
              stroke={isHouseConnected ? '#10b981' : '#94a3b8'}
              strokeWidth="2.5"
              className={isHouseConnected ? 'animate-flow-line' : ''}
              strokeDasharray={isHouseConnected ? '6 4' : 'none'}
            />

            {/* Path 3: Central Bus -> Battery (Right) */}
            <path
              d="M 160 25 L 240 55"
              stroke={meterData.battery_status === 'charging' ? '#10b981' : '#64748b'}
              strokeWidth="2"
              className={meterData.battery_status === 'charging' ? 'animate-flow-line' : ''}
            />
          </svg>
        </div>

        {/* Bottom Row: House Load & Backup Battery */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          
          {/* House Load Node */}
          <div
            onClick={() => setActiveTab('device')}
            className={`p-3 rounded-2xl border cursor-pointer hover:border-[#ff5b26]/40 transition-all ${
              isHouseConnected
                ? 'bg-slate-50 dark:bg-neutral-900/90 border-slate-200 dark:border-neutral-800'
                : 'bg-amber-500/10 border-amber-500/25'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                Home Load
              </span>
              <div className="p-1 rounded-lg bg-[#ff5b26]/12 text-[#ff5b26]">
                <Home className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-slate-900 dark:text-white mono-num">
                {currentPowerKw.toFixed(2)}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">kW</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 block mt-0.5 font-medium">
              {isHouseConnected ? 'Relay Closed (Supply ON)' : 'Supply Disconnected'}
            </span>
          </div>

          {/* Backup Battery Node */}
          <div
            onClick={() => setActiveTab('device')}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 cursor-pointer hover:border-emerald-500/40 transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                Meter Backup
              </span>
              <div className="p-1 rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-slate-900 dark:text-white mono-num">
                {meterData.battery_percentage}%
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                {meterData.battery_status}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 block mt-0.5 font-medium">
              {isGridOnline ? 'Trickle standby buffer' : 'Operating during outage'}
            </span>
          </div>

        </div>

        {/* Cloud Peer Transfer Banner if Active */}
        {(isSharing || isReceiving) && (
          <div
            onClick={() => setActiveTab('share')}
            className="mt-3 p-3 rounded-2xl bg-[#ff5b26]/10 border border-[#ff5b26]/30 flex items-center justify-between cursor-pointer hover:bg-[#ff5b26]/15 transition-all animate-fade-in text-xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff5b26] animate-ping"></div>
              <div>
                <span className="font-bold text-[#ff5b26] block">
                  {isSharing ? 'Cloud Energy Export Active' : 'Receiving Energy from Cloud'}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-neutral-300">
                  {isSharing
                    ? `${activeSession?.current_power_w}W transferring to ${activeSession?.destination_meter_name}`
                    : `${receivingSession?.current_power_w}W incoming from ${receivingSession?.source_meter_name}`}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#ff5b26] border border-[#ff5b26]/30 px-2.5 py-0.5 rounded-xl bg-white dark:bg-neutral-900">
              View Share ➔
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
