import React, { useEffect } from 'react';
import { MeterProvider, useMeter } from './context/MeterContext';
import { AppShell } from './components/layout/AppShell';
import { HomeScreen } from './screens/HomeScreen';
import { EnergyScreen } from './screens/EnergyScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ShareScreen } from './screens/ShareScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DeviceDetailsScreen } from './screens/DeviceDetailsScreen';
import { AuthScreen } from './screens/AuthScreen';
import { TamperHistoryModal } from './components/notifications/TamperHistoryModal';
import { AIAssistantDrawer } from './components/ai/AIAssistantDrawer';
import { SuperAdminDashboard } from './screens/SuperAdminDashboard';
import { LandingScreen } from './screens/LandingScreen';
import { initNativeMobileApp } from './services/nativeService';

const MainNavigator: React.FC = () => {
  const { currentRoute, activeTab, isAuthenticated, isTamperModalOpen, setIsTamperModalOpen } = useMeter();

  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.classList.remove('admin-layout', 'landing-layout', 'client-layout');
      if (currentRoute === 'admin') {
        rootEl.classList.add('admin-layout');
      } else if (currentRoute === 'landing') {
        rootEl.classList.add('landing-layout');
      } else {
        rootEl.classList.add('client-layout');
      }
    }
  }, [currentRoute]);

  if (!isAuthenticated || activeTab === 'auth') {
    return <AuthScreen />;
  }

  // 1. Separate Super Admin Dashboard Route (Enterprise Wide View, All Submeters)
  if (currentRoute === 'admin') {
    return (
      <>
        <SuperAdminDashboard />
        <AIAssistantDrawer />
      </>
    );
  }

  // 2. Landing Page Route (Showcase, Specifications, & Direct APK Download)
  if (currentRoute === 'landing') {
    return <LandingScreen />;
  }

  // 3. Client Dashboard Route (Zero Admin Interference, Clean & Dedicated)
  return (
    <>
      <AppShell>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'energy' && <EnergyScreen />}
        {activeTab === 'wallet' && <WalletScreen />}
        {activeTab === 'share' && <ShareScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
        {activeTab === 'device' && <DeviceDetailsScreen />}
      </AppShell>

      {/* Global Modals & Drawers */}
      <TamperHistoryModal
        isOpen={isTamperModalOpen}
        onClose={() => setIsTamperModalOpen(false)}
      />
      <AIAssistantDrawer />
    </>
  );
};

export function App() {
  useEffect(() => {
    initNativeMobileApp();
  }, []);

  return (
    <MeterProvider>
      <MainNavigator />
    </MeterProvider>
  );
}

export default App;
