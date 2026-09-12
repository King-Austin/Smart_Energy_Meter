import React from 'react';
import { Building2, ShieldAlert, Zap, DollarSign, Activity, Eye, Power, Settings } from 'lucide-react';
import { MeterSummary } from '../../types/meter';
import { formatPower } from '../../utils/formatters';

export interface SubmeterCardProps {
  meter: MeterSummary;
  onInspect: (meter: MeterSummary) => void;
  onToggleRelay: (meter: MeterSummary) => void;
  onOpenConfig: (meter: MeterSummary) => void;
  onOpenUnits: (meter: MeterSummary) => void;
  onClearTamper: (meterId: string) => void;
  onOpenTamperModal: (meterId: string) => void;
}

export const SubmeterCard: React.FC<SubmeterCardProps> = ({
  meter,
  onInspect,
  onToggleRelay,
  onOpenConfig,
  onOpenUnits,
  onClearTamper,
  onOpenTamperModal
}) => {
  const isOnline = meter.grid_status === 'online';
  const isRelayOn = meter.main_supply_connected;
  const isTampered = meter.is_tampered || meter.tamper_locked;
  const activePowerFormatted = formatPower(Number(meter.active_power || 0));

  return (
    <div
      className={`rounded-3xl p-5 bg-white dark:bg-[#0d1219] border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between ${
        isTampered
          ? 'border-red-500/80 bg-red-500/5'
          : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
      }`}
    >
      <div>
        {/* Card Header: Unit & Meter ID */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                isTampered
                  ? 'bg-red-600'
                  : isRelayOn
                  ? 'bg-gradient-to-tr from-[#ff5b26] to-[#e04818]'
                  : 'bg-slate-400'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {meter.meter_name}
                </h3>
                {isOnline ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 block">
                {meter.meter_id} • {meter.location || 'Block Main'}
              </span>
            </div>
          </div>

          {/* Relay State Badge */}
          <span
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
              isRelayOn
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25'
            }`}
          >
            {isRelayOn ? 'Contactor ON' : 'Contactor CUT'}
          </span>
        </div>

        {/* Tamper Warning & Quick Action Banner */}
        {isTampered && (
          <div className="mt-3.5 p-3 rounded-2xl bg-red-500/15 border border-red-500 text-red-700 dark:text-red-300 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                <span>Enclosure Tamper Locked</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 text-[11px] font-mono font-black text-[#ff5b26]">
                Code: 1234
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onClearTamper(meter.meter_id)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Clear & Connect Load</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenTamperModal(meter.meter_id)}
                className="py-1.5 px-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-200 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Forensics
              </button>
            </div>
          </div>
        )}

        {/* Telemetry Matrix */}
        <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-neutral-800/80 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Active Load
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white mono-num">
              {activePowerFormatted.full}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Voltage
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white mono-num">
              {Number(meter.voltage || 230).toFixed(1)} V
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Current
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white mono-num">
              {Number(meter.current || 0).toFixed(1)} A
            </span>
          </div>
        </div>

        {/* Financial, Tariff & Prepaid Units Details */}
        <div className="mt-3.5 space-y-2 text-xs px-1">
          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-bold">Prepaid Balance:</span>
              <span className="font-black font-mono text-sm">
                {Number(meter.prepaid_units_kwh !== undefined ? meter.prepaid_units_kwh : 100.0).toFixed(2)} kWh
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenUnits(meter)}
              className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Adjust
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-400">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tariff:</span>
              <span className="font-bold text-slate-900 dark:text-white mono-num">
                ₦{meter.tariff_rate || 160.0}/kWh
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-400">
              <Activity className="w-3.5 h-3.5 text-[#ff5b26]" />
              <span>Today:</span>
              <span className="font-bold text-slate-900 dark:text-white mono-num">
                {Number(meter.energy_today || 0).toFixed(1)} kWh
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions: "Inspect Client Dashboard", Relay Toggle, Config */}
      <div className="mt-5 pt-3.5 border-t border-slate-200/80 dark:border-neutral-800 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onInspect(meter)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-[#ff5b26]" />
          <span>Inspect Client View</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleRelay(meter)}
          className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
            meter.main_supply_connected
              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-200 dark:border-red-900/40'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-200 dark:border-emerald-900/40'
          }`}
          title={meter.main_supply_connected ? 'Disconnect Relay' : 'Connect Relay'}
        >
          <Power className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onOpenConfig(meter)}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
          title="Configure Meter Tariff & Limits"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
