import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { Bell, Moon, Sun, Sliders, ZapOff, WifiOff } from 'lucide-react';

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
    setActiveTab
  } = useMeter();

  const isMeterOffline = meterData.device_status === 'offline';
  const isGridOutage = meterData.grid_status === 'offline';

  return (
    <header className="sticky top-0 z-30 px-5 pt-3.5 pb-3 bg-white/80 dark:bg-[#0b0f17]/90 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80">
      <div className="flex items-center justify-between">
        
        {/* Left: Voltrix Brand & Property */}
        <div
          onClick={() => setActiveTab('device')}
          className="cursor-pointer group flex items-center gap-3"
          title="Voltrix Smart Meter Hardware Status"
        >
          {/* Geometric Brand Logo Mark */}
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-display">
                Voltrix
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 px-1 py-0.2 bg-neutral-100 dark:bg-neutral-800 rounded">
                METER
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                {meterData.meter_name}
              </span>
              
              {/* Online / Status Pill */}
              {isMeterOffline ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30">
                  <WifiOff className="w-2.5 h-2.5" /> Offline
                </span>
              ) : isGridOutage ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  <ZapOff className="w-2.5 h-2.5" /> Islanded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Utility & Simulation Controls */}
        <div className="flex items-center gap-1">
          {/* Demo Simulation Controller Toggle */}
          <button
            onClick={() => setIsSimPanelOpen(true)}
            className="p-2 rounded-2xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors relative"
            title="Demo & Hardware Simulator"
            aria-label="Open Demo Simulator"
          >
            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-2xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-600" />
            )}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-2xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors relative"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#0b0f17]">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
