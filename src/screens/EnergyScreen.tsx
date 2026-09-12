import React, { useState, useEffect } from 'react';
import { useMeter } from '../context/MeterContext';
import { EnergyPeriod } from '../types/meter';
import {
  fetchHourlyUsageFromDB,
  fetchDailyUsageFromDB,
  fetchRecentTelemetryLogs
} from '../services/supabase';
import { OutageHistoryCard } from '../components/energy/OutageHistoryCard';
import {
  BarChart3,
  Zap,
  ShieldCheck,
  Activity,
  Gauge,
  Power,
  Clock,
  Calendar,
  Sparkles
} from 'lucide-react';
import { formatPower, formatCurrency } from '../utils/formatters';

export const EnergyScreen: React.FC = () => {
  const { meterData } = useMeter();
  const [period, setPeriod] = useState<EnergyPeriod>('today');
  const [chartMode, setChartMode] = useState<'seconds' | 'hourly' | 'daily'>('seconds');

  const [dbHourlyData, setDbHourlyData] = useState<{ hourLabel: string; kwh: number; watts: number; cost: number }[] | null>(null);
  const [dbDailyData, setDbDailyData] = useState<{ dayLabel: string; kwh: number; cost: number }[] | null>(null);
  const [recentLogs, setRecentLogs] = useState<Array<{ timeStr: string; watts: number; kw: number; voltage: number; current: number; isRelayOn: boolean }>>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(false);

  // Initial load for aggregated tables
  useEffect(() => {
    let isMounted = true;
    const loadUsage = async () => {
      setIsLoadingDB(true);
      const [hourly, daily] = await Promise.all([
        fetchHourlyUsageFromDB(meterData.meter_id, meterData.tariff_rate),
        fetchDailyUsageFromDB(meterData.meter_id, meterData.tariff_rate)
      ]);
      if (isMounted) {
        if (hourly) setDbHourlyData(hourly);
        if (daily) setDbDailyData(daily);
        setIsLoadingDB(false);
      }
    };
    loadUsage();
    return () => { isMounted = false; };
  }, [meterData.meter_id, meterData.tariff_rate]);

  // Live 2.5-second polling for real-time seconds telemetry stream
  useEffect(() => {
    let isMounted = true;
    const pollSeconds = async () => {
      const logs = await fetchRecentTelemetryLogs(meterData.meter_id, 12);
      if (isMounted && logs && logs.length > 0) {
        setRecentLogs(logs);
      }
    };

    pollSeconds();
    const interval = setInterval(pollSeconds, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [meterData.meter_id]);

  // Data helpers
  const activeHourlyData = dbHourlyData || [];
  const activeDailyData = dbDailyData || [];

  const maxSecondsWatts = recentLogs.length > 0
    ? Math.max(...recentLogs.map(l => l.watts), 15)
    : 20;

  const maxHourlyKwh = activeHourlyData.length > 0
    ? Math.max(...activeHourlyData.map(d => d.kwh), 0.05)
    : 0.1;

  const maxDailyKwh = activeDailyData.length > 0
    ? Math.max(...activeDailyData.map(d => d.kwh), 0.1)
    : 1.0;

  const peakHourlyEntry = activeHourlyData.length > 0
    ? activeHourlyData.reduce((prev, curr) => (curr.kwh > prev.kwh ? curr : prev), activeHourlyData[0])
    : null;

  return (
    <div className="space-y-4 pb-12 animate-fade-in max-w-2xl mx-auto">
      
      {/* Header & Segmented Timeframe Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Energy Usage
          </h2>
          <span className="text-xs text-slate-500 dark:text-neutral-400">
            Real-time telemetry & consumption analytics
          </span>
        </div>

        {/* Segmented Period Switcher */}
        <div className="flex items-center p-1 bg-slate-200/70 dark:bg-neutral-800 rounded-2xl border border-slate-300/80 dark:border-neutral-700 text-xs">
          {(['today', 'week', 'month'] as EnergyPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                if (p === 'today') setChartMode('hourly');
                if (p === 'week') setChartMode('daily');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all cursor-pointer ${
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

      {/* Main Total Used Card */}
      <div className="glass-card p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Total Measured Energy
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
          <span className="text-sm font-bold text-slate-500">kWh</span>
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/80 dark:border-neutral-800 text-xs font-semibold">
          <span className="text-slate-500 dark:text-neutral-400">
            ₦{meterData.tariff_rate || 160.0}/kWh
          </span>

          <span className="font-bold text-slate-900 dark:text-white mono-num">
            {formatCurrency(
              period === 'today'
                ? meterData.estimated_cost_today || (meterData.energy_today * (meterData.tariff_rate || 160.0))
                : period === 'week'
                ? meterData.energy_week * (meterData.tariff_rate || 160.0)
                : meterData.estimated_bill_month || (meterData.energy_month * (meterData.tariff_rate || 160.0))
            )}
          </span>
        </div>
      </div>

      {/* 4 Clean Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b25] border border-slate-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1 text-slate-500 dark:text-neutral-400">
            <Gauge className="w-3.5 h-3.5 text-[#ff5b26]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Peak
            </span>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white mono-num block">
            {formatPower((peakHourlyEntry && peakHourlyEntry.kwh > 0 ? peakHourlyEntry.watts : (meterData.active_power * 1000)) / 1000).full}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b25] border border-slate-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1 text-slate-500 dark:text-neutral-400">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Power Factor
            </span>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white mono-num block">
            {meterData.power_factor > 0 ? meterData.power_factor.toFixed(2) : '1.00'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b25] border border-slate-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1 text-slate-500 dark:text-neutral-400">
            <Power className="w-3.5 h-3.5 text-[#ff5b26]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Contactor
            </span>
          </div>
          <span className={`text-base font-black mono-num block ${
            meterData.main_supply_connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
          }`}>
            {meterData.main_supply_connected ? 'ON' : 'CUT'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b25] border border-slate-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1 text-slate-500 dark:text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Grid Voltage
            </span>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white mono-num block">
            {meterData.voltage.toFixed(0)} V
          </span>
        </div>
      </div>

      {/* Multi-Bar Graph: Live Usage Overview */}
      <div className="glass-card p-5 space-y-4">
        {/* Card Header & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#ff5b26]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-neutral-300">
              Live Usage Overview {isLoadingDB && <span className="text-[10px] lowercase font-normal">(syncing DB...)</span>}
            </h3>
          </div>

          {/* Granularity Switcher: Seconds | Hourly | Daily */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-neutral-850 rounded-xl border border-slate-200 dark:border-neutral-800 text-[11px] font-bold">
            <button
              onClick={() => setChartMode('seconds')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                chartMode === 'seconds'
                  ? 'bg-[#ff5b26] text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Seconds (Live)</span>
            </button>
            <button
              onClick={() => setChartMode('hourly')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                chartMode === 'hourly'
                  ? 'bg-[#ff5b26] text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Hourly (24h)</span>
            </button>
            <button
              onClick={() => setChartMode('daily')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                chartMode === 'daily'
                  ? 'bg-[#ff5b26] text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Daily (7d)</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] font-semibold pt-1 border-b border-slate-100 dark:border-neutral-800/80 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 dark:bg-neutral-700"></span>
              <span>Baseline / Idle</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#ff5b26]">
              <span className="w-2.5 h-2.5 rounded-xs bg-gradient-to-t from-orange-600 to-[#ff5b26]"></span>
              <span>Active Load Draw</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>2s Auto-Refresh</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: SECONDS (LIVE REAL-TIME STREAMING TELEMETRY BARS) */}
        {/* ========================================================= */}
        {chartMode === 'seconds' && (
          <div className="space-y-2">
            <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-2 pt-4 px-1">
              {recentLogs.length > 0 ? (
                recentLogs.map((log, i) => {
                  const heightPct = log.watts > 0
                    ? Math.max(14, Math.min(100, Math.round((log.watts / maxSecondsWatts) * 100)))
                    : 8;
                  const isHigh = log.watts >= maxSecondsWatts * 0.75 && log.watts > 0;

                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1 group relative max-w-[28px]"
                    >
                      {/* Rich Floating Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-12 z-20 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded shadow-lg whitespace-nowrap transition-opacity">
                        {log.timeStr} • {log.watts}W ({log.voltage.toFixed(1)}V)
                      </div>

                      {/* Bar Track & Fill */}
                      <div className="w-full h-32 bg-slate-100 dark:bg-neutral-800/80 rounded-t-md flex items-end justify-center p-0.5">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-xs transition-all duration-300 ${
                            isHigh
                              ? 'bg-gradient-to-t from-orange-600 to-[#ff5b26] shadow-xs'
                              : log.watts > 0
                              ? 'bg-gradient-to-t from-amber-500 to-orange-400'
                              : 'bg-slate-300 dark:bg-neutral-700 min-h-[4px]'
                          }`}
                        />
                      </div>

                      <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono font-medium truncate w-full text-center">
                        {log.timeStr.slice(3)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-slate-400 text-xs">
                  Streaming incoming telemetry...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 pt-2 border-t border-slate-200 dark:border-neutral-800 font-medium">
              <span>Streaming 12 real-time snapshots from submeter {meterData.meter_id}</span>
              <span className="font-mono text-slate-800 dark:text-neutral-200">
                Current: {(meterData.active_power * 1000).toFixed(0)}W
              </span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: HOURLY (12 DISTINCT TWO-HOUR COLUMNS ACROSS 24H)   */}
        {/* ========================================================= */}
        {chartMode === 'hourly' && (
          <div className="space-y-2">
            <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-2.5 pt-4 px-1">
              {activeHourlyData.map((h, i) => {
                const heightPct = h.kwh > 0
                  ? Math.max(14, Math.min(100, Math.round((h.kwh / maxHourlyKwh) * 100)))
                  : 8;
                const isPeak = h.kwh >= maxHourlyKwh * 0.85 && h.kwh > 0;

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 group relative max-w-[36px]"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-12 z-20 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded shadow-lg whitespace-nowrap transition-opacity">
                      {h.hourLabel} • {h.kwh.toFixed(2)} kWh (₦{h.cost})
                    </div>

                    {/* Bar Track & Fill */}
                    <div className="w-full h-32 bg-slate-100 dark:bg-neutral-800/80 rounded-t-md flex items-end justify-center p-0.5">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-xs transition-all ${
                          isPeak
                            ? 'bg-gradient-to-t from-orange-600 to-[#ff5b26] shadow-xs'
                            : h.kwh > 0
                            ? 'bg-gradient-to-t from-amber-500 to-orange-400'
                            : 'bg-slate-300/60 dark:bg-neutral-700/60 min-h-[4px]'
                        }`}
                      />
                    </div>

                    <span className="text-[9px] text-slate-500 dark:text-neutral-400 font-bold truncate w-full text-center">
                      {h.hourLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 pt-2 border-t border-slate-200 dark:border-neutral-800 font-medium">
              <span>Peak: {peakHourlyEntry && peakHourlyEntry.kwh > 0 ? `${peakHourlyEntry.hourLabel} (${peakHourlyEntry.kwh.toFixed(2)} kWh)` : 'Idle / Baseline'}</span>
              <span>Tariff: ₦{meterData.tariff_rate}/kWh</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: DAILY (7 DISTINCT COLUMNS: MON - SUN)             */}
        {/* ========================================================= */}
        {chartMode === 'daily' && (
          <div className="space-y-2">
            <div className="h-44 flex items-end justify-between gap-3 sm:gap-5 pt-4 px-2">
              {activeDailyData.map((d, i) => {
                const heightPct = d.kwh > 0
                  ? Math.max(14, Math.min(100, Math.round((d.kwh / maxDailyKwh) * 100)))
                  : 8;
                const isPeak = d.kwh >= maxDailyKwh * 0.85 && d.kwh > 0;

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 group relative max-w-[48px]"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-12 z-20 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded shadow-lg whitespace-nowrap transition-opacity">
                      {d.dayLabel} • {d.kwh.toFixed(1)} kWh (₦{d.cost})
                    </div>

                    {/* Bar Track & Fill */}
                    <div className="w-full h-32 bg-slate-100 dark:bg-neutral-800/80 rounded-t-lg flex items-end justify-center p-1">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-md transition-all ${
                          isPeak
                            ? 'bg-gradient-to-t from-orange-600 to-[#ff5b26] shadow-xs'
                            : d.kwh > 0
                            ? 'bg-gradient-to-t from-amber-500 to-orange-400'
                            : 'bg-slate-300/60 dark:bg-neutral-700/60 min-h-[6px]'
                        }`}
                      />
                    </div>

                    <span className="text-[11px] font-bold text-slate-600 dark:text-neutral-400 text-center">
                      {d.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 pt-2 border-t border-slate-200 dark:border-neutral-800 font-medium">
              <span>Weekly Total: {meterData.energy_week.toFixed(1)} kWh</span>
              <span>Tariff: ₦{meterData.tariff_rate}/kWh</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid Blackout & Outage Forensics Card (Pure DB Outage Logs) */}
      <OutageHistoryCard />

    </div>
  );
};
