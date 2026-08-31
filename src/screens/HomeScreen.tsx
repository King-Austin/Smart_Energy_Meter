import React from 'react';
import { EnergyFlowDiagram } from '../components/home/EnergyFlowDiagram';
import { CurrentPowerCard } from '../components/home/CurrentPowerCard';
import { WalletCard } from '../components/wallet/WalletCard';
import { EnergyTodayCard } from '../components/home/EnergyTodayCard';
import { QuickShareCard } from '../components/home/QuickShareCard';
import { LiveElectricalCard } from '../components/home/LiveElectricalCard';
import { MiniEnergySnapshot } from '../components/home/MiniEnergySnapshot';

export const HomeScreen: React.FC = () => {
  return (
    <div className="space-y-3.5 pb-6 animate-fade-in">
      
      {/* 1. Live Power Distribution Topology (Tesla Energy / Enphase Style) */}
      <EnergyFlowDiagram />

      {/* 2. Primary Power Usage Gauge (Glanceable utility reading) */}
      <CurrentPowerCard />

      {/* 3. Apple Wallet Style Prepaid Electricity Balance Card */}
      <WalletCard />

      {/* 4. Energy Consumption Today & Cost */}
      <EnergyTodayCard />

      {/* 5. Peer-to-Peer Energy Cloud Sharing Quick Status */}
      <QuickShareCard />

      {/* 6. Real-Time Electrical Parameters (Clean Voltage, Current, Frequency) */}
      <LiveElectricalCard />

      {/* 7. Hourly Snapshot Timeline */}
      <MiniEnergySnapshot />
      
    </div>
  );
};
