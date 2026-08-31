import React from 'react';
import { MeterProvider, useMeter } from './context/MeterContext';
import { AppShell } from './components/layout/AppShell';
import { HomeScreen } from './screens/HomeScreen';
import { EnergyScreen } from './screens/EnergyScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ShareScreen } from './screens/ShareScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DeviceDetailsScreen } from './screens/DeviceDetailsScreen';
import { AuthScreen } from './screens/AuthScreen';

const MainNavigator: React.FC = () => {
  const { activeTab, isAuthenticated } = useMeter();

  if (!isAuthenticated || activeTab === 'auth') {
    return <AuthScreen />;
  }

  return (
    <AppShell>
      {activeTab === 'home' && <HomeScreen />}
      {activeTab === 'energy' && <EnergyScreen />}
      {activeTab === 'wallet' && <WalletScreen />}
      {activeTab === 'share' && <ShareScreen />}
      {activeTab === 'settings' && <SettingsScreen />}
      {activeTab === 'device' && <DeviceDetailsScreen />}
    </AppShell>
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
