import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Wallet, Calendar, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const BudgetSnapshotCard: React.FC = () => {
  const {
    meterData,
    budgetProgressPct,
    setActiveTab
  } = useMeter();

  const tariff = meterData.tariff_rate > 0 ? meterData.tariff_rate : 160.0;
  const budgetLimit = meterData.monthly_budget_naira || 25000;
  const currentSpent = meterData.estimated_bill_month || (meterData.energy_today * tariff * 12);
  const todayCost = meterData.estimated_cost_today || Math.round(meterData.energy_today * tariff);

  const isExceeded = budgetProgressPct >= 100;

  // Progress Bar Color
  const getBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-rose-500';
    if (pct >= 85) return 'bg-amber-500';
    return 'bg-[#ff5b26]';
  };

  return (
    <div
      onClick={() => setActiveTab('energy')}
      className="glass-card p-4 space-y-3 relative overflow-hidden cursor-pointer group hover:border-[#ff5b26]/30 transition-all"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/12 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-neutral-300">
            Monthly Budget
          </span>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
            isExceeded
              ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30'
              : 'text-slate-600 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700'
          }`}
        >
          {isExceeded ? <AlertTriangle className="w-3 h-3 text-rose-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          <span>{budgetProgressPct}%</span>
        </span>
      </div>

      {/* Progress Track */}
      <div className="space-y-1">
        <div className="w-full h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 rounded-full ${getBarColor(budgetProgressPct)}`}
            style={{ width: `${Math.min(100, budgetProgressPct)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-neutral-400 px-0.5">
          <span>{formatCurrency(currentSpent)}</span>
          <span>{formatCurrency(budgetLimit)}</span>
        </div>
      </div>

      {/* Bottom Summary Row with Icons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 dark:border-neutral-800/70 text-xs">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#ff5b26] shrink-0" />
          <span className="text-slate-600 dark:text-neutral-400">Today:</span>
          <span className="font-bold text-slate-900 dark:text-white mono-num">
            {meterData.energy_today.toFixed(1)} kWh
          </span>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="text-slate-600 dark:text-neutral-400">Cost:</span>
          <span className="font-bold text-slate-900 dark:text-white mono-num">
            {formatCurrency(todayCost)}
          </span>
        </div>
      </div>
    </div>
  );
};
