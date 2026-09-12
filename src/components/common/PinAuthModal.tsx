import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';

export interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorize: (pin: string) => Promise<boolean | void>;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  iconBgClass?: string;
  actionButtonText?: string;
  actionButtonClass?: string;
  children?: React.ReactNode;
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthorize,
  title,
  subtitle,
  description,
  icon = <Lock className="w-6 h-6" />,
  iconBgClass = 'bg-[#ff5b26]/15 text-[#ff5b26]',
  actionButtonText = 'Authorize Action',
  actionButtonClass = 'bg-[#ff5b26] hover:bg-[#e04818]',
  children
}) => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setPinError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits.');
      return;
    }

    if (pin !== '1234') {
      setPinError('Invalid Admin PIN. (Default: 1234)');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onAuthorize(pin);
      if (result === false) {
        setPinError('Authorization failed.');
      } else {
        onClose();
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
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconBgClass={iconBgClass}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {description && (
          <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
            {description}
          </p>
        )}

        {children}

        {/* PIN Input Block */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase text-slate-500 block">
              Admin PIN (Default: 1234)
            </label>
            <button
              type="button"
              onClick={() => setPin('1234')}
              className="text-[10px] font-bold text-[#ff5b26] hover:underline cursor-pointer"
            >
              Fill 1234
            </button>
          </div>

          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setPinError('');
            }}
            placeholder="••••"
            autoFocus
            className="w-full text-center tracking-widest text-lg font-mono py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 focus:border-[#ff5b26] focus:outline-hidden"
          />
          {pinError && <p className="text-xs text-red-500 font-bold text-center">{pinError}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || pin.length !== 4}
            className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-40 shadow-xs cursor-pointer ${actionButtonClass}`}
          >
            {isSubmitting ? 'Verifying...' : actionButtonText}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
