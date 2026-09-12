import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { ModalWrapper } from '../common/ModalWrapper';

export interface AdminBulkTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  meterCount: number;
  onSave: (newTariff: number, pin: string) => Promise<{ success: boolean; error?: string }>;
}

export const AdminBulkTariffModal: React.FC<AdminBulkTariffModalProps> = ({
  isOpen,
  onClose,
  meterCount,
  onSave
}) => {
  const [bulkTariff, setBulkTariff] = useState(160.0);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBulkTariff(160.0);
      setAdminPin('');
      setPinError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
      const res = await onSave(bulkTariff, adminPin);
      if (res.success) {
        onClose();
      } else {
        setPinError(res.error || 'Failed to update bulk tariff.');
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
      title="Bulk Tariff Update"
      subtitle={`Apply new ₦/kWh rate to all ${meterCount} submeters`}
      icon={<DollarSign className="w-6 h-6" />}
      iconBgClass="bg-emerald-500/15 text-emerald-600"
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 block">
            New Tariff Rate (₦/kWh)
          </label>
          <input
            type="number"
            step="0.1"
            value={bulkTariff}
            onChange={(e) => setBulkTariff(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-sm font-mono font-bold"
          />
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
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || adminPin.length !== 4}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
          >
            {isSubmitting ? 'Updating...' : 'Update Tariff'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
