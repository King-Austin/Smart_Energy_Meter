import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Activity, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const CurrentPowerCard: React.FC = () => {
  const { meterData } = useMeter();
  const isOffline = meterData.device_status === 'offline';
  const isDisconnected = !meterData.main_supply_connected;

  const power = isDisconnected ? 0 : meterData.active_power;
  
  // Classify power level
  let loadLabel = 'Normal usage';
  let loadIcon = Minus;
  let loadColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  if (power > 3.2) {
    loadLabel = 'Higher than usual';
    loadIcon = TrendingUp;
    loadColor = 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
  } else if (power < 1.2 && power > 0) {
    loadLabel = 'Lower than usual';
    loadIcon = TrendingDown;
    loadColor = 'text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/20';
  } else if (power === 0) {
    loadLabel = 'Supply Disconnected';
    loadIcon = Minus;
    loadColor = 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700';
  }

  const Icon = loadIcon;

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      {/* Background ambient glow */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500"></div>

      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Current Power
          </span>
        </div>

        {/* Live Pulse Indicator */}
        {!isOffline ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 pulse-live-dot"></span>
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
          <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            kW
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
          {isOffline
            ? 'Live reading unavailable. Last seen 4 minutes ago.'
            : isDisconnected
            ? 'Whole-house main supply is disconnected.'
            : `Your home is currently drawing ${power.toFixed(2)} kW`}
        </p>
      </div>

      {/* Usage State Badge & Sub-metric */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-neutral-800">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${loadColor}`}>
          <Icon className="w-3.5 h-3.5" />
          <span>{loadLabel}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-semibold">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span>PF {meterData.power_factor.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
