import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Sparkles, TrendingDown, ArrowRight, DollarSign } from 'lucide-react';

export const EnergyTodayCard: React.FC = () => {
  const { meterData, setActiveTab } = useMeter();

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Energy Today Card */}
      <div
        onClick={() => setActiveTab('energy')}
        className="glass-card p-4 flex flex-col justify-between cursor-pointer hover:border-emerald-500/30 transition-all group"
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Energy Today
            </span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 opacity-80 group-hover:opacity-100" />
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-black tracking-tight text-slate-950 dark:text-white mono-num">
              {meterData.energy_today.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">kWh</span>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
          <TrendingDown className="w-3 h-3" />
          <span>12% vs yesterday</span>
        </div>
      </div>

      {/* Estimated Cost Today Card */}
      <div
        onClick={() => setActiveTab('energy')}
        className="glass-card p-4 flex flex-col justify-between cursor-pointer hover:border-emerald-500/30 transition-all group"
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Estimated Cost
            </span>
            <DollarSign className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 opacity-80 group-hover:opacity-100" />
          </div>

          <div className="flex items-baseline gap-0.5 my-1">
            <span className="text-2xl font-black tracking-tight text-slate-950 dark:text-white mono-num">
              {meterData.currency_symbol}
              {meterData.estimated_cost_today.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
          <span>@{meterData.currency_symbol}{meterData.tariff_rate}/kWh</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-slate-500" />
        </div>
      </div>
    </div>
  );
};
