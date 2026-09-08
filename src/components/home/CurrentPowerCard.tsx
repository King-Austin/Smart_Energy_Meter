import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Activity, Zap, TrendingUp, TrendingDown, Minus, Power } from 'lucide-react';

export const CurrentPowerCard: React.FC = () => {
  const { meterData, toggleMainSupply } = useMeter();
  const isOffline = meterData.device_status === 'offline';
  const isDisconnected = !meterData.main_supply_connected;

  const power = isDisconnected ? 0 : meterData.active_power;
  
  // Classify power level
  let loadLabel = 'Normal usage';
  let loadIcon = Minus;
  let loadColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25';

  if (power > 3.2) {
    loadLabel = 'Higher than usual';
    loadIcon = TrendingUp;
    loadColor = 'text-[#ff5b26] bg-[#ff5b26]/10 border-[#ff5b26]/25';
  } else if (power < 1.2 && power > 0) {
    loadLabel = 'Lower than usual';
    loadIcon = TrendingDown;
    loadColor = 'text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/25';
  } else if (power === 0) {
    loadLabel = 'Supply Disconnected';
    loadIcon = Minus;
    loadColor = 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700';
  }

  const Icon = loadIcon;

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      {/* Background ambient warm glow */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#ff5b26]/6 dark:bg-[#ff5b26]/12 rounded-full blur-3xl pointer-events-none group-hover:bg-[#ff5b26]/15 transition-all duration-500"></div>

      {/* Card Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#ff5b26]/12 text-[#ff5b26]">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Current Power
          </span>
        </div>

        {/* Live Pulse Indicator */}
        {!isOffline ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-live-dot"></span>
            <span>Live Telemetry</span>
          </div>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Last cached reading</span>
        )}
      </div>

      {/* Large Numerical Display (High contrast in Light and Dark modes) */}
      <div className="my-2">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black tracking-tight text-slate-950 dark:text-white mono-num">
            {isOffline ? '2.14' : power.toFixed(2)}
          </span>
          <span className="text-2xl font-bold text-slate-600 dark:text-slate-400">
            kW
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
          {isOffline
            ? 'Live reading unavailable. Last seen a moment ago.'
            : isDisconnected
            ? 'Whole-house main supply is disconnected.'
            : `Your home is currently drawing ${power.toFixed(2)} kW`}
        </p>

        {/* Reconnect Action if Disconnected */}
        {isDisconnected && (
          <button
            onClick={toggleMainSupply}
            className="mt-3 btn-primary text-xs py-2 px-3 flex items-center gap-1.5 shadow-sm"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Restore / Reconnect Power</span>
          </button>
        )}
      </div>

      {/* Usage State Badge & Sub-metric */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/80 dark:border-neutral-800/80">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${loadColor}`}>
          <Icon className="w-3.5 h-3.5" />
          <span>{loadLabel}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-bold">
          <span>{meterData.voltage.toFixed(0)}V</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>PF {meterData.power_factor.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
