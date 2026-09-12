import React, { useState } from 'react';
import { useMeter } from '../../context/MeterContext';
import { ShieldAlert, Zap, Copy, Check, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../../services/nativeService';

export const TamperQuickActionBar: React.FC = () => {
  const { fleetMeters, handleAdminClearTamper } = useMeter();
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const tamperedMeters = fleetMeters.filter(m => m.is_tampered || m.tamper_locked);

  if (tamperedMeters.length === 0) {
    return null;
  }

  const handleCopyCode = (meterId: string, code: string = '1234') => {
    navigator.clipboard.writeText(code);
    setCopiedId(meterId);
    triggerHaptic('light');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearSingle = async (meterId: string) => {
    setClearingId(meterId);
    triggerHaptic('medium');
    try {
      const res = await handleAdminClearTamper(meterId, '1234');
      if (res.success) {
        triggerHaptic('success');
      } else {
        triggerHaptic('error');
      }
    } finally {
      setClearingId(null);
    }
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    triggerHaptic('medium');
    try {
      for (const meter of tamperedMeters) {
        await handleAdminClearTamper(meter.meter_id, '1234');
      }
      triggerHaptic('success');
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <div className="rounded-3xl p-5 bg-gradient-to-r from-red-500/15 via-red-500/10 to-amber-500/10 border-2 border-red-500/70 shadow-md animate-fade-in space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                Tamper Lock Active
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
                {tamperedMeters.length} {tamperedMeters.length === 1 ? 'Meter' : 'Meters'} Locked
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-300">
              Contactor relay open. Tenant load disconnected. Clear tamper to reconnect supply.
            </p>
          </div>
        </div>

        {/* Bulk Reconnect if more than 1 meter */}
        {tamperedMeters.length > 1 && (
          <button
            type="button"
            disabled={isClearingAll}
            onClick={handleClearAll}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isClearingAll ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-white" />
            )}
            <span>Reconnect All ({tamperedMeters.length}) Loads</span>
          </button>
        )}
      </div>

      {/* Meter List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {tamperedMeters.map(meter => {
          const isClearing = clearingId === meter.meter_id || isClearingAll;
          const isCopied = copiedId === meter.meter_id;

          return (
            <div
              key={meter.meter_id}
              className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#0d1219]/90 border border-red-500/40 flex flex-wrap items-center justify-between gap-3 shadow-xs"
            >
              {/* Meter Info */}
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {meter.meter_name}
                </h4>
                <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                  {meter.meter_id}
                </span>

                {/* Tamper Code Badge + Copy */}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-neutral-400">
                    Tamper Code:
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-xs font-mono font-black text-[#ff5b26]">
                    1234
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(meter.meter_id, '1234')}
                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Copy code to share with tenant"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instant Clear & Connect Load Button */}
              <button
                type="button"
                disabled={isClearing}
                onClick={() => handleClearSingle(meter.meter_id)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isClearing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 fill-white" />
                )}
                <span>Clear & Connect Load</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
