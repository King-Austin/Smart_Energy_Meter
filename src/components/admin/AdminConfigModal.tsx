import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { MeterSummary } from '../../types/meter';
import { ModalWrapper } from '../common/ModalWrapper';

export interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  meter: MeterSummary | null;
  onSave: (
    meterId: string,
    config: { tariff?: number; budgetNaira?: number; budgetKwh?: number; overCurrent?: number },
    pin: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  isOpen,
  onClose,
  meter,
  onSave
}) => {
  const [tariff, setTariff] = useState(160.0);
  const [budgetNaira, setBudgetNaira] = useState(25000);
  const [budgetKwh, setBudgetKwh] = useState(365);
  const [overCurrent, setOverCurrent] = useState(30);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (meter && isOpen) {
      setTariff(meter.tariff_rate || 160.0);
      setBudgetNaira(meter.monthly_budget_naira || 25000);
      setBudgetKwh(meter.monthly_budget_kwh || 365);
      setOverCurrent(meter.over_current_limit || 30);
      setAdminPin('');
      setPinError('');
      setIsSubmitting(false);
    }
  }, [meter, isOpen]);

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
      const res = await onSave(
        meter.meter_id,
        {
          tariff,
          budgetNaira,
          budgetKwh,
          overCurrent
        },
        adminPin
      );

      if (res.success) {
        onClose();
      } else {
        setPinError(res.error || 'Failed to update configuration.');
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
      title="Configure Submeter"
      subtitle={`${meter.meter_name} (${meter.meter_id})`}
      icon={<Settings className="w-6 h-6" />}
      iconBgClass="bg-[#ff5b26]/15 text-[#ff5b26]"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Tariff (₦/kWh)
            </label>
            <input
              type="number"
              step="0.1"
              value={tariff}
              onChange={(e) => setTariff(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Overcurrent Limit (A)
            </label>
            <input
              type="number"
              value={overCurrent}
              onChange={(e) => setOverCurrent(parseInt(e.target.value, 10) || 30)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Monthly Budget (₦)
            </label>
            <input
              type="number"
              value={budgetNaira}
              onChange={(e) => setBudgetNaira(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Monthly Budget (kWh)
            </label>
            <input
              type="number"
              value={budgetKwh}
              onChange={(e) => setBudgetKwh(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-mono font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
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
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || adminPin.length !== 4}
            className="flex-1 py-2.5 rounded-xl bg-[#ff5b26] hover:bg-[#e04818] text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
          >
            {isSubmitting ? 'Saving...' : 'Save Config'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
