import React, { useState, useRef, useEffect } from 'react';
import { useMeter } from '../../context/MeterContext';
import { ShieldAlert, Zap, CheckCircle2, AlertCircle, KeyRound, ExternalLink, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../../services/nativeService';

export const QuickTamperUnlockCard: React.FC = () => {
  const { meterData, handleAdminClearTamper, setIsTamperModalOpen } = useMeter();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const isTampered = meterData.is_tampered || meterData.tamper_locked;

  useEffect(() => {
    if (isTampered && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [isTampered]);

  if (!isTampered) return null;

  const handleDigitChange = (index: number, value: string) => {
    setErrorMsg('');
    setSuccessMsg('');

    // If pasted full string (e.g. "1234")
    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, '').slice(0, 4).split('');
      const newDigits = ['', '', '', ''];
      cleaned.forEach((d, i) => {
        newDigits[i] = d;
      });
      setDigits(newDigits);
      if (cleaned.length === 4) {
        inputRefs[3].current?.focus();
        submitCode(newDigits.join(''));
      } else {
        const nextIdx = Math.min(cleaned.length, 3);
        inputRefs[nextIdx].current?.focus();
      }
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);

    // Auto advance focus
    if (cleanChar && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // If completed 4 digits, trigger submit
    if (cleanChar && index === 3 && newDigits.every(d => d !== '')) {
      submitCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const submitCode = async (codeToVerify?: string) => {
    const pin = codeToVerify || digits.join('');
    if (pin.length !== 4) {
      setErrorMsg('Please enter a 4-digit code.');
      triggerHaptic('warning');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    triggerHaptic('medium');

    try {
      const res = await handleAdminClearTamper(meterData.meter_id, pin);
      setIsSubmitting(false);

      if (res.success) {
        triggerHaptic('success');
        setSuccessMsg('Tamper lock cleared! Main supply contactor reconnected.');
        setDigits(['', '', '', '']);
      } else {
        triggerHaptic('error');
        setErrorMsg(res.error || 'Invalid Tamper Code. Default PIN: 1234');
      }
    } catch {
      setIsSubmitting(false);
      triggerHaptic('error');
      setErrorMsg('Failed to clear tamper. Try code: 1234');
    }
  };

  const handleUseDefaultPin = () => {
    const defaultPin = ['1', '2', '3', '4'];
    setDigits(defaultPin);
    submitCode('1234');
  };

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
            Tamper Interlock Active — Load Cut Off
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
            The SS-5GL lid switch tripped. Enter your 4-digit Tamper Code to reconnect the supply contactor and power your appliances.
          </p>
        </div>
      </div>

      {/* Tamper Code Inputs */}
      <div className="mt-5 p-4 rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-red-500/30 backdrop-blur-sm relative z-10 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
            <KeyRound className="w-4 h-4 text-[#ff5b26]" />
            <span>Enter 4-Digit Tamper Unlock Code:</span>
          </div>
          <button
            type="button"
            onClick={handleUseDefaultPin}
            className="text-[11px] font-semibold text-[#ff5b26] hover:underline cursor-pointer"
          >
            Quick Fill (1234)
          </button>
        </div>

        {/* 4 Box Digits */}
        <div className="flex justify-center gap-3 my-2">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={digit}
              onChange={e => handleDigitChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              className={`w-13 h-14 text-center text-2xl font-mono font-black rounded-2xl border-2 transition-all duration-200 focus:outline-none select-all ${
                digit
                  ? 'border-[#ff5b26] bg-[#ff5b26]/10 text-neutral-900 dark:text-white'
                  : 'border-neutral-300 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-white focus:border-[#ff5b26]'
              }`}
            />
          ))}
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-red-600 dark:text-red-400 font-bold justify-center animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold justify-center">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          disabled={isSubmitting || digits.some(d => d === '')}
          onClick={() => submitCode()}
          className="mt-4 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff5b26] to-[#e04818] hover:from-[#f0501c] hover:to-[#cb3e13] text-white font-extrabold text-sm shadow-md shadow-[#ff5b26]/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying Code & Reconnecting Contactor...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>Restore Power & Connect Load</span>
            </>
          )}
        </button>
      </div>

      {/* Footer Navigation */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 px-1 relative z-10">
        <span>Default PIN is <strong>1234</strong></span>
        <button
          onClick={() => setIsTamperModalOpen(true)}
          className="flex items-center gap-1 text-[#ff5b26] font-semibold hover:underline"
        >
          <span>Tamper Forensics Log</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
