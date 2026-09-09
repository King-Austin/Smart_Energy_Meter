import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Wallet, TrendingUp, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

export const BudgetSnapshotCard: React.FC = () => {
  const {
    meterData,
    budgetProgressPct,
    projectedMonthKwh,
    projectedMonthCostNaira
  } = useMeter();

  const budgetLimit = meterData.monthly_budget_naira || 25000;
  const currentSpent = meterData.estimated_bill_month || (meterData.energy_today * meterData.tariff_rate * 12);

  // Status color determination
  const getStatusColor = (pct: number) => {
    if (pct >= 100) return 'text-red-500 bg-red-500/15 border-red-500/30';
    if (pct >= 90) return 'text-orange-500 bg-orange-500/15 border-orange-500/30';
    if (pct >= 80) return 'text-amber-500 bg-amber-500/15 border-amber-500/30';
    if (pct >= 50) return 'text-cyan-500 bg-cyan-500/15 border-cyan-500/30';
    return 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30';
  };

  const getProgressBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 90) return 'bg-orange-500';
    if (pct >= 80) return 'bg-amber-500';
    if (pct >= 50) return 'bg-cyan-500';
    return 'bg-emerald-500';
  };

  const isExceeded = budgetProgressPct >= 100;

  return (
    <div className="glass-card p-4 space-y-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-500">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Monthly Consumption Budget
            </h3>
          </div>
        </div>

        <span
          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusColor(
            budgetProgressPct
          )} flex items-center gap-1`}
        >
          {isExceeded ? (
            <>
              <AlertTriangle className="w-3 h-3" /> Exceeded ({budgetProgressPct}%)
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" /> {budgetProgressPct}% Used
            </>
          )}
        </span>
      </div>

      {/* Numerical Spent vs Budget */}
      <div className="flex items-baseline justify-between pt-1">
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Spent This Month</span>
          <span className="text-xl font-black text-neutral-900 dark:text-white tracking-tight mono-num">
            ₦{Math.round(currentSpent).toLocaleString()}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Monthly Limit</span>
          <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mono-num">
            ₦{budgetLimit.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress Bar with 50%, 80%, 90%, 100% Milestone Badges */}
      <div className="space-y-1.5">
        <div className="relative w-full h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 rounded-full ${getProgressBarColor(budgetProgressPct)}`}
            style={{ width: `${Math.min(100, budgetProgressPct)}%` }}
          />
        </div>

        {/* Milestone Tick Markers */}
        <div className="flex justify-between text-[10px] font-bold text-neutral-600 dark:text-neutral-300 px-0.5">
          <span className={budgetProgressPct >= 50 ? 'text-cyan-600 dark:text-cyan-400 font-extrabold' : ''}>50%</span>
          <span className={budgetProgressPct >= 80 ? 'text-amber-600 dark:text-amber-400 font-extrabold' : ''}>80%</span>
          <span className={budgetProgressPct >= 90 ? 'text-orange-600 dark:text-orange-400 font-extrabold' : ''}>90%</span>
          <span className={budgetProgressPct >= 100 ? 'text-red-600 dark:text-red-400 font-extrabold' : ''}>100%</span>
        </div>
      </div>

      {/* Projections Footnote */}
      <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-neutral-500 block leading-tight">Run-Rate Month</span>
            <span className="font-bold text-neutral-900 dark:text-white mono-num">
              ~{projectedMonthKwh} kWh
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-neutral-500 block leading-tight">Projected Total Bill</span>
            <span className="font-bold text-neutral-900 dark:text-white mono-num">
              ~₦{projectedMonthCostNaira.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
