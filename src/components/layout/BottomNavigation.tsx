import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { ActiveTab } from '../../types/meter';
import { Zap, BarChart3, Wallet, Settings, Sparkles } from 'lucide-react';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  isHero?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Zap },
  { id: 'energy', label: 'Energy', icon: BarChart3 },
  { id: 'ai', label: 'AI Advisor', icon: Sparkles, isHero: true },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useMeter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[440px] mx-auto bg-white/95 dark:bg-[#0d1219]/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-neutral-800/80 px-2 py-2 shadow-sm">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isHero = item.isHero;
          const isActive = activeTab === item.id;

          if (isHero) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 group transition-all duration-200 cursor-pointer"
                title="Open Voltrix AI Energy Advisor"
                aria-label="AI Advisor"
              >
                {/* Elevated Center Hero Action Pod */}
                <div className={`w-11 h-11 -mt-4 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105 active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-tr from-[#ff5b26] via-[#ff703d] to-amber-500 text-white ring-3 ring-[#ff5b26]/30 shadow-[#ff5b26]/40'
                    : 'bg-gradient-to-tr from-[#ff5b26] to-[#e04512] text-white shadow-[#ff5b26]/25 opacity-90 group-hover:opacity-100'
                }`}>
                  <Sparkles className={`w-5 h-5 ${isActive ? 'animate-bounce' : 'animate-pulse'}`} />
                </div>
                <span className={`text-[10px] mt-1 font-bold tracking-tight ${
                  isActive ? 'text-[#ff5b26]' : 'text-slate-500 dark:text-neutral-400'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#ff5b26] font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {/* Active Highlight Background */}
              {isActive && (
                <span className="absolute inset-0 bg-[#ff5b26]/12 dark:bg-[#ff5b26]/20 rounded-xl -z-10 animate-fade-in"></span>
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
              </div>

              <span className="text-[11px] mt-1 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
