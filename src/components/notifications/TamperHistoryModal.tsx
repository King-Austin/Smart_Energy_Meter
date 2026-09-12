import React, { useState, useEffect } from 'react';
import { useMeter } from '../../context/MeterContext';
import { ShieldAlert, X, CheckCircle, KeyRound, AlertTriangle, Clock } from 'lucide-react';
import { registerBackHandler } from '../../services/navigationService';

interface TamperHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TamperHistoryModal: React.FC<TamperHistoryModalProps> = ({ isOpen, onClose }) => {
  const { meterData, tamperEvents, handleAdminClearTamper } = useMeter();
  const [adminPin, setAdminPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle hardware back navigation
  useEffect(() => {
    if (isOpen) {
      const unregister = registerBackHandler('tamper-history-modal', 25, () => {
        onClose();
        return true;
      });
      return () => unregister();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasActiveTamper = meterData.is_tampered || meterData.tamper_locked;

  const onResolveTamper = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (adminPin.length !== 4) {
      setErrorMsg('Please enter a 4-digit Admin PIN.');
      return;
    }

    setIsSubmitting(true);
    const res = await handleAdminClearTamper(meterData.meter_id, adminPin);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Tamper lock cleared successfully! Contactor relay reclosed.');
      setAdminPin('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to clear tamper. Verify Admin PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="glass-card max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-red-500/30">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-red-500/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                Tamper History & Unlock
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {meterData.meter_name} ({meterData.meter_id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* Current Status Card */}
          <div
            className={`p-3.5 rounded-2xl border ${
              hasActiveTamper
                ? 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {hasActiveTamper ? (
                <>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>TAMPER LOCK ENGAGED (Power Cut)</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>NORMAL - Physical Enclosure Secure</span>
                </>
              )}
            </div>
            <p className="text-xs mt-1 opacity-90">
              {hasActiveTamper
                ? 'Enclosure lid opened. Power disconnected for safety. Enter Admin PIN below to restore supply.'
                : 'Enclosure is closed and secure. No active tamper alerts.'}
            </p>
          </div>

          {/* Admin PIN Unlock Form (if tampered) */}
          {hasActiveTamper && (
            <form onSubmit={onResolveTamper} className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#ff5b26]" />
                <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Admin Authorization Unlock
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-neutral-500 block">
                    Enter 4-Digit Security PIN (Default: 1234)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdminPin('1234')}
                    className="text-[11px] font-bold text-[#ff5b26] hover:underline cursor-pointer"
                  >
                    Use Default (1234)
                  </button>
                </div>
                <input
                  type="password"
                  maxLength={4}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-center text-lg tracking-widest font-mono font-bold focus:outline-hidden focus:border-[#ff5b26]"
                />
              </div>

              {errorMsg && <p className="text-xs text-red-500 font-bold">{errorMsg}</p>}
              {successMsg && <p className="text-xs text-emerald-500 font-bold">{successMsg}</p>}

              <button
                type="submit"
                disabled={isSubmitting || adminPin.length !== 4}
                className="w-full py-2.5 px-4 rounded-xl bg-[#ff5b26] hover:bg-[#e04f1e] text-white font-bold text-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying...' : 'Clear Tamper & Restore Power'}
              </button>
            </form>
          )}

          {/* Tamper Events Timeline */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Historical Tamper Incidents
            </h4>

            {tamperEvents.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-4">
                No historical tamper incidents logged for this submeter.
              </p>
            ) : (
              <div className="space-y-2">
                {tamperEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            ev.resolved
                              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {ev.event_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                          {ev.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(ev.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        ev.resolved
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/15 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {ev.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
