import React from 'react';
import { Download, Activity, ArrowRight, QrCode, CheckCircle2, GraduationCap } from 'lucide-react';
import { AppRoute } from '../../types/meter';

export interface LandingHeroProps {
  downloadStarted: boolean;
  onDownload: () => void;
  onOpenQrModal: () => void;
  navigateToRoute: (route: AppRoute) => void;
  theme?: 'light' | 'dark';
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  downloadStarted,
  onDownload,
  onOpenQrModal,
  navigateToRoute,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Academic Capstone Thesis Announcement Pill */}
      <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
        isDark
          ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
          : 'bg-amber-50 border-amber-300 text-amber-900'
      }`}>
        <GraduationCap className="w-4 h-4 text-amber-500" />
        <span className="font-bold">Undergraduate Engineering Capstone</span>
        <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>•</span>
        <span>Supervised by <strong>Prof. Mrs. Okezie</strong></span>
      </div>

      {/* Main Headline (Bold iPhone Standard) */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.06]">
        Smart Electricity.{' '}
        <span className="block bg-gradient-to-r from-[#ff5b26] via-[#ff7e54] to-amber-500 bg-clip-text text-transparent">
          Purely Automatic.
        </span>
      </h1>

      {/* Value-Driven Elevator Pitch Subtitle */}
      <p className={`text-base sm:text-lg font-normal leading-relaxed max-w-2xl ${
        isDark ? 'text-slate-300' : 'text-slate-600'
      }`}>
        Take back total control of your power. Say goodbye to unfair estimated bills, midnight 20-digit token hassles, and appliance-destroying voltage spikes. Voltrix tracks every watt in real time, credits your recharges instantly, and protects your entire home straight from your smartphone.
      </p>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center gap-3.5">
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-[#ff5b26] hover:bg-[#e04512] text-white font-bold text-sm shadow-xl shadow-[#ff5b26]/25 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
        >
          <Download className={`w-4 h-4 text-white ${downloadStarted ? 'animate-bounce' : ''}`} />
          <span>{downloadStarted ? 'Downloading APK...' : 'Download for Android (.APK)'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigateToRoute('client')}
          className={`flex items-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-sm backdrop-blur-md border transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
            isDark
              ? 'bg-white/[0.06] hover:bg-white/[0.1] border-white/10 text-white hover:border-white/20'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <Activity className="w-4 h-4 text-[#ff5b26]" />
          <span>Launch Web Dashboard</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={onOpenQrModal}
          className={`p-4 rounded-2xl border transition-colors cursor-pointer ${
            isDark
              ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
          }`}
          title="Scan QR Code to download on mobile"
        >
          <QrCode className="w-5 h-5 text-[#ff5b26]" />
        </button>
      </div>

      {/* Clean Trust Pillars */}
      <div className={`pt-2 flex flex-wrap items-center gap-5 text-xs ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Instant Recharge — Zero Token Slips</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Smart Surge & Appliance Defense</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>100% Bill Transparency</span>
        </div>
      </div>
    </div>
  );
};
