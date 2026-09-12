import React from 'react';
import { Download, QrCode } from 'lucide-react';
import { ModalWrapper } from '../common/ModalWrapper';

export interface LandingQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const LandingQrModal: React.FC<LandingQrModalProps> = ({
  isOpen,
  onClose,
  onDownload
}) => {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Scan to Install on Android"
      subtitle="Point your phone camera at this QR code to download Voltrix-SmartMeter.apk directly."
      icon={<QrCode className="w-6 h-6" />}
      iconBgClass="bg-[#ff5b26]/10 text-[#ff5b26]"
      maxWidth="max-w-sm"
    >
      <div className="text-center space-y-4 pt-1">
        {/* Vector QR Code */}
        <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-inner">
          <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="white" />
            {/* Corner Markers */}
            <rect x="10" y="10" width="22" height="22" fill="#0a0d14" rx="3" />
            <rect x="14" y="14" width="14" height="14" fill="white" />
            <rect x="18" y="18" width="6" height="6" fill="#ff5b26" />

            <rect x="68" y="10" width="22" height="22" fill="#0a0d14" rx="3" />
            <rect x="72" y="14" width="14" height="14" fill="white" />
            <rect x="76" y="18" width="6" height="6" fill="#ff5b26" />

            <rect x="10" y="68" width="22" height="22" fill="#0a0d14" rx="3" />
            <rect x="14" y="72" width="14" height="14" fill="white" />
            <rect x="18" y="76" width="6" height="6" fill="#ff5b26" />

            {/* Data Matrix Elements */}
            <rect x="36" y="12" width="6" height="6" fill="#0a0d14" />
            <rect x="46" y="12" width="6" height="6" fill="#0a0d14" />
            <rect x="56" y="16" width="6" height="6" fill="#0a0d14" />
            <rect x="36" y="24" width="6" height="6" fill="#0a0d14" />
            <rect x="48" y="24" width="6" height="6" fill="#0a0d14" />

            <rect x="12" y="38" width="6" height="6" fill="#0a0d14" />
            <rect x="22" y="44" width="6" height="6" fill="#0a0d14" />
            <rect x="32" y="38" width="6" height="6" fill="#0a0d14" />
            <rect x="44" y="38" width="12" height="12" fill="#ff5b26" rx="2" />
            <rect x="62" y="38" width="6" height="6" fill="#0a0d14" />
            <rect x="74" y="44" width="6" height="6" fill="#0a0d14" />
            <rect x="84" y="38" width="6" height="6" fill="#0a0d14" />

            <rect x="38" y="56" width="6" height="6" fill="#0a0d14" />
            <rect x="48" y="56" width="6" height="6" fill="#0a0d14" />
            <rect x="58" y="56" width="6" height="6" fill="#0a0d14" />

            <rect x="36" y="68" width="6" height="6" fill="#0a0d14" />
            <rect x="48" y="74" width="6" height="6" fill="#0a0d14" />
            <rect x="62" y="68" width="6" height="6" fill="#0a0d14" />
            <rect x="72" y="74" width="6" height="6" fill="#0a0d14" />
            <rect x="82" y="68" width="6" height="6" fill="#0a0d14" />
          </svg>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onDownload}
            className="w-full py-3 rounded-xl bg-[#ff5b26] hover:bg-[#ff6d3d] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Direct Download on this PC (4.4 MB)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
