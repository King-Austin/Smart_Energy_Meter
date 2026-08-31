import React, { useState } from 'react';
import { useMeter } from '../../context/MeterContext';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { SimulationDrawer } from './SimulationDrawer';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { WifiOff, ZapOff, ArrowLeft } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { meterData, activeTab, setActiveTab, isAuthenticated } = useMeter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const isMeterOffline = meterData.device_status === 'offline';
  const isGridOutage = meterData.grid_status === 'offline';

  // If in device details screen or auth, navigation might adjust
  const showBottomNav = isAuthenticated && activeTab !== 'auth';

  return (
    <div className="flex flex-col min-h-screen pb-20 relative select-none">
      {/* Header */}
      {isAuthenticated && activeTab !== 'auth' && (
        <Header onOpenNotifications={() => setIsNotificationsOpen(true)} />
      )}

      {/* Persistent System Banners if critical state occurs */}
      {isAuthenticated && isMeterOffline && (
        <div className="bg-red-500/15 border-b border-red-500/30 px-4 py-2.5 flex items-center gap-2.5 text-xs text-red-300 animate-slide-up">
          <WifiOff className="w-4 h-4 flex-shrink-0 text-red-400" />
          <div className="flex-1 leading-snug">
            <span className="font-semibold">Meter Offline:</span> Live readings paused. Energy sharing is disabled until reconnected.
          </div>
        </div>
      )}

      {isAuthenticated && !isMeterOffline && isGridOutage && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-2.5 text-xs text-amber-300 animate-slide-up">
          <ZapOff className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <div className="flex-1 leading-snug">
            <span className="font-semibold">Grid Power Outage:</span> Meter is operating on internal backup battery ({meterData.battery_percentage}%).
          </div>
        </div>
      )}

      {/* Sub-view header back bar for Device Details */}
      {activeTab === 'device' && (
        <div className="px-5 py-3 flex items-center gap-3 border-b border-neutral-200/40 dark:border-neutral-800/60 bg-neutral-900/40">
          <button
            onClick={() => setActiveTab('home')}
            className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-neutral-100">Meter Device Details</h2>
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNavigation />}

      {/* Drawers */}
      <SimulationDrawer />
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};
