import React from 'react';
import { MeterProvider, useMeter } from './context/MeterContext';
import { AppShell } from './components/layout/AppShell';
import { HomeScreen } from './screens/HomeScreen';
import { EnergyScreen } from './screens/EnergyScreen';
import { AdminFleetScreen } from './screens/AdminFleetScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ShareScreen } from './screens/ShareScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DeviceDetailsScreen } from './screens/DeviceDetailsScreen';
import { AuthScreen } from './screens/AuthScreen';
import { TamperHistoryModal } from './components/notifications/TamperHistoryModal';
import { AIAssistantDrawer } from './components/ai/AIAssistantDrawer';

const MainNavigator: React.FC = () => {
  const { activeTab, isAuthenticated, isTamperModalOpen, setIsTamperModalOpen } = useMeter();

  if (!isAuthenticated || activeTab === 'auth') {
    return <AuthScreen />;
  }

  return (
    <>
      <AppShell>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'energy' && <EnergyScreen />}
        {activeTab === 'admin' && <AdminFleetScreen />}
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
  return (
    <MeterProvider>
      <MainNavigator />
    </MeterProvider>
  );
}

export default App;
