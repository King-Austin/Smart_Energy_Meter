import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { MeterSummary } from '../../types/meter';
import { ModalWrapper } from '../common/ModalWrapper';

export interface AdminAdjustUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meter: MeterSummary | null;
  currentUnits: number;
  onSave: (meterId: string, units: number, pin: string) => Promise<{ success: boolean; error?: string }>;
}

export const AdminAdjustUnitsModal: React.FC<AdminAdjustUnitsModalProps> = ({
  isOpen,
  onClose,
  meter,
  currentUnits,
  onSave
}) => {
  const [targetUnits, setTargetUnits] = useState(100.0);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTargetUnits(currentUnits);
      setAdminPin('');
      setPinError('');
      setIsSubmitting(false);
    }
  }, [isOpen, currentUnits]);

  if (!meter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (adminPin.length !== 4) {
      setPinError('PIN must be 4 digits.');
      return;
    }

    if (adminPin !== '1234') {
      setPinError('Invalid Admin PIN. (Default: 1234)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSave(meter.meter_id, targetUnits, adminPin);
      if (res.success) {
        onClose();
      } else {
        setPinError(res.error || 'Failed to update units.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Prepaid Units (kWh)"
      subtitle={`${meter.meter_name} (${meter.meter_id})`}
      icon={<Zap className="w-6 h-6" />}
      iconBgClass="bg-amber-500/15 text-amber-600"
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-500">
              Set New Balance (kWh)
            </label>
            <span className="text-[11px] text-slate-400">
              Current: {currentUnits.toFixed(2)} kWh
            </span>
          </div>
          <input
            type="number"
            step="0.1"
            min="0"
            max="99999"
            value={targetUnits}
            onChange={(e) => setTargetUnits(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-base font-mono font-black text-slate-900 dark:text-white"
          />

          {/* Quick preset increments */}
          <div className="flex gap-1.5 pt-1">
            {[10, 50, 100, 200].map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => setTargetUnits((prev) => Math.round((prev + inc) * 10) / 10)}
                className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-[10px] font-bold transition-colors cursor-pointer"
              >
                +{inc}
              </button>
            ))}
            <button
              key="reset-100"
              type="button"
              onClick={() => setTargetUnits(100.0)}
              className="flex-1 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black transition-colors cursor-pointer"
            >
              100k
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase text-slate-500 block">
              Admin PIN (Default: 1234)
            </label>
            <button
              type="button"
              onClick={() => setAdminPin('1234')}
              className="text-[10px] font-bold text-[#ff5b26] hover:underline cursor-pointer"
            >
              Fill 1234
            </button>
          </div>

          <input
            type="password"
            maxLength={4}
            value={adminPin}
            onChange={(e) => {
              setAdminPin(e.target.value.replace(/\D/g, ''));
              setPinError('');
            }}
            placeholder="••••"
            className="w-full text-center tracking-widest text-lg font-mono py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 focus:border-[#ff5b26] focus:outline-hidden"
          />
          {pinError && <p className="text-xs text-red-500 font-bold text-center">{pinError}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || adminPin.length !== 4}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
          >
            {isSubmitting ? 'Updating...' : 'Update Balance'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
