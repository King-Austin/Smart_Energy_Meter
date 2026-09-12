import React, { useState } from 'react';
import { useMeter } from '../context/MeterContext';
import { Zap, GraduationCap } from 'lucide-react';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingTelemetryDemo } from '../components/landing/LandingTelemetryDemo';
import { LandingAppShowcase } from '../components/landing/LandingAppShowcase';
import { LandingProcessFlow } from '../components/landing/LandingProcessFlow';
import { LandingAcademicSection } from '../components/landing/LandingAcademicSection';
import { LandingFeatures } from '../components/landing/LandingFeatures';
import { LandingMobileDownload } from '../components/landing/LandingMobileDownload';
import { LandingFaq } from '../components/landing/LandingFaq';
import { LandingQrModal } from '../components/landing/LandingQrModal';

export const LandingScreen: React.FC = () => {
  const {
    meterData,
    theme,
    toggleTheme,
    navigateToRoute,
    toggleMainSupply
  } = useMeter();

  const isDark = theme === 'dark';

  const [showQrModal, setShowQrModal] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = '/Voltrix-SmartMeter.apk';
    link.download = 'Voltrix-SmartMeter.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadStarted(false);
    }, 4000);
  };

  return (
    <div className={`min-h-screen selection:bg-[#ff5b26]/30 selection:text-[#ff5b26] relative overflow-hidden font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#080a0f] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      {/* Dynamic Background Light Glows */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] blur-[140px] pointer-events-none -z-10 transition-opacity ${
        isDark ? 'bg-gradient-to-b from-[#ff5b26]/15 via-[#ff5b26]/5 to-transparent opacity-100' : 'bg-gradient-to-b from-[#ff5b26]/10 via-amber-200/20 to-transparent opacity-60'
      }`} />
      <div className={`absolute top-[40%] right-[-10%] w-[600px] h-[500px] blur-[150px] pointer-events-none -z-10 transition-opacity ${
        isDark ? 'bg-emerald-500/10 opacity-100' : 'bg-emerald-200/30 opacity-60'
      }`} />
      <div className={`absolute bottom-[10%] left-[-10%] w-[550px] h-[450px] blur-[130px] pointer-events-none -z-10 transition-opacity ${
        isDark ? 'bg-cyan-500/10 opacity-100' : 'bg-cyan-200/30 opacity-60'
      }`} />

      {/* Grid Pattern Overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none -z-10 transition-opacity ${
          isDark ? 'opacity-[0.03]' : 'opacity-[0.04]'
        }`} 
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)'
            : 'radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} 
      />

      {/* 1. TOP NAVIGATION BAR */}
      <LandingNav
        theme={theme}
        toggleTheme={toggleTheme}
        navigateToRoute={navigateToRoute}
      />

      {/* 2. HERO SECTION */}
      <header className="relative pt-10 pb-16 sm:pt-18 sm:pb-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <LandingHero
              downloadStarted={downloadStarted}
              onDownload={handleDownload}
              onOpenQrModal={() => setShowQrModal(true)}
              navigateToRoute={navigateToRoute}
              theme={theme}
            />
          </div>

          <div className="lg:col-span-5 relative">
            <LandingTelemetryDemo
              meterData={meterData}
              toggleMainSupply={toggleMainSupply}
              theme={theme}
            />
          </div>
        </div>
      </header>

      {/* 3. PRODUCT EXPERIENCE SHOWCASE (REAL APP SCREENSHOTS) */}
      <LandingAppShowcase theme={theme} />

      {/* 4. ANIMATED SYSTEM ARCHITECTURE PROCESS FLOW */}
      <LandingProcessFlow theme={theme} />

      {/* 5. ACADEMIC RESEARCH & SUPERVISORY ATTRIBUTION */}
      <LandingAcademicSection theme={theme} />

      {/* 6. SIX CORE PILLARS */}
      <LandingFeatures theme={theme} />

      {/* 7. DEDICATED MOBILE APP DOWNLOAD SHOWCASE */}
      <LandingMobileDownload
        downloadStarted={downloadStarted}
        onDownload={handleDownload}
        onOpenQrModal={() => setShowQrModal(true)}
        theme={theme}
      />

      {/* 8. TECHNICAL FAQ */}
      <LandingFaq theme={theme} />

      {/* 9. ACADEMIC FOOTER */}
      <footer className={`border-t py-14 px-4 sm:px-8 transition-colors ${
        isDark ? 'border-white/[0.08] bg-[#050609] text-slate-400' : 'border-slate-200 bg-white text-slate-600 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#ff5b26] flex items-center justify-center text-white shadow-md shadow-[#ff5b26]/30">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  VOLTRIX SMART ENERGY SUBMETER
                </span>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  IoT Edge Prototype & Real-Time Consumption Analytics
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
              <a
                href="/Voltrix-SmartMeter.apk"
                download="Voltrix-SmartMeter.apk"
                className="hover:text-[#ff5b26] transition-colors font-bold text-[#ff5b26]"
              >
                Download Android App
              </a>
              <button
                type="button"
                onClick={() => navigateToRoute('client')}
                className="hover:text-[#ff5b26] transition-colors cursor-pointer"
              >
                Web Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigateToRoute('admin')}
                className="hover:text-[#ff5b26] transition-colors cursor-pointer"
              >
                Admin Portal
              </button>
              <a href="#academic" className="hover:text-[#ff5b26] transition-colors text-amber-500 flex items-center gap-1 font-bold">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Thesis Abstract</span>
              </a>
            </div>
          </div>

          {/* Minimalist Academic Attribution */}
          <div className={`p-5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-slate-400'
              : 'bg-slate-50 border-slate-200/80 text-slate-600 shadow-xs'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  Undergraduate Engineering Capstone Thesis
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  &ldquo;Design and Implementation of an IoT-Enabled Smart Energy Meter with Consumption Analytics&rdquo;
                </div>
              </div>
            </div>

            <div className="sm:text-right shrink-0 pl-12 sm:pl-0">
              <span className="text-slate-400 text-[11px]">Academic Supervisor: </span>
              <strong className={`text-xs ${isDark ? 'text-amber-300' : 'text-slate-900'}`}>
                Prof. Mrs. Okezie
              </strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] pt-4 border-t border-inherit">
            <span>© 2026 Voltrix Energy Research. Undergraduate Engineering Capstone Prototype.</span>
            <span className="text-slate-500">Zero-Token Recharging • Autonomous Surge Defense • AI Analytics</span>
          </div>
        </div>
      </footer>

      {/* 10. QR CODE DOWNLOAD MODAL */}
      <LandingQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onDownload={handleDownload}
      />
    </div>
  );
};
