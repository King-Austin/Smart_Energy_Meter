import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { ShieldAlert, PhoneCall, Building2 } from 'lucide-react';

export const QuickTamperUnlockCard: React.FC = () => {
  const { meterData, setIsTamperModalOpen } = useMeter();

  const isTampered = meterData.is_tampered || meterData.tamper_locked;

  if (!isTampered) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-b from-red-500/15 via-red-500/10 to-transparent border-2 border-red-500/80 dark:border-red-500/70 shadow-lg animate-fade-in">
      {/* Background ambient glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start gap-3.5 relative z-10">
        <div className="p-3 rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30 shrink-0 animate-pulse">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider">
              Contactor Isolated
            </span>
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              {meterData.meter_id}
            </span>
          </div>
          <h3 className="text-base font-black text-neutral-900 dark:text-white mt-1 leading-snug">
            Tamper Detected — Contact Property Administrator
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
            The meter enclosure security switch was triggered. For safety and compliance, mains electricity has been isolated and locked.
          </p>
        </div>
      </div>

      {/* Security Info Card */}
      <div className="mt-4 p-4 rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-red-500/30 backdrop-blur-sm relative z-10 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0">
            <Building2 className="w-5 h-5 text-[#ff5b26]" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-neutral-900 dark:text-white">
              Administrator Action Required
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 mt-0.5 leading-normal">
              Per facility management policy, tamper locks cannot be reset from the resident portal. An authorized technician or property admin must inspect the meter seal and re-energize the supply via the Admin Console.
            </p>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px]">
            <PhoneCall className="w-3.5 h-3.5 text-[#ff5b26]" />
            <span>Facility Management Support Active</span>
          </div>
          <button
            type="button"
            onClick={() => setIsTamperModalOpen(true)}
            className="text-[11px] font-bold text-[#ff5b26] hover:underline cursor-pointer"
          >
            View Event Forensics
          </button>
        </div>
      </div>
    </div>
  );
};
