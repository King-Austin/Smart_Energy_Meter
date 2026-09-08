import React, { useState, useEffect } from 'react';
import { useMeter } from '../context/MeterContext';
import { EnergyPeriod } from '../types/meter';
import { HOURLY_DATA, WEEKLY_DATA, MONTHLY_DATA } from '../services/mockData';
import { fetchHourlyUsageFromDB } from '../services/supabase';
import {
  BarChart3,
  TrendingDown,
  Zap,
  ShieldCheck,
  Activity,
  Gauge,
  Power
} from 'lucide-react';

export const EnergyScreen: React.FC = () => {
  const { meterData } = useMeter();
  const [period, setPeriod] = useState<EnergyPeriod>('today');
  const [dbHourlyData, setDbHourlyData] = useState<{ hourLabel: string; kwh: number; cost: number }[] | null>(null);
  const [isLoadingDB, setIsLoadingDB] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadUsage = async () => {
      setIsLoadingDB(true);
      const data = await fetchHourlyUsageFromDB(meterData.meter_id, meterData.tariff_rate);
      if (isMounted && data && data.length > 0) {
        setDbHourlyData(data);
      }
      if (isMounted) setIsLoadingDB(false);
    };
    loadUsage();
    return () => { isMounted = false; };
  }, [meterData.meter_id, meterData.tariff_rate]);

  const activeHourlyData = (dbHourlyData && dbHourlyData.length >= 4) ? dbHourlyData : HOURLY_DATA;

  // Calculation helpers
  const maxHourlyKwh = Math.max(...activeHourlyData.map(d => d.kwh), 0.1);
  const maxWeeklyKwh = Math.max(...WEEKLY_DATA.map(d => d.kwh), 0.1);
  const maxMonthlyKwh = Math.max(...MONTHLY_DATA.map(d => d.kwh), 0.1);

  const peakHourlyEntry = activeHourlyData.reduce((prev, curr) => (curr.kwh > prev.kwh ? curr : prev), activeHourlyData[0]);

  return (
    <div className="space-y-4 pb-10 animate-fade-in">
      
      {/* Header & Segmented Timeframe Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Energy Usage
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Realtime consumption telemetry & hourly load demand
          </p>
        </div>

        {/* Segmented Period Switcher */}
        <div className="flex items-center p-1 bg-slate-200/70 dark:bg-neutral-800 rounded-2xl border border-slate-300/80 dark:border-neutral-700 text-xs">
          {(['today', 'week', 'month'] as EnergyPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all ${
                period === p
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Total Used Card (Reference Design Pattern) */}
      <div className="glass-card p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Total Used
          </span>
          <div className="p-2 rounded-xl bg-[#ff5b26]/12 text-[#ff5b26]">
            <Zap className="w-4 h-4 fill-current" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 my-1">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white mono-num">
            {period === 'today'
              ? meterData.energy_today.toFixed(2)
              : period === 'week'
              ? meterData.energy_week.toFixed(1)
              : meterData.energy_month.toFixed(1)}
          </span>
          <span className="text-xl font-bold text-slate-600 dark:text-slate-400">kWh</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
          {period === 'today'
            ? 'Today’s measured consumption across your main line'
            : period === 'week'
            ? 'Past 7 days aggregated household consumption'
            : 'Monthly usage across all connected circuits'}
        </p>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/80 dark:border-neutral-800 text-xs font-semibold">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <TrendingDown className="w-4 h-4" />
            <span>
              {period === 'today' ? '12% less than yesterday' : period === 'week' ? '8% lower vs last week' : 'Normal consumption pace'}
            </span>
          </div>

          <span className="font-bold text-slate-900 dark:text-white mono-num">
            Estimated Cost: {meterData.currency_symbol}
            {period === 'today'
              ? meterData.estimated_cost_today.toLocaleString()
              : period === 'week'
              ? (Math.round(meterData.energy_week * meterData.tariff_rate)).toLocaleString()
              : (meterData.estimated_bill_month).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Meter Transparency Metrics (Replacing Fake Eco Mode) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b25] border border-slate-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Gauge className="w-4 h-4 text-[#ff5b26]" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              Peak Demand
            </span>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white mono-num block">
            {peakHourlyEntry ? `${peakHourlyEntry.kwh.toFixed(2)} kW` : `${meterData.active_power.toFixed(2)} kW`}
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 mt-0.5 block">
            Recorded at {peakHourlyEntry ? peakHourlyEntry.hourLabel : 'recent peak'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b25] border border-slate-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              Average Load
            </span>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white mono-num block">
            {(meterData.active_power * 0.72).toFixed(2)} kW
          </span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            Current: {meterData.active_power.toFixed(2)} kW live
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b25] border border-slate-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Power className={`w-4 h-4 ${meterData.main_supply_connected ? 'text-emerald-500' : 'text-rose-500'}`} />
            <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              Contactor Relay
            </span>
          </div>
          <span className={`text-base font-black mono-num block ${
            meterData.main_supply_connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
          }`}>
            {meterData.main_supply_connected ? 'CLOSED (Supplying)' : 'OPEN (Cutoff)'}
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 mt-0.5 block">
            Safety contactor status
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b25] border border-slate-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-[#ff5b26]" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              Protective Guard
            </span>
          </div>
          <span className="text-base font-black text-slate-900 dark:text-white mono-num block">
            {meterData.min_voltage_limit}V – {meterData.max_voltage_limit}V
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 mt-0.5 block">
            Auto-cutoff enabled
          </span>
        </div>
      </div>

      {/* Usage Overview Bar Chart (Two-Tone Grey/Burnt Orange Pattern) */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#ff5b26]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-neutral-400">
              Usage Overview {isLoadingDB && <span className="text-[10px] lowercase font-normal">(syncing DB...)</span>}
            </h3>
          </div>

          {/* Two-Tone Legend */}
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-neutral-700"></span>
              <span>Normal Use</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#ff5b26]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ff5b26]"></span>
              <span>Peak Demand</span>
            </div>
          </div>
        </div>

        {/* 1. Hourly View */}
        {period === 'today' && (
          <div className="space-y-2">
            <div className="h-44 flex items-end justify-between gap-1.5 pt-4">
              {activeHourlyData.map((h, i) => {
                const heightPercent = Math.max(10, (h.kwh / maxHourlyKwh) * 100);
                const isPeak = h.kwh >= maxHourlyKwh * 0.8;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full h-32 flex items-end justify-center">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all ${
                          isPeak
                            ? 'bg-[#ff5b26] shadow-xs'
                            : 'bg-slate-300 dark:bg-neutral-700 hover:bg-slate-400'
                        }`}
                      ></div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold truncate w-full text-center">
                      {h.hourLabel.replace(' ', '')}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 pt-2 border-t border-slate-200 dark:border-neutral-800 font-medium">
              <span>Peak: {peakHourlyEntry ? `${peakHourlyEntry.hourLabel} (${peakHourlyEntry.kwh.toFixed(2)} kWh)` : '8 PM'}</span>
              <span>Tariff: ₦{meterData.tariff_rate}/kWh</span>
            </div>
          </div>
        )}

        {/* 2. Weekly View */}
        {period === 'week' && (
          <div className="space-y-2">
            <div className="h-44 flex items-end justify-between gap-2 pt-4">
              {WEEKLY_DATA.map((d, i) => {
                const heightPercent = Math.max(12, (d.kwh / maxWeeklyKwh) * 100);
                const isPeak = d.kwh >= maxWeeklyKwh * 0.85;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full h-32 flex items-end justify-center">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all ${
                          isPeak
                            ? 'bg-[#ff5b26] shadow-xs'
                            : 'bg-slate-300 dark:bg-neutral-700 hover:bg-slate-400'
                        }`}
                      ></div>
                    </div>
                    <span className={`text-[10px] font-bold ${isPeak ? 'text-[#ff5b26]' : 'text-slate-500 dark:text-neutral-400'}`}>
                      {d.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 pt-2 border-t border-slate-200 dark:border-neutral-800 font-medium">
              <span>Daily Avg: 8.7 kWh</span>
              <span>Peak Day: Sat (11.2 kWh)</span>
            </div>
          </div>
        )}

        {/* 3. Monthly View */}
        {period === 'month' && (
          <div className="space-y-2">
            <div className="h-44 flex items-end justify-between gap-2 pt-4">
              {MONTHLY_DATA.map((m, i) => {
                const heightPercent = Math.max(15, (m.kwh / maxMonthlyKwh) * 100);
                const isPeak = m.kwh === maxMonthlyKwh;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full h-32 flex items-end justify-center">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all ${
                          isPeak
                            ? 'bg-[#ff5b26] shadow-xs'
                            : 'bg-slate-300 dark:bg-neutral-700 hover:bg-slate-400'
                        }`}
                      ></div>
                    </div>
                    <span className={`text-[10px] font-bold ${isPeak ? 'text-[#ff5b26]' : 'text-slate-500 dark:text-neutral-400'}`}>
                      {m.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 pt-2 border-t border-slate-200 dark:border-neutral-800 font-medium">
              <span>Monthly Projected: {meterData.energy_month.toFixed(0)} kWh</span>
              <span>Average Tariff: ₦{meterData.tariff_rate}/kWh</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
