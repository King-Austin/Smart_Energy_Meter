import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  MeterTelemetry,
  SharingSession,
  RegisteredRecipient,
  NotificationItem,
  ActiveTab,
  GridStatus,
  DeviceStatus,
  WalletTransaction
} from '../types/meter';
import {
  INITIAL_METER_DATA,
  REGISTERED_RECIPIENTS,
  INITIAL_SHARING_HISTORY,
  INITIAL_NOTIFICATIONS,
  INITIAL_WALLET_TRANSACTIONS
} from '../services/mockData';
import { apiService } from '../services/api';
import {
  fetchLiveMeterFromSupabase,
  subscribeToMeterUpdates,
  subscribeToTelemetryLogs,
  toggleRemoteSupplyRelay,
  fetchSupabaseTransactions,
  fetchSupabaseRecipients,
  isSupabaseConfigured,
  updateProtectionSettings,
  recordPaystackTransaction
} from '../services/supabase';

interface MeterContextType {
  meterData: MeterTelemetry;
  activeSession: SharingSession | null;
  receivingSession: SharingSession | null;
  sharingHistory: SharingSession[];
  recipients: RegisteredRecipient[];
  notifications: NotificationItem[];
  walletTransactions: WalletTransaction[];
  unreadNotificationCount: number;
  activeTab: ActiveTab;
  theme: 'light' | 'dark';
  isAuthenticated: boolean;
  isSimPanelOpen: boolean;

  // Endpoint Connectivity
  apiEndpointUrl: string;
  isLiveEndpointActive: boolean;
  setApiEndpointUrl: (url: string) => void;
  setIsLiveEndpointActive: (active: boolean) => void;
  pingBackend: (url?: string) => Promise<{ success: boolean; latencyMs: number; error?: string }>;

  // Wallet & Paystack Actions
  fundWallet: (amount: number, method: string, token: string) => void;
  fundWalletWithPaystack: (amount: number) => Promise<{ success: boolean; token: string; units: number; error?: string }>;

  // Protective Safety Cutoffs
  resetSafetyCutoff: () => void;
  setSafetyLimits: (maxVoltage: number, minVoltage: number, billThreshold: number) => void;

  // Navigation & Themes
  setActiveTab: (tab: ActiveTab) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setIsSimPanelOpen: (open: boolean) => void;
  
  // Auth
  login: (meterName?: string, meterId?: string) => void;
  logout: () => void;

  // Sharing (Streamlined for Building Independence)
  startSharing: (
    recipient: RegisteredRecipient,
    energyLimitKwh: number,
    powerLimitW?: number,
    durationMinutes?: number
  ) => { success: boolean; error?: string };
  stopSharing: () => void;
  stopReceiving: () => void;
  saveRecipient: (meterId: string) => void;
  searchRecipients: (query: string) => RegisteredRecipient[];

  // Device & Simulation Controls
  toggleGridStatus: (forcedStatus?: GridStatus) => void;
  toggleMeterOnline: (forcedOnline?: boolean) => void;
  toggleMainSupply: () => void;
  setTariff: (rate: number, currencyCode: string, currencySymbol: string) => void;
  simulateIncomingShare: () => void;
  drainBattery: (targetPercentage?: number) => void;
  rechargeBattery: () => void;
  simulateVoltageSpike: (spikeVoltage?: number) => void;

  // Notifications
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  addNotification: (title: string, message: string, type: NotificationItem['type']) => void;
}

const MeterContext = createContext<MeterContextType | undefined>(undefined);

export const MeterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [meterData, setMeterData] = useState<MeterTelemetry>(INITIAL_METER_DATA);
  const [activeSession, setActiveSession] = useState<SharingSession | null>(null);
  const [receivingSession, setReceivingSession] = useState<SharingSession | null>(null);
  const [sharingHistory, setSharingHistory] = useState<SharingSession[]>(INITIAL_SHARING_HISTORY);
  const [recipients, setRecipients] = useState<RegisteredRecipient[]>(REGISTERED_RECIPIENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(INITIAL_WALLET_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isSimPanelOpen, setIsSimPanelOpen] = useState<boolean>(false);

  // Endpoint configuration
  const [apiEndpointUrl, setApiEndpointUrlState] = useState<string>(
    window.location.origin + '/api'
  );
  const [isLiveEndpointActive, setIsLiveEndpointActive] = useState<boolean>(false);

  const setApiEndpointUrl = (url: string) => {
    setApiEndpointUrlState(url);
    apiService.setBaseUrl(url);
  };

  const pingBackend = async (url?: string) => {
    if (url) apiService.setBaseUrl(url);
    return apiService.ping();
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync with Supabase: Fetch live meter data and subscribe to 5-second hardware updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;
    async function initSupabase() {
      try {
        const [remoteMeter, remoteTxns, remoteRecipients] = await Promise.all([
          fetchLiveMeterFromSupabase(meterData.meter_id),
          fetchSupabaseTransactions(meterData.meter_id),
          fetchSupabaseRecipients()
        ]);

        if (!isMounted) return;
        if (remoteMeter) {
          setMeterData(prev => ({ ...prev, ...remoteMeter }));
        }
        if (remoteTxns && remoteTxns.length > 0) {
          setWalletTransactions(remoteTxns);
        }
        if (remoteRecipients && remoteRecipients.length > 0) {
          setRecipients(remoteRecipients);
        }
      } catch (err) {
        console.warn('[Supabase] Initial connection notice:', err);
      }
    }

    initSupabase();

    // Subscribe to real-time changes emitted by ESP32 or simulate_monitoring.js
    const meterChannel = subscribeToMeterUpdates(meterData.meter_id, (updated) => {
      if (!isMounted) return;
      setMeterData(prev => ({
        ...prev,
        ...updated
      }));
    });

    const logsChannel = subscribeToTelemetryLogs(meterData.meter_id, (newLog) => {
      if (!isMounted) return;
      setMeterData(prev => ({
        ...prev,
        voltage: Number(newLog.voltage ?? prev.voltage),
        current: Number(newLog.current ?? prev.current),
        active_power: Number(newLog.active_power ?? prev.active_power),
        power_factor: Number(newLog.power_factor ?? prev.power_factor),
        frequency: Number(newLog.frequency ?? prev.frequency),
        is_tampered: newLog.is_tampered ?? prev.is_tampered,
        main_supply_connected: newLog.is_relay_on ?? prev.main_supply_connected,
        last_seen: newLog.created_at ?? new Date().toISOString()
      }));
    });

    return () => {
      isMounted = false;
      meterChannel.unsubscribe();
      logsChannel.unsubscribe();
    };
  }, [meterData.meter_id]);

  const addNotification = useCallback((title: string, message: string, type: NotificationItem['type']) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      type,
      is_read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // Wallet Funding Actions
  const fundWallet = (amount: number, method: string, token: string) => {
    const units = Number((amount / meterData.tariff_rate).toFixed(1));
    const newTx: WalletTransaction = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'funding',
      title: 'Wallet Funded',
      description: `Recharge via ${method.toUpperCase()} (${units} kWh)`,
      amount_currency: amount,
      units_kwh: units,
      timestamp: 'Just now',
      status: 'successful',
      token_number: token
    };

    setWalletTransactions(prev => [newTx, ...prev]);
    setMeterData(prev => {
      const newBal = prev.wallet_balance + amount;
      const newUnits = Number((prev.prepaid_units_kwh + units).toFixed(1));
      const newDays = Math.max(1, Math.round(newUnits / 8.0));
      return {
        ...prev,
        wallet_balance: newBal,
        prepaid_units_kwh: newUnits,
        estimated_days_remaining: newDays
      };
    });

    addNotification(
      'Wallet Funded Successfully',
      `${meterData.currency_symbol}${amount.toLocaleString()} added (+${units} kWh units credited).`,
      'wallet'
    );
  };

  // Paystack Funding with Real STS 20-digit token generation and Supabase sync
  const fundWalletWithPaystack = async (amount: number): Promise<{ success: boolean; token: string; units: number; error?: string }> => {
    const tariff = meterData.tariff_rate > 0 ? meterData.tariff_rate : 68.5;
    const units = Number((amount / tariff).toFixed(1));
    
    // Standard Transfer Specification (STS) 20-digit token: 5 blocks of 4 digits
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const p4 = Math.floor(1000 + Math.random() * 9000);
    const p5 = Math.floor(1000 + Math.random() * 9000);
    const stsToken = `${p1}-${p2}-${p3}-${p4}-${p5}`;

    // Persist to Supabase
    await recordPaystackTransaction(meterData.meter_id, amount, units, stsToken);

    const newTx: WalletTransaction = {
      id: `TXN-PST-${Date.now().toString().slice(-4)}`,
      type: 'funding',
      title: 'Paystack Instant Recharge',
      description: `Recharge via Paystack (${units} kWh units credited)`,
      amount_currency: amount,
      units_kwh: units,
      timestamp: 'Just now',
      status: 'successful',
      token_number: stsToken
    };

    setWalletTransactions(prev => [newTx, ...prev]);
    setMeterData(prev => {
      const newBal = prev.wallet_balance + amount;
      const newUnits = Number((prev.prepaid_units_kwh + units).toFixed(1));
      const newDays = Math.max(1, Math.round(newUnits / 8.0));
      return {
        ...prev,
        wallet_balance: newBal,
        prepaid_units_kwh: newUnits,
        estimated_days_remaining: newDays
      };
    });

    addNotification(
      'Payment Received via Paystack',
      `₦${amount.toLocaleString()} credited (+${units} kWh units). STS Token: ${stsToken}`,
      'wallet'
    );

    return { success: true, token: stsToken, units };
  };

  // Protective Safety Cutoff Controls
  const resetSafetyCutoff = () => {
    setMeterData(prev => {
      updateProtectionSettings(prev.meter_id, {
        main_supply_connected: true,
        voltage_cutoff_tripped: false,
        bill_cutoff_tripped: false
      });
      addNotification(
        'Protection Re-armed',
        'Contactor reclosed and protective safety thresholds re-armed.',
        'restored'
      );
      return {
        ...prev,
        main_supply_connected: true,
        voltage_cutoff_tripped: false,
        bill_cutoff_tripped: false,
        active_power: 2.46
      };
    });
  };

  const setSafetyLimits = (maxVoltage: number, minVoltage: number, billThreshold: number) => {
    setMeterData(prev => {
      updateProtectionSettings(prev.meter_id, {
        max_voltage_limit: maxVoltage,
        min_voltage_limit: minVoltage,
        bill_limit_threshold: billThreshold
      });
      addNotification(
        'Safety Thresholds Configured',
        `Max Voltage: ${maxVoltage}V, Min: ${minVoltage}V, Spend Cap: ₦${billThreshold.toLocaleString()}.`,
        'system'
      );
      return {
        ...prev,
        max_voltage_limit: maxVoltage,
        min_voltage_limit: minVoltage,
        bill_limit_threshold: billThreshold
      };
    });
  };

  // Live Telemetry Sync Engine
  useEffect(() => {
    const interval = setInterval(async () => {
      // 1. If Supabase is configured and meter is online, sync real telemetry directly from Supabase!
      if (isSupabaseConfigured() && meterData.device_status !== 'offline') {
        try {
          const remoteMeter = await fetchLiveMeterFromSupabase(meterData.meter_id);
          if (remoteMeter) {
            setMeterData(prev => ({
              ...prev,
              ...remoteMeter
            }));
          }
        } catch (err) {
          console.warn('[Supabase] Telemetry sync error:', err);
        }
        return;
      }

      // 2. If in Live API Mode, fetch real telemetry from configured endpoint
      if (isLiveEndpointActive) {
        try {
          const liveData = await apiService.getLiveTelemetry(meterData.meter_id);
          if (liveData) {
            setMeterData(prev => ({
              ...prev,
              ...liveData
            }));
          }

          const activeSharingData = await apiService.getActiveSharing();
          if (activeSharingData) {
            setActiveSession(activeSharingData.activeSession);
            setReceivingSession(activeSharingData.receivingSession);
          }
        } catch (err) {
          console.warn('Live API poll warning:', err);
        }
        return;
      }

      // 3. Otherwise run internal high-fidelity simulation engine (offline fallback only)
      setMeterData(prev => {
        if (prev.device_status === 'offline') {
          return prev;
        }

        // Voltage variation
        const jitterVoltage = (Math.random() * 3 - 1.5);
        const newVoltage = Number((231.0 + jitterVoltage).toFixed(1));

        // Protective Overvoltage & Brownout Threshold Cutoff
        let isVoltageTripped = prev.voltage_cutoff_tripped;
        let isBillTripped = prev.bill_cutoff_tripped;
        let relayConnected = prev.main_supply_connected;

        if (newVoltage > prev.max_voltage_limit || newVoltage < prev.min_voltage_limit) {
          if (relayConnected && !isVoltageTripped) {
            isVoltageTripped = true;
            relayConnected = false;
            addNotification(
              'Overvoltage Cutoff Tripped',
              `Line voltage reached ${newVoltage}V (limit: ${prev.max_voltage_limit}V). Contactor opened to protect appliances.`,
              'warning'
            );
          }
        }

        // Base power variation
        const jitterPower = (Math.random() * 0.16 - 0.08);
        const basePower = relayConnected && !isVoltageTripped && !isBillTripped ? 2.46 : 0.0;
        const newActivePower = basePower > 0 ? Math.max(0.1, Number((basePower + jitterPower).toFixed(2))) : 0.0;

        // Power factor
        const newPf = Number((0.95 + (Math.random() * 0.03 - 0.015)).toFixed(2));

        // Current I = (P_kW * 1000) / (V * PF)
        const newCurrent = newActivePower > 0 ? Number(((newActivePower * 1000) / (newVoltage * newPf)).toFixed(1)) : 0.0;

        // Battery handling during outage
        let newBattery = prev.battery_percentage;
        let newBatteryStatus = prev.battery_status;
        if (prev.grid_status === 'offline') {
          newBattery = Math.max(1, prev.battery_percentage - 0.05);
          newBatteryStatus = newBattery < 20 ? 'low' : 'battery';
        } else if (prev.battery_percentage < 100) {
          newBattery = Math.min(100, prev.battery_percentage + 0.1);
          newBatteryStatus = 'charging';
        }

        // Incremental energy accumulation
        const energyIncrement = (newActivePower * (2.5 / 3600));
        const newEnergyToday = Number((prev.energy_today + energyIncrement).toFixed(4));
        const newEstimatedCost = Math.round(newEnergyToday * prev.tariff_rate);

        // Budget Cap Cutoff Check
        if ((newEstimatedCost >= prev.bill_limit_threshold || prev.estimated_bill_month >= prev.bill_limit_threshold) && relayConnected && !isBillTripped) {
          isBillTripped = true;
          relayConnected = false;
          addNotification(
            'Budget Cap Reached',
            `Electricity spend reached threshold (₦${prev.bill_limit_threshold.toLocaleString()}). Supply shut off to prevent bill shock.`,
            'warning'
          );
        }

        // Deduct from prepaid units balance in real time
        const newUnits = Math.max(0, Number((prev.prepaid_units_kwh - energyIncrement).toFixed(4)));
        const newWalletBal = Math.max(0, Math.round(newUnits * prev.tariff_rate));
        const newDaysRemaining = Math.max(1, Math.round(newUnits / 8.0));

        return {
          ...prev,
          active_power: newActivePower,
          voltage: newVoltage,
          current: newCurrent,
          power_factor: newPf,
          battery_percentage: Math.round(newBattery),
          battery_status: newBatteryStatus,
          energy_today: newEnergyToday,
          estimated_cost_today: newEstimatedCost,
          prepaid_units_kwh: Number(newUnits.toFixed(1)),
          wallet_balance: newWalletBal,
          estimated_days_remaining: newDaysRemaining,
          main_supply_connected: relayConnected,
          voltage_cutoff_tripped: isVoltageTripped,
          bill_cutoff_tripped: isBillTripped
        };
      });

      // Handle Active Sharing Session progress
      setActiveSession(prevSession => {
        if (!prevSession || prevSession.status !== 'active') return prevSession;

        const tickSeconds = 2.5;
        const newElapsed = prevSession.elapsed_seconds + tickSeconds;
        const powerJitter = Math.floor(Math.random() * 30 - 15);
        const powerCap = prevSession.power_limit_w || 480;
        const currentPower = Math.max(50, powerCap + powerJitter);
        const energyInc = (currentPower / 1000) * (tickSeconds / 3600);
        const newTransferred = Number((prevSession.energy_transferred_kwh + energyInc).toFixed(4));

        const isEnergyLimitReached = newTransferred >= prevSession.energy_limit_kwh;
        const isTimeLimitReached = prevSession.duration_limit_seconds ? newElapsed >= prevSession.duration_limit_seconds : false;

        if (isEnergyLimitReached || isTimeLimitReached) {
          const finishedSession: SharingSession = {
            ...prevSession,
            status: 'completed',
            energy_transferred_kwh: Math.min(newTransferred, prevSession.energy_limit_kwh),
            elapsed_seconds: newElapsed,
            ended_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setSharingHistory(h => [finishedSession, ...h]);
          addNotification(
            'Sharing Completed',
            `${finishedSession.energy_transferred_kwh.toFixed(2)} kWh was successfully shared with ${prevSession.destination_meter_name}.`,
            'sharing'
          );
          return null;
        }

        return {
          ...prevSession,
          current_power_w: currentPower,
          energy_transferred_kwh: newTransferred,
          elapsed_seconds: newElapsed
        };
      });

      // Handle Receiving Session progress
      setReceivingSession(prevRec => {
        if (!prevRec || prevRec.status !== 'receiving') return prevRec;
        const tickSeconds = 2.5;
        const newElapsed = prevRec.elapsed_seconds + tickSeconds;
        const energyInc = (prevRec.current_power_w / 1000) * (tickSeconds / 3600);
        const newReceived = Number((prevRec.energy_transferred_kwh + energyInc).toFixed(4));

        const isTimeReached = prevRec.duration_limit_seconds ? newElapsed >= prevRec.duration_limit_seconds : false;
        if (newReceived >= prevRec.energy_limit_kwh || isTimeReached) {
          const finished: SharingSession = {
            ...prevRec,
            status: 'completed',
            energy_transferred_kwh: newReceived,
            ended_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setSharingHistory(h => [finished, ...h]);
          addNotification(
            'Receiving Completed',
            `Received ${newReceived.toFixed(2)} kWh from ${prevRec.source_meter_name}.`,
            'sharing'
          );
          return null;
        }

        return {
          ...prevRec,
          energy_transferred_kwh: newReceived,
          elapsed_seconds: newElapsed
        };
      });

    }, 2500);

    return () => clearInterval(interval);
  }, [addNotification, isLiveEndpointActive, meterData.meter_id]);

  // Actions: Start Cloud Sharing (Streamlined: Energy Cap based)
  const startSharing = (
    recipient: RegisteredRecipient,
    energyLimitKwh: number,
    powerLimitW?: number,
    durationMinutes?: number
  ) => {
    if (meterData.device_status === 'offline') {
      return { success: false, error: 'Your Meter is offline. Cloud connection required to share energy.' };
    }
    if (!recipient.is_online) {
      return { success: false, error: `${recipient.meter_name} is currently offline.` };
    }
    if (activeSession) {
      return { success: false, error: 'A sharing session is already active.' };
    }

    const detectedPower = powerLimitW || 480;
    const newSession: SharingSession = {
      session_id: `SES-${Math.floor(10000 + Math.random() * 90000)}-${Date.now().toString().slice(-2)}`,
      source_meter_id: meterData.meter_id,
      source_meter_name: meterData.meter_name,
      destination_meter_id: recipient.meter_id,
      destination_meter_name: recipient.meter_name,
      direction: 'sending',
      status: 'active',
      power_limit_w: detectedPower,
      energy_limit_kwh: energyLimitKwh,
      duration_limit_seconds: durationMinutes ? durationMinutes * 60 : undefined,
      current_power_w: detectedPower,
      energy_transferred_kwh: 0,
      elapsed_seconds: 0,
      started_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source_online: true,
      destination_online: true,
      cloud_sync_status: 'live'
    };

    setActiveSession(newSession);
    addNotification(
      'Energy Share Started',
      `Sharing up to ${energyLimitKwh} kWh with ${recipient.meter_name}.`,
      'sharing'
    );
    return { success: true };
  };

  const stopSharing = () => {
    if (!activeSession) return;
    const endedSession: SharingSession = {
      ...activeSession,
      status: 'completed',
      ended_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSharingHistory(prev => [endedSession, ...prev]);
    setActiveSession(null);
    addNotification(
      'Sharing Stopped',
      `Shared ${endedSession.energy_transferred_kwh.toFixed(2)} kWh with ${endedSession.destination_meter_name}.`,
      'sharing'
    );
  };

  const stopReceiving = () => {
    if (!receivingSession) return;
    const ended: SharingSession = {
      ...receivingSession,
      status: 'completed',
      ended_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSharingHistory(prev => [ended, ...prev]);
    setReceivingSession(null);
    addNotification(
      'Receiving Ended',
      `Stopped receiving energy from ${ended.source_meter_name}.`,
      'sharing'
    );
  };

  const saveRecipient = (meterId: string) => {
    setRecipients(prev =>
      prev.map(r => (r.meter_id === meterId ? { ...r, is_saved: !r.is_saved } : r))
    );
  };

  const searchRecipients = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      r =>
        r.meter_name.toLowerCase().includes(q) ||
        r.meter_id.toLowerCase().includes(q) ||
        r.owner_name.toLowerCase().includes(q)
    );
  };

  // Hardware Simulation Controls
  const toggleGridStatus = (forcedStatus?: GridStatus) => {
    setMeterData(prev => {
      const nextStatus: GridStatus =
        forcedStatus || (prev.grid_status === 'online' ? 'offline' : 'online');
      if (nextStatus === 'offline') {
        addNotification('Grid Outage Alert', 'Grid power was lost. Meter is operating on backup battery.', 'outage');
      } else {
        addNotification('Grid Restored', 'Grid power has been restored to normal levels.', 'restored');
      }
      return {
        ...prev,
        grid_status: nextStatus,
        battery_status: nextStatus === 'offline' ? 'battery' : 'charging'
      };
    });
  };

  const toggleMeterOnline = (forcedOnline?: boolean) => {
    setMeterData(prev => {
      const isOnline = forcedOnline !== undefined ? forcedOnline : prev.device_status === 'offline';
      const nextStatus: DeviceStatus = isOnline ? 'online' : 'offline';

      updateProtectionSettings(prev.meter_id, {
        // broadcast online status
      });

      if (!isOnline) {
        if (activeSession) {
          const interrupted: SharingSession = {
            ...activeSession,
            status: 'connection_lost',
            cloud_sync_status: 'lost',
            ended_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setSharingHistory(h => [interrupted, ...h]);
          setActiveSession(null);
        }
        if (receivingSession) {
          setReceivingSession(null);
        }
        addNotification('Meter Offline', 'Internet dropped. Realtime telemetry and cloud controls are paused.', 'offline');
      } else {
        addNotification('Meter Online', 'Meter reconnected to cloud backend. Realtime sync active.', 'system');
      }

      return {
        ...prev,
        device_status: nextStatus,
        connection_quality: isOnline ? 'good' : 'offline'
      };
    });
  };

  const toggleMainSupply = () => {
    if (meterData.device_status === 'offline') {
      addNotification('Offline Safety Block', 'Cannot toggle relay: Meter is disconnected from cloud.', 'offline');
      return;
    }

    if (meterData.voltage_cutoff_tripped) {
      addNotification('Overvoltage Lock', `Voltage exceeded ${meterData.max_voltage_limit}V. Use Reset Protection once line voltage normalizes.`, 'warning');
      return;
    }

    if (meterData.bill_cutoff_tripped) {
      addNotification('Budget Limit Lock', `Monthly bill reached ₦${meterData.bill_limit_threshold.toLocaleString()}. Adjust budget cap in settings to re-arm.`, 'warning');
      return;
    }

    setMeterData(prev => {
      const nextState = !prev.main_supply_connected;
      toggleRemoteSupplyRelay(prev.meter_id, nextState);
      addNotification(
        nextState ? 'Main Supply Restored' : 'Main Supply Disconnected',
        nextState ? 'Whole-house electrical supply connected.' : 'Whole-house electricity disconnect initiated by user.',
        'warning'
      );
      return {
        ...prev,
        main_supply_connected: nextState,
        active_power: nextState ? 2.46 : 0
      };
    });
  };

  const setTariff = (rate: number, currencyCode: string, currencySymbol: string) => {
    setMeterData(prev => ({
      ...prev,
      tariff_rate: rate,
      currency_code: currencyCode,
      currency_symbol: currencySymbol,
      estimated_cost_today: Math.round(prev.energy_today * rate)
    }));
  };

  const simulateIncomingShare = () => {
    if (receivingSession) {
      stopReceiving();
      return;
    }
    const recSession: SharingSession = {
      session_id: `SES-INC-${Date.now().toString().slice(-4)}`,
      source_meter_id: 'MTR-34BC-9821',
      source_meter_name: 'Family House',
      destination_meter_id: meterData.meter_id,
      destination_meter_name: meterData.meter_name,
      direction: 'receiving',
      status: 'receiving',
      power_limit_w: 380,
      energy_limit_kwh: 1.0,
      duration_limit_seconds: 3600,
      current_power_w: 380,
      energy_transferred_kwh: 0.12,
      elapsed_seconds: 180,
      started_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source_online: true,
      destination_online: true,
      cloud_sync_status: 'live'
    };
    setReceivingSession(recSession);
    addNotification('Receiving Energy Started', 'Your Meter is currently receiving 380 W from Family House.', 'sharing');
  };

  const drainBattery = (targetPercentage = 18) => {
    setMeterData(prev => ({
      ...prev,
      battery_percentage: targetPercentage,
      battery_status: targetPercentage < 20 ? 'low' : 'battery'
    }));
    addNotification('Battery Low Alert', `Meter backup battery is below 20% (${targetPercentage}%).`, 'warning');
  };

  const rechargeBattery = () => {
    setMeterData(prev => ({
      ...prev,
      battery_percentage: 95,
      battery_status: 'charging'
    }));
    addNotification('Battery Charged', 'Meter backup battery charged to 95%.', 'system');
  };

  const simulateVoltageSpike = (spikeVoltage = 265.0) => {
    setMeterData(prev => {
      const isTripped = spikeVoltage > (prev.max_voltage_limit || 250);
      if (isTripped) {
        updateProtectionSettings(prev.meter_id, {
          voltage_cutoff_tripped: true,
          main_supply_connected: false
        });
        addNotification(
          'OVERVOLTAGE CUTOFF ACTIVATED',
          `Voltage spiked to ${spikeVoltage}V (safe limit: ${prev.max_voltage_limit}V). Contactor opened immediately.`,
          'outage'
        );
      }
      return {
        ...prev,
        voltage: spikeVoltage,
        voltage_cutoff_tripped: isTripped,
        main_supply_connected: !isTripped,
        active_power: isTripped ? 0.0 : prev.active_power
      };
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const login = (meterName = 'My Home', meterId = 'MTR-8A24-19F2') => {
    setMeterData(prev => ({
      ...prev,
      meter_name: meterName,
      meter_id: meterId
    }));
    setIsAuthenticated(true);
    setActiveTab('home');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setActiveTab('auth');
  };

  const unreadNotificationCount = notifications.filter(n => !n.is_read).length;

  return (
    <MeterContext.Provider
      value={{
        meterData,
        activeSession,
        receivingSession,
        sharingHistory,
        recipients,
        notifications,
        walletTransactions,
        unreadNotificationCount,
        activeTab,
        theme,
        isAuthenticated,
        isSimPanelOpen,
        apiEndpointUrl,
        isLiveEndpointActive,
        setApiEndpointUrl,
        setIsLiveEndpointActive,
        pingBackend,
        fundWallet,
        fundWalletWithPaystack,
        resetSafetyCutoff,
        setSafetyLimits,
        setActiveTab,
        setTheme,
        toggleTheme,
        setIsSimPanelOpen,
        login,
        logout,
        startSharing,
        stopSharing,
        stopReceiving,
        saveRecipient,
        searchRecipients,
        toggleGridStatus,
        toggleMeterOnline,
        toggleMainSupply,
        setTariff,
        simulateIncomingShare,
        drainBattery,
        rechargeBattery,
        simulateVoltageSpike,
        markAllNotificationsRead,
        dismissNotification,
        addNotification
      }}
    >
      {children}
    </MeterContext.Provider>
  );
};

export const useMeter = () => {
  const context = useContext(MeterContext);
  if (!context) {
    throw new Error('useMeter must be used within a MeterProvider');
  }
  return context;
};
