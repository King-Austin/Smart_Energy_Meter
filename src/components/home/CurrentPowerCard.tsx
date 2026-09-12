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

      {/* Large Numerical Display (Zero mock data - strictly live telemetry) */}
      <div className="my-2">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black tracking-tight text-slate-950 dark:text-white mono-num">
            {meterData.voltage < 10 || isDisconnected ? '0' : (power < 1.0 ? (power * 1000).toFixed(0) : power.toFixed(2))}
          </span>
          <span className="text-2xl font-bold text-slate-600 dark:text-slate-400">
            {power < 1.0 ? 'W' : 'kW'}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
          {isOffline
            ? 'Meter device offline / Cloud disconnected.'
            : isDisconnected
            ? 'Contactor relay open: Whole-house power is cut (0.00 kW).'
            : meterData.voltage < 10
            ? 'AC Mains is DISCONNECTED (0.0V). Device running on backup battery.'
            : `Live draw: ${power.toFixed(2)} kW (${meterData.current.toFixed(2)}A @ ${meterData.voltage.toFixed(0)}V)`}
        </p>

        {/* Remote Master Contactor Relay (D13) Live Hardware Switch */}
        <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-slate-100/70 dark:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-700/60">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isDisconnected ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Relay D13: {isDisconnected ? 'ISOLATED (OFF)' : 'CONNECTED (ON)'}
            </span>
          </div>
          <button
            onClick={toggleMainSupply}
            className={`text-xs py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              isDisconnected
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isDisconnected ? 'Turn Supply ON' : 'Turn Supply OFF'}</span>
          </button>
        </div>
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
