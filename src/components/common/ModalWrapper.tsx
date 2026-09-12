import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { registerBackHandler } from '../../services/navigationService';

export interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgClass?: string;
  maxWidth?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconBgClass = 'bg-[#ff5b26]/15 text-[#ff5b26]',
  maxWidth = 'max-w-md',
  showCloseButton = true,
  children
}) => {
  // Register hardware and ESC back navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const unregister = registerBackHandler('modal-wrapper', 20, () => {
      onClose();
      return true;
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unregister();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidth} rounded-3xl p-6 bg-white dark:bg-[#0d1219] border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (if title or icon provided) */}
        {(title || icon) && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {icon && (
                <div className={`p-3 rounded-2xl shrink-0 ${iconBgClass}`}>
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
