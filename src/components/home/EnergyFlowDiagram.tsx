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
          <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Live Power Distribution Flow
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isGridOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
            {isGridOnline ? 'Grid Synced' : 'Islanded (Battery)'}
          </span>
        </div>
      </div>

      {/* Interactive Topology Graph Area */}
      <div className="relative py-2 px-1">
        
        {/* Top: Utility Grid Node */}
        <div className="flex justify-center mb-3">
          <div
            className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 transition-all ${
              isGridOnline
                ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${isGridOnline ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
              {isGridOnline ? <Zap className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Utility Feed
              </span>
              <span className="text-xs font-bold mono-num">
                {isGridOnline ? `${meterData.voltage.toFixed(0)}V · 50.0Hz` : 'Grid Outage'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Animated Flow Lines (SVG) */}
        <div className="relative h-16 my-1">
          <svg className="w-full h-full" viewBox="0 0 300 64" fill="none">
            {/* Top (Grid) to Center (Meter) */}
            <path
              d="M 150 0 L 150 32"
              stroke={isGridOnline ? '#10b981' : '#f59e0b'}
              strokeWidth="2.5"
              className={isGridOnline ? 'animate-flow-line' : ''}
              strokeDasharray={isGridOnline ? '6 4' : 'none'}
            />

            {/* Center (Meter) to Bottom Left (House Load) */}
            <path
              d="M 150 32 L 65 64"
              stroke={isHouseConnected ? '#10b981' : '#64748b'}
              strokeWidth="2.5"
              className={isHouseConnected ? 'animate-flow-line' : ''}
              strokeDasharray={isHouseConnected ? '6 4' : 'none'}
            />

            {/* Center (Meter) to Bottom Right (Battery) */}
            <path
              d="M 150 32 L 235 64"
              stroke={meterData.battery_status === 'charging' ? '#10b981' : '#f59e0b'}
              strokeWidth="2"
              className={meterData.battery_status === 'charging' ? 'animate-flow-line' : 'animate-flow-line-reverse'}
              strokeDasharray="6 4"
            />

            {/* Center Hub Indicator */}
            <circle cx="150" cy="32" r="5" fill="#10b981" />
            <circle cx="150" cy="32" r="8" stroke="#10b981" strokeWidth="1.5" opacity="0.5" className="animate-ping" />
          </svg>
        </div>

        {/* Bottom Row: House Load & Backup Battery & Peer Transfer */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          
          {/* House Load Node */}
          <div
            onClick={() => setActiveTab('device')}
            className={`p-3 rounded-2xl border cursor-pointer hover:border-emerald-500/40 transition-all ${
              isHouseConnected
                ? 'bg-neutral-100 dark:bg-neutral-900/90 border-neutral-200 dark:border-neutral-800'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Home Load
              </span>
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Home className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-neutral-900 dark:text-white mono-num">
                {currentPowerKw.toFixed(2)}
              </span>
              <span className="text-[11px] font-semibold text-neutral-500">kW</span>
            </div>
            <span className="text-[10px] text-neutral-500 block mt-0.5">
              {isHouseConnected ? 'Relay Closed (Supply ON)' : 'Supply Disconnected'}
            </span>
          </div>

          {/* Backup Battery Node */}
          <div
            onClick={() => setActiveTab('device')}
            className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-emerald-500/40 transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Meter Backup
              </span>
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-neutral-900 dark:text-white mono-num">
                {meterData.battery_percentage}%
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                {meterData.battery_status}
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 block mt-0.5">
              {isGridOnline ? 'Trickle standby buffer' : 'Operating during outage'}
            </span>
          </div>

        </div>

        {/* Cloud Peer Transfer Banner if Active */}
        {(isSharing || isReceiving) && (
          <div
            onClick={() => setActiveTab('share')}
            className="mt-3 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between cursor-pointer hover:bg-sky-500/15 transition-all animate-fade-in text-xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></div>
              <div>
                <span className="font-bold text-sky-400 block">
                  {isSharing ? 'Cloud Energy Export Active' : 'Receiving Energy from Cloud'}
                </span>
                <span className="text-[11px] text-neutral-300">
                  {isSharing
                    ? `${activeSession?.current_power_w}W transferring to ${activeSession?.destination_meter_name}`
                    : `${receivingSession?.current_power_w}W incoming from ${receivingSession?.source_meter_name}`}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-lg">
              View Share ➔
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
