import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Bell, Moon, Sun, Sliders, ZapOff, WifiOff, Building2, Globe } from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const {
    meterData,
    theme,
    toggleTheme,
    unreadNotificationCount,
    setIsSimPanelOpen,
    setActiveTab,
    navigateToRoute
  } = useMeter();

  const isMeterOffline = meterData.device_status === 'offline';
  const isGridOutage = meterData.grid_status === 'offline';

  return (
    <header className="sticky top-0 z-30 px-5 pt-3.5 pb-3 bg-white/90 dark:bg-[#0d1219]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-neutral-800/80">
      <div className="flex items-center justify-between">
        
        {/* Left: Voltrix Brand & Property */}
        <div
          onClick={() => setActiveTab('device')}
          className="cursor-pointer group flex items-center gap-3"
          title="Voltrix Smart Meter Hardware Status"
        >
          {/* Geometric Warm Burnt Orange Brand Logo Mark */}
          <div className="w-10 h-10 rounded-2xl bg-[#ff5b26]/12 border border-[#ff5b26]/25 flex items-center justify-center text-[#ff5b26] group-hover:scale-105 transition-transform shadow-xs">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#ff5b26]">
                Voltrix
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400 px-1.5 py-0.5 bg-slate-100 dark:bg-neutral-800 rounded-md">
                METER
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {meterData.meter_name}
              </span>
              
              {/* Online / Status Pill */}
              {isMeterOffline ? (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30">
                  <WifiOff className="w-2.5 h-2.5" /> Offline
                </span>
              ) : isGridOutage ? (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  <ZapOff className="w-2.5 h-2.5" /> Islanded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-live-dot"></span>
                  Online
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Utility & Theme Controls */}
        <div className="flex items-center gap-1">
          {/* Demo Simulation Controller Toggle */}
          <button
            onClick={() => setIsSimPanelOpen(true)}
            className="p-2.5 rounded-2xl text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors relative"
            title="Demo & Hardware Simulator"
            aria-label="Open Demo Simulator"
          >
            <Sliders className="w-4 h-4 text-[#ff5b26]" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#ff5b26]"></span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Landing Page & Download Switcher */}
          <button
            onClick={() => navigateToRoute('landing')}
            className="p-2.5 rounded-2xl text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-[#ff5b26] transition-colors"
            title="Voltrix Landing Page & APK Download"
            aria-label="Landing Page"
          >
            <Globe className="w-4 h-4" />
          </button>

          {/* Super Admin Portal Switcher */}
          <button
            onClick={() => navigateToRoute('admin')}
            className="p-2.5 rounded-2xl text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-[#ff5b26] transition-colors"
            title="Super Admin Portal (View All Submeters)"
            aria-label="Super Admin Portal"
          >
            <Building2 className="w-4 h-4" />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="p-2.5 rounded-2xl text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors relative"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-700 dark:text-neutral-300" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#ff5b26] text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-xs">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
