import React from 'react';
import { useMeter } from '../../context/MeterContext';
import { ActiveTab } from '../../types/meter';
import { Zap, BarChart3, Wallet, Share2, Settings } from 'lucide-react';

interface TabItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { id: 'home', label: 'Home', icon: Zap },
  { id: 'energy', label: 'Energy', icon: BarChart3 },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'share', label: 'Share', icon: Share2 },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, activeSession, receivingSession } = useMeter();

  const isSharingActive = !!activeSession || !!receivingSession;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[440px] mx-auto bg-white/90 dark:bg-[#0b0f17]/95 backdrop-blur-2xl border-t border-neutral-200/80 dark:border-neutral-800/80 px-2 py-2">
      <div className="flex items-center justify-around">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasShareBadge = tab.id === 'share' && isSharingActive;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {/* Active Highlight Background */}
              {isActive && (
                <span className="absolute inset-0 bg-emerald-500/10 rounded-xl -z-10 animate-fade-in"></span>
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                
                {/* Pulse badge if sharing is active */}
                {hasShareBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                )}
                {hasShareBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                )}
              </div>

              <span className="text-[10px] mt-1 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
