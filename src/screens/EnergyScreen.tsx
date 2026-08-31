import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import { EnergyPeriod } from '../types/meter';
import { HOURLY_DATA, WEEKLY_DATA, MONTHLY_DATA } from '../services/mockData';
import {
  BarChart3,
  TrendingDown,
  Zap,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';

export const EnergyScreen: React.FC = () => {
  const { meterData } = useMeter();
  const [period, setPeriod] = useState<EnergyPeriod>('today');

  // Calculation helpers
  const maxHourlyKwh = Math.max(...HOURLY_DATA.map(d => d.kwh));
  const maxWeeklyKwh = Math.max(...WEEKLY_DATA.map(d => d.kwh));
  const maxMonthlyKwh = Math.max(...MONTHLY_DATA.map(d => d.kwh));

  return (
    <div className="space-y-4 pb-8 animate-fade-in text-neutral-900 dark:text-neutral-100">
      
      {/* Header & Segmented Timeframe Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-display">
            Energy Analytics
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Whole-house consumption trends and cost breakdown
          </p>
        </div>

        {/* iOS Segmented Control */}
        <div className="flex items-center p-1 bg-neutral-200/70 dark:bg-neutral-900 rounded-2xl border border-neutral-300 dark:border-neutral-800 text-xs">
          {(['today', 'week', 'month'] as EnergyPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all ${
                period === p
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Summary Card */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {period === 'today' ? 'Energy Consumed Today' : period === 'week' ? 'Weekly Consumption (7 Days)' : 'August Total Consumption'}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            @{meterData.currency_symbol}{meterData.tariff_rate}/kWh
          </span>
        </div>

        <div className="flex items-baseline gap-2 my-1">
          <span className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mono-num">
            {period === 'today'
              ? meterData.energy_today.toFixed(2)
              : period === 'week'
              ? meterData.energy_week.toFixed(1)
              : meterData.energy_month.toFixed(1)}
          </span>
          <span className="text-xl font-bold text-neutral-500 dark:text-neutral-400">kWh</span>
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingDown className="w-4 h-4" />
            <span>
              {period === 'today' ? '12% less than yesterday' : period === 'week' ? '8% lower vs last week' : 'On track with budget'}
            </span>
          </div>

          <span className="font-bold text-neutral-900 dark:text-white mono-num">
            Cost: {meterData.currency_symbol}
            {period === 'today'
              ? meterData.estimated_cost_today.toLocaleString()
              : period === 'week'
              ? (Math.round(meterData.energy_week * meterData.tariff_rate)).toLocaleString()
              : (meterData.estimated_bill_month).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Interactive Consumption Chart Area */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {period === 'today' ? 'Hourly Usage Curve' : period === 'week' ? 'Daily Usage (kWh)' : 'Monthly History'}
            </h3>
          </div>
          <span className="text-[11px] text-neutral-500">Live Meter Sync</span>
        </div>

        {/* 1. Hourly View */}
        {period === 'today' && (
          <div className="space-y-2">
            <div className="h-40 flex items-end justify-between gap-1.5 pt-4">
              {HOURLY_DATA.map((h, i) => {
                const heightPercent = Math.max(8, (h.kwh / maxHourlyKwh) * 100);
                const isPeak = h.kwh === maxHourlyKwh;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 dark:bg-neutral-800 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                      {h.kwh} kWh
                    </div>

                    <div className="w-full h-32 flex items-end justify-center">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all ${
                          isPeak
                            ? 'bg-amber-500'
                            : 'bg-emerald-500/70 dark:bg-emerald-500/80 group-hover:bg-emerald-400'
                        }`}
                      ></div>
                    </div>
                    <span className="text-[9px] text-neutral-500 font-medium truncate w-full text-center">
                      {h.hourLabel.replace(' ', '')}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <span>Peak: 8 PM (3.12 kWh)</span>
              <span>Lowest: 4 AM (0.31 kWh)</span>
            </div>
          </div>
        )}

        {/* 2. Weekly View */}
        {period === 'week' && (
          <div className="space-y-2">
            <div className="h-40 flex items-end justify-between gap-2 pt-4">
              {WEEKLY_DATA.map((d, i) => {
                const heightPercent = Math.max(12, (d.kwh / maxWeeklyKwh) * 100);
                const isToday = i === WEEKLY_DATA.length - 1;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-20 shadow">
                      {d.kwh} kWh ({meterData.currency_symbol}{d.cost})
                    </div>

                    <div className="w-full h-32 flex items-end justify-center">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all ${
                          isToday
                            ? 'bg-emerald-500 shadow-sm'
                            : 'bg-neutral-300 dark:bg-neutral-700 hover:bg-emerald-400/60'
                        }`}
                      ></div>
                    </div>
                    <span className={`text-[10px] font-bold ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'}`}>
                      {d.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <span>Daily Avg: 8.7 kWh</span>
              <span>Highest Day: Sat (11.2 kWh)</span>
            </div>
          </div>
        )}

        {/* 3. Monthly View */}
        {period === 'month' && (
          <div className="space-y-3">
            <div className="h-40 flex items-end justify-between gap-3 pt-4">
              {MONTHLY_DATA.map((m, i) => {
                const heightPercent = Math.max(15, (m.kwh / maxMonthlyKwh) * 100);
                const isCurrent = i === MONTHLY_DATA.length - 1;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-20 shadow">
                      {m.kwh} kWh
                    </div>

                    <div className="w-full h-32 flex items-end justify-center">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-xl transition-all ${
                          isCurrent
                            ? 'bg-emerald-500'
                            : 'bg-neutral-300 dark:bg-neutral-700'
                        }`}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500">
                      {m.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Projected Month Banner */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="font-bold text-neutral-900 dark:text-white block">
                    Projected Month-End Total
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Est. {meterData.projected_month} kWh by Aug 31
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mono-num">
                {meterData.currency_symbol}{meterData.projected_bill_month.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Smart Energy Insights */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Smart Energy Insights
          </h3>
        </div>

        <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/60 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-neutral-900 dark:text-white block">
                Peak Demand Window: 7:00 PM – 8:30 PM
              </span>
              <span className="text-neutral-500 text-[11px]">
                Air conditioning and water heater usage causes 62% of your daily electricity costs.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/60 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-neutral-900 dark:text-white block">
                High Power Factor Efficiency (0.96)
              </span>
              <span className="text-neutral-500 text-[11px]">
                Your home inductive loads are operating within optimal utility efficiency standards.
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
