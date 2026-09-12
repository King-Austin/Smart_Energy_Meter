import React from 'react';
import { Smartphone, Download, QrCode } from 'lucide-react';

export interface LandingMobileDownloadProps {
  downloadStarted: boolean;
  onDownload: () => void;
  onOpenQrModal: () => void;
  theme?: 'light' | 'dark';
}

export const LandingMobileDownload: React.FC<LandingMobileDownloadProps> = ({
  downloadStarted,
  onDownload,
  onOpenQrModal,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <section id="mobile-app" className={`max-w-7xl mx-auto px-4 sm:px-8 py-20 border-t transition-colors ${
      isDark ? 'border-white/[0.08] text-slate-100' : 'border-slate-200 text-slate-900'
    }`}>
      <div className={`rounded-3xl p-8 sm:p-12 relative overflow-hidden border transition-all shadow-xl ${
        isDark
          ? 'bg-gradient-to-r from-slate-900 via-[#10141d] to-slate-950 border-white/10'
          : 'bg-gradient-to-r from-white via-slate-50 to-orange-50/20 border-slate-200 shadow-slate-200/60'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Native Android Build Verified</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Control Your Submeter From Your Pocket.
            </h2>

            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Experience real-time power monitoring with native physical haptics, instant push alerts when voltage 
              trips occur, one-tap remote power disconnect, and automatic offline tracking when your home internet drops.
            </p>

            {/* Specifications Card */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="text-[10px] uppercase font-bold text-slate-400">Package Format</div>
                <div className={`text-sm font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Android APK
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="text-[10px] uppercase font-bold text-slate-400">File Size</div>
                <div className="text-sm font-black text-[#ff5b26] mt-0.5">5.5 MB</div>
              </div>
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="text-[10px] uppercase font-bold text-slate-400">Target OS</div>
                <div className="text-sm font-black text-emerald-500 mt-0.5">Android 8.0+</div>
              </div>
            </div>

            {/* Big Download Button */}
            <div className="pt-3 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onDownload}
                className="flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-[#ff5b26] to-[#e04512] hover:from-[#ff6d3d] hover:to-[#ff5b26] text-white font-black text-sm shadow-xl shadow-[#ff5b26]/30 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <Download className={`w-5 h-5 text-white ${downloadStarted ? 'animate-bounce' : ''}`} />
                <div className="text-left">
                  <div className="text-base font-black">
                    {downloadStarted ? 'Downloading APK...' : 'Download Android App (.APK)'}
                  </div>
                  <div className="text-[11px] text-white/80 font-medium">Production Build • Direct Install</div>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenQrModal}
                className={`flex items-center gap-2 px-5 py-4 rounded-2xl font-bold text-sm border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.1] border-white/10 text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                <QrCode className="w-5 h-5 text-[#ff5b26]" />
                <span>Scan QR Code</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>💡</span>
              <span>Requires enabling <strong>&ldquo;Install from Unknown Sources&rdquo;</strong> on your Android phone.</span>
            </div>
          </div>

          {/* Right: Genuine Android App Interface on Smartphone Chassis */}
          <div className="lg:col-span-5 flex justify-center">
            <div className={`w-full max-w-[260px] xs:max-w-[280px] sm:max-w-[310px] rounded-[36px] sm:rounded-[42px] p-2 sm:p-2.5 border-4 shadow-2xl relative transition-all ${
              isDark
                ? 'bg-[#0c1017] border-slate-800 shadow-black/80 ring-1 ring-white/10'
                : 'bg-slate-100 border-slate-300 shadow-slate-400/50 ring-1 ring-slate-200'
            }`}>
              {/* Pristine Screen Content - Stretched cleanly to fill phone viewport edge-to-edge */}
              <div className={`rounded-[28px] sm:rounded-[34px] overflow-hidden border relative shadow-inner aspect-[560/912] w-full ${
                isDark ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-200'
              }`}>
                <img
                  src="/screenshots/light/home_light.png"
                  alt="Voltrix Native Android Submeter Interface"
                  className="w-full h-full object-cover object-top select-none shadow-sm"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
