import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Activity, Zap, Power, Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPower } from '../../utils/formatters';

export const CurrentPowerCard: React.FC = () => {
  const { meterData, toggleMainSupply } = useMeter();
  const isOffline = meterData.device_status === 'offline';
  const isDisconnected = !meterData.main_supply_connected;

  const power = isDisconnected ? 0 : meterData.active_power;
  const formattedPower = formatPower(power);

  // Status indicator
  let StatusIcon = Minus;
  let statusText = 'Normal';
  let statusColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25';

  if (isDisconnected) {
    StatusIcon = Power;
    statusText = 'Isolated';
    statusColor = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25';
  } else if (power > 3.0) {
    StatusIcon = TrendingUp;
    statusText = 'Peak';
    statusColor = 'text-[#ff5b26] bg-[#ff5b26]/10 border-[#ff5b26]/25';
  } else if (power < 0.5 && power > 0) {
    StatusIcon = TrendingDown;
    statusText = 'Low';
    statusColor = 'text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/25';
  }

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      {/* Background ambient warm glow */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#ff5b26]/6 dark:bg-[#ff5b26]/12 rounded-full blur-3xl pointer-events-none group-hover:bg-[#ff5b26]/15 transition-all duration-500" />

      {/* Top Row: Title + Power Switch */}
      <div className="flex items-center justify-between relative z-10 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#ff5b26]/12 text-[#ff5b26] flex items-center justify-center">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-neutral-300">
            Active Power
          </span>
          {!isOffline && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Live Stream" />
          )}
        </div>

        {/* 1-Tap iOS-Style Supply Contactor Button */}
        <button
          onClick={toggleMainSupply}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer ${
            isDisconnected
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}
          title={isDisconnected ? 'Connect household power' : 'Disconnect household power'}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isDisconnected ? 'Connect' : 'Cut'}</span>
        </button>
      </div>

      {/* Large Hero Number (Flexible W / kW) */}
      <div className="my-3 relative z-10 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white mono-num">
            {formattedPower.value}
          </span>
          <span className="text-2xl font-bold text-slate-500 dark:text-neutral-400">
            {formattedPower.unit}
          </span>
        </div>

        {/* Status Pill */}
        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
          <StatusIcon className="w-3 h-3" />
          <span>{statusText}</span>
        </div>
      </div>

      {/* Bottom Glanceable Micro-Metrics Row */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/80 dark:border-neutral-800/80 relative z-10">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60 flex items-center justify-center gap-1.5 text-xs">
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-bold text-slate-800 dark:text-neutral-200 mono-num">
            {meterData.voltage.toFixed(0)} V
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60 flex items-center justify-center gap-1.5 text-xs">
          <Activity className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span className="font-bold text-slate-800 dark:text-neutral-200 mono-num">
            {meterData.current.toFixed(1)} A
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60 flex items-center justify-center gap-1.5 text-xs">
          <Gauge className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="font-bold text-slate-800 dark:text-neutral-200 mono-num">
            PF {meterData.power_factor > 0 ? meterData.power_factor.toFixed(2) : '1.00'}
          </span>
        </div>
      </div>
    </div>
  );
};
