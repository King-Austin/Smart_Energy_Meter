import React from 'react';
import { Building2, Zap, Activity, DollarSign, ShieldAlert, Clock } from 'lucide-react';
import { formatPower } from '../../utils/formatters';

export interface FleetKpiBannerProps {
  totalMeters: number;
  onlineMeters: number;
  totalLoadKw: number;
  totalEnergyTodayKwh: number;
  totalRevenueTodayNaira: number;
  activeTampersCount: number;
  onTamperClick: () => void;
}

export const FleetKpiBanner: React.FC<FleetKpiBannerProps> = ({
  totalMeters,
  onlineMeters,
  totalLoadKw,
  totalEnergyTodayKwh,
  totalRevenueTodayNaira,
  activeTampersCount,
  onTamperClick
}) => {
  const formattedDemand = formatPower(totalLoadKw);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Total Submeters */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
          <span>Submeters</span>
          <Building2 className="w-4 h-4 text-[#ff5b26]" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {totalMeters}
          </span>
          <span className="text-[11px] font-bold text-emerald-600">
            {onlineMeters} Online
          </span>
        </div>
        <span className="text-[10px] text-slate-400 block mt-0.5">
          100% Modbus True-RMS
        </span>
      </div>

      {/* 2. Live Estate Demand */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
          <span>Estate Demand</span>
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 dark:text-white mono-num">
            {formattedDemand.value}
          </span>
          <span className="text-xs font-bold text-slate-500">{formattedDemand.unit}</span>
        </div>
        <span className="text-[10px] text-slate-400 block mt-0.5">
          Active load across facility
        </span>
      </div>

      {/* 3. Cumulative Energy Today */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
          <span>Energy Today</span>
          <Activity className="w-4 h-4 text-[#0284c7]" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 dark:text-white mono-num">
            {totalEnergyTodayKwh.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-slate-500">kWh</span>
        </div>
        <span className="text-[10px] text-slate-400 block mt-0.5">
          Total client draw
        </span>
      </div>

      {/* 4. Revenue Generated Today */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
          <span>Revenue Today</span>
          <DollarSign className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 dark:text-white mono-num">
            ₦{totalRevenueTodayNaira.toLocaleString()}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 block mt-0.5">
          Based on configured tariffs
        </span>
      </div>

      {/* 5. Active Tamper Alerts */}
      <div
        onClick={onTamperClick}
        className={`p-4 rounded-3xl border cursor-pointer transition-all shadow-2xs ${
          activeTampersCount > 0
            ? 'bg-red-500/10 border-red-500 hover:bg-red-500/15 animate-pulse'
            : 'bg-white dark:bg-[#0d1219] border-slate-200 dark:border-neutral-800'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className={activeTampersCount > 0 ? 'text-red-700 dark:text-red-300 font-black' : 'text-slate-500 dark:text-neutral-400'}>
            Tamper Alerts
          </span>
          <ShieldAlert className={`w-4 h-4 ${activeTampersCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className={`text-2xl font-black ${activeTampersCount > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
            {activeTampersCount}
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            {activeTampersCount > 0 ? 'TRIPPED' : 'Secure'}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 block mt-0.5">
          Enclosure Lid Sensors
        </span>
      </div>

      {/* 6. Grid Outage Incidents */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-semibold">
          <span>Grid Incidents</span>
          <Clock className="w-4 h-4 text-purple-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            0
          </span>
          <span className="text-[11px] font-bold text-emerald-600">
            Normal 230V
          </span>
        </div>
        <span className="text-[10px] text-slate-400 block mt-0.5">
          AC supply continuous
        </span>
      </div>
    </div>
  );
};
