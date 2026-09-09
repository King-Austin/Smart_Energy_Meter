import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  MeterTelemetry,
  MeterSummary,
  TamperEvent,
  OutageLog,
  SharingSession,
  RegisteredRecipient,
  NotificationItem,
  ActiveTab,
  GridStatus,
  WalletTransaction
} from '../types/meter';
import {
  INITIAL_METER_DATA,
  INITIAL_FLEET_METERS,
  REGISTERED_RECIPIENTS,
  INITIAL_SHARING_HISTORY,
  INITIAL_NOTIFICATIONS,
  INITIAL_WALLET_TRANSACTIONS
} from '../services/mockData';
import { apiService } from '../services/api';
import {
  fetchLiveMeterFromSupabase,
  fetchFleetMeters,
  subscribeToMeterUpdates,
  subscribeToFleetUpdates,
  subscribeToTelemetryLogs,
  toggleRemoteSupplyRelay,
  fetchSupabaseTransactions,
  fetchSupabaseRecipients,
  isSupabaseConfigured,
  updateProtectionSettings,
  recordPaystackTransaction,
  fetchTamperEvents,
  fetchOutageHistory,
  adminSetRelay,
  adminClearTamper,
  adminUpdateMeterConfig,
  adminBulkSetTariff
} from '../services/supabase';

interface MeterContextType {
  meterData: MeterTelemetry;
  fleetMeters: MeterSummary[];
  selectedMeterId: string;
  switchMeter: (meterId: string) => Promise<void>;
  refreshFleet: () => Promise<void>;

  // Role-Based Access Control (Admin vs Consumer)
  userRole: 'admin' | 'consumer';
  setUserRole: (role: 'admin' | 'consumer') => void;
  isAdminUnlocked: boolean;
  verifyAdminPin: (pin: string) => boolean;
  lockAdmin: () => void;

  // Forensics & Modals
  tamperEvents: TamperEvent[];
  outageLogs: OutageLog[];
  isTamperModalOpen: boolean;
  setIsTamperModalOpen: (open: boolean) => void;
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;

  // Budget & Projections
  budgetProgressPct: number;
  projectedMonthKwh: number;
  projectedMonthCostNaira: number;

  // Admin Actions
  handleAdminSetRelay: (meterId: string, state: boolean, pin: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  handleAdminClearTamper: (meterId: string, pin: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  handleAdminUpdateConfig: (
    meterId: string,
    config: { tariff?: number; budgetNaira?: number; budgetKwh?: number; overCurrent?: number },
    pin: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  handleAdminBulkTariff: (meterIds: string[], newTariff: number, pin: string) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Consumer & Session State
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

  // Sharing (Cloud Synchronized)
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
  // Multi-Meter Fleet State
  const [fleetMeters, setFleetMeters] = useState<MeterSummary[]>(INITIAL_FLEET_METERS);
  const [selectedMeterId, setSelectedMeterId] = useState<string>('MTR-8A24-19F2');
  const [meterData, setMeterData] = useState<MeterTelemetry>(INITIAL_METER_DATA);

  // Role-Based Access Control
  const [userRole, setUserRole] = useState<'admin' | 'consumer'>('consumer');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);

  // Forensics & Modals
  const [tamperEvents, setTamperEvents] = useState<TamperEvent[]>([]);
  const [outageLogs, setOutageLogs] = useState<OutageLog[]>([]);
  const [isTamperModalOpen, setIsTamperModalOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);

  // Standard Meter App State
  const [activeSession, setActiveSession] = useState<SharingSession | null>(null);
  const [receivingSession, setReceivingSession] = useState<SharingSession | null>(null);
  const [sharingHistory, setSharingHistory] = useState<SharingSession[]>(INITIAL_SHARING_HISTORY);
  const [recipients, setRecipients] = useState<RegisteredRecipient[]>(REGISTERED_RECIPIENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(INITIAL_WALLET_TRANSACTIONS);
  const parseRouteToTab = (routeStr: string): ActiveTab => {
    const clean = routeStr.replace(/^[#/]+/, '').toLowerCase();
    if (clean === 'admin' || clean === 'fleet') return 'admin';
    if (clean === 'energy') return 'energy';
    if (clean === 'wallet') return 'wallet';
    if (clean === 'share') return 'share';
    if (clean === 'settings') return 'settings';
    if (clean === 'device') return 'device';
    if (clean === 'auth') return 'auth';
    return 'home';
  };

  const getInitialTab = (): ActiveTab => {
    if (typeof window === 'undefined') return 'home';
    const hash = window.location.hash;
    const path = window.location.pathname;
    if (hash && hash !== '#') return parseRouteToTab(hash);
    if (path && path !== '/') return parseRouteToTab(path);
    return 'home';
  };

  const [activeTab, setActiveTabState] = useState<ActiveTab>(getInitialTab);

  const setActiveTab = useCallback((tab: ActiveTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${tab}`;
    }
  }, []);

  // Sync hash/URL on popstate / hashchange
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      const newTab = parseRouteToTab(hash || path);
      setActiveTabState(newTab);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isSimPanelOpen, setIsSimPanelOpen] = useState<boolean>(false);

  // Backend / Endpoint State
  const [apiEndpointUrl, setApiEndpointUrl] = useState<string>('https://kmosslvdjdhrjgvitctr.supabase.co');
  const [isLiveEndpointActive, setIsLiveEndpointActive] = useState<boolean>(false);

  // Budget Milestone alert tracker (prevents repeated alerts in the same session)
  const sentAlertTiersRef = useRef<{ [tier: string]: boolean }>({});

  // Theme Sync
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const addNotification = useCallback((title: string, message: string, type: NotificationItem['type']) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      timestamp: 'Just now',
      type,
      is_read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Optional Browser Web Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: message, icon: '/favicon.ico' });
      } catch (e) {
        // Notification API fallback
      }
    }
  }, []);

  // Admin PIN verification
  const verifyAdminPin = (pin: string): boolean => {
    if (pin === '1234') {
      setIsAdminUnlocked(true);
      return true;
    }
    return false;
  };

  const lockAdmin = () => {
    setIsAdminUnlocked(false);
  };

  // 1. Fetch Fleet and Initial Data from Supabase
  const refreshFleet = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const fleet = await fetchFleetMeters();
    if (fleet && fleet.length > 0) {
      setFleetMeters(fleet);
    }
  }, []);

  const loadTamperAndOutages = useCallback(async (meterId: string) => {
    if (!isSupabaseConfigured()) return;
    const [tEvents, oLogs] = await Promise.all([
      fetchTamperEvents(meterId),
      fetchOutageHistory(meterId)
    ]);
    if (tEvents) setTamperEvents(tEvents);
    if (oLogs) setOutageLogs(oLogs);
  }, []);

  // 2. Switch active submeter
  const switchMeter = async (meterId: string) => {
    setSelectedMeterId(meterId);
    sentAlertTiersRef.current = {};

    if (isSupabaseConfigured()) {
      const live = await fetchLiveMeterFromSupabase(meterId);
      if (live) {
        setMeterData(live);
      } else {
        const found = fleetMeters.find(m => m.meter_id === meterId);
        if (found) {
          setMeterData(prev => ({
            ...prev,
            meter_id: found.meter_id,
            meter_name: found.meter_name,
            location: found.location,
            voltage: found.voltage,
            current: found.current,
            active_power: found.active_power,
            tariff_rate: found.tariff_rate,
            monthly_budget_naira: found.monthly_budget_naira,
            monthly_budget_kwh: found.monthly_budget_kwh,
            main_supply_connected: found.main_supply_connected,
            is_tampered: found.is_tampered,
            tamper_locked: found.tamper_locked
          }));
        }
      }
      await loadTamperAndOutages(meterId);
    }
  };

  // 3. Initial Boot & Subscriptions
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      if (isSupabaseConfigured()) {
        const [liveMeter, fleet, txs, rcpts] = await Promise.all([
          fetchLiveMeterFromSupabase(selectedMeterId),
          fetchFleetMeters(),
          fetchSupabaseTransactions(selectedMeterId),
          fetchSupabaseRecipients()
        ]);

        if (isMounted) {
          if (liveMeter) setMeterData(liveMeter);
          if (fleet && fleet.length > 0) setFleetMeters(fleet);
          if (txs && txs.length > 0) setWalletTransactions(txs);
          if (rcpts && rcpts.length > 0) setRecipients(rcpts);
        }
        await loadTamperAndOutages(selectedMeterId);
      }
    };

    initData();

    // Subscribe to Fleet changes
    const fleetChannel = subscribeToFleetUpdates(() => {
      refreshFleet();
    });

    return () => {
      isMounted = false;
      fleetChannel.unsubscribe();
    };
  }, [refreshFleet, loadTamperAndOutages, selectedMeterId]);

  // 4. Real-time Subscription for selected meter
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const meterChannel = subscribeToMeterUpdates(selectedMeterId, (updated) => {
      setMeterData(prev => ({
        ...prev,
        ...updated,
        // Preserve local properties if remote payload doesn't provide them
        currency_symbol: prev.currency_symbol,
        currency_code: prev.currency_code
      }));

      // Update in fleet list as well
      setFleetMeters(prev => prev.map(m => m.meter_id === updated.meter_id ? { ...m, ...updated } : m));

      // Trigger high-priority notifications on state transitions
      if (updated.is_tampered && !meterData.is_tampered) {
        addNotification(
          'TAMPER BREACH DETECTED',
          `SS-5GL enclosure lid switch triggered on ${updated.meter_name} (${updated.meter_id}). Power isolated!`,
          'tamper'
        );
        loadTamperAndOutages(selectedMeterId);
      }

      if (updated.grid_status === 'offline' && meterData.grid_status === 'online') {
        addNotification(
          'GRID BLACKOUT DETECTED',
          `Mains supply dropped to 0V. Submeter ${updated.meter_id} is running on internal backup battery.`,
          'outage'
        );
        loadTamperAndOutages(selectedMeterId);
      } else if (updated.grid_status === 'online' && meterData.grid_status === 'offline') {
        addNotification(
          'GRID POWER RESTORED',
          `Mains voltage recovered (${updated.voltage}V). Contactor re-energized.`,
          'restored'
        );
        loadTamperAndOutages(selectedMeterId);
      }
    });

    const logsChannel = subscribeToTelemetryLogs(selectedMeterId, (newLog) => {
      setMeterData(prev => ({
        ...prev,
        voltage: Number(newLog.voltage ?? prev.voltage),
        current: Number(newLog.current ?? prev.current),
        active_power: Number(newLog.active_power ?? prev.active_power),
        power_factor: Number(newLog.power_factor ?? prev.power_factor),
        frequency: Number(newLog.frequency ?? prev.frequency),
        is_tampered: newLog.is_tampered ?? prev.is_tampered,
        last_seen: newLog.created_at ?? new Date().toISOString()
      }));
    });

    return () => {
      meterChannel.unsubscribe();
      logsChannel.unsubscribe();
    };
  }, [selectedMeterId, meterData.is_tampered, meterData.grid_status, addNotification, loadTamperAndOutages]);

  // 5. Budget Progress & Month-End Run-Rate Projections
  const dayOfMonth = Math.max(1, new Date().getDate());
  const daysInMonth = 30;
  const currentMonthSpent = meterData.estimated_bill_month || (meterData.energy_today * meterData.tariff_rate * dayOfMonth);
  const budgetLimit = meterData.monthly_budget_naira || 25000;
  const budgetProgressPct = Math.min(100, Math.round((currentMonthSpent / budgetLimit) * 100));

  // Run-rate projections
  const dailyAvgKwh = (meterData.energy_month || (meterData.energy_today * dayOfMonth * 0.8)) / dayOfMonth;
  const projectedMonthKwh = Math.round(dailyAvgKwh * daysInMonth);
  const projectedMonthCostNaira = Math.round(projectedMonthKwh * (meterData.tariff_rate || 68.5));

  // 6. Proactive Budget Milestone Alerts (50%, 80%, 90%, 100%)
  useEffect(() => {
    const checkMilestone = (tier: number) => {
      if (budgetProgressPct >= tier && !sentAlertTiersRef.current[tier]) {
        sentAlertTiersRef.current[tier] = true;
        addNotification(
          `Monthly Budget Alert: ${tier}% Reached`,
          `You have consumed ₦${currentMonthSpent.toLocaleString()} of your ₦${budgetLimit.toLocaleString()} limit (${tier}%). Projected month-end: ₦${projectedMonthCostNaira.toLocaleString()}.`,
          'budget'
        );
      }
    };

    checkMilestone(50);
    checkMilestone(80);
    checkMilestone(90);
    checkMilestone(100);
  }, [budgetProgressPct, currentMonthSpent, budgetLimit, projectedMonthCostNaira, addNotification]);

  // 7. Admin Action Handlers
  const handleAdminSetRelay = async (meterId: string, state: boolean, pin: string) => {
    const res = await adminSetRelay(meterId, state, pin);
    if (res.success) {
      addNotification(
        'Admin Contactor Control',
        `Submeter ${meterId} contactor ${state ? 'CONNECTED' : 'DISCONNECTED'}.`,
        'system'
      );
      await refreshFleet();
      if (meterId === selectedMeterId) {
        setMeterData(prev => ({ ...prev, main_supply_connected: state }));
      }
    }
    return res;
  };

  const handleAdminClearTamper = async (meterId: string, pin: string) => {
    const res = await adminClearTamper(meterId, pin);
    if (res.success) {
      addNotification(
        'Tamper Cleared',
        `Tamper lock cleared on submeter ${meterId}. Main power supply contactor restored.`,
        'restored'
      );
      await refreshFleet();
      await loadTamperAndOutages(meterId);
      if (meterId === selectedMeterId) {
        setMeterData(prev => ({
          ...prev,
          is_tampered: false,
          tamper_locked: false,
          main_supply_connected: true
        }));
      }
    }
    return res;
  };

  const handleAdminUpdateConfig = async (
    meterId: string,
    config: { tariff?: number; budgetNaira?: number; budgetKwh?: number; overCurrent?: number },
    pin: string
  ) => {
    const res = await adminUpdateMeterConfig(meterId, config, pin);
    if (res.success) {
      addNotification(
        'Configuration Saved',
        `Updated settings for submeter ${meterId}.`,
        'system'
      );
      await refreshFleet();
      if (meterId === selectedMeterId) {
        setMeterData(prev => ({
          ...prev,
          tariff_rate: config.tariff ?? prev.tariff_rate,
          monthly_budget_naira: config.budgetNaira ?? prev.monthly_budget_naira,
          monthly_budget_kwh: config.budgetKwh ?? prev.monthly_budget_kwh,
          over_current_limit: config.overCurrent ?? prev.over_current_limit
        }));
      }
    }
    return res;
  };

  const handleAdminBulkTariff = async (meterIds: string[], newTariff: number, pin: string) => {
    const res = await adminBulkSetTariff(meterIds, newTariff, pin);
    if (res.success) {
      addNotification('Bulk Tariff Updated', res.message || 'Updated tariff across fleet.', 'system');
      await refreshFleet();
      setMeterData(prev => ({ ...prev, tariff_rate: newTariff }));
    }
    return res;
  };

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

  // Paystack Funding with Real STS 20-digit token generation
  const fundWalletWithPaystack = async (amount: number): Promise<{ success: boolean; token: string; units: number; error?: string }> => {
    const tariff = meterData.tariff_rate > 0 ? meterData.tariff_rate : 68.5;
    const units = Number((amount / tariff).toFixed(1));
    
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const p4 = Math.floor(1000 + Math.random() * 9000);
    const p5 = Math.floor(1000 + Math.random() * 9000);
    const stsToken = `${p1}-${p2}-${p3}-${p4}-${p5}`;

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
        active_power: 1.54
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

  const pingBackend = async (targetUrl?: string) => {
    const url = targetUrl || apiEndpointUrl;
    if (url) {
      apiService.setBaseUrl(url);
    }
    const start = performance.now();
    try {
      const res = await apiService.ping();
      const latency = Math.round(performance.now() - start);
      return { success: res.success, latencyMs: latency, error: res.error };
    } catch (err: any) {
      return { success: false, latencyMs: 0, error: err?.message || 'Network unreachable' };
    }
  };

  const startSharing = (
    recipient: RegisteredRecipient,
    energyLimitKwh: number,
    powerLimitW = 500,
    durationMinutes = 60
  ): { success: boolean; error?: string } => {
    if (meterData.grid_status !== 'online') {
      return { success: false, error: 'Grid is offline. Cloud sharing requires active mains supply.' };
    }
    if (meterData.prepaid_units_kwh < energyLimitKwh) {
      return { success: false, error: `Insufficient energy balance (${meterData.prepaid_units_kwh} kWh). Need ${energyLimitKwh} kWh.` };
    }

    const session: SharingSession = {
      session_id: `SES-${Date.now().toString().slice(-6)}`,
      source_meter_id: meterData.meter_id,
      source_meter_name: meterData.meter_name,
      destination_meter_id: recipient.meter_id,
      destination_meter_name: recipient.meter_name,
      direction: 'sending',
      status: 'active',
      energy_limit_kwh: energyLimitKwh,
      power_limit_w: powerLimitW,
      duration_limit_seconds: durationMinutes * 60,
      current_power_w: powerLimitW,
      energy_transferred_kwh: 0,
      elapsed_seconds: 0,
      started_at: new Date().toISOString(),
      source_online: true,
      destination_online: true,
      cloud_sync_status: 'live'
    };

    setActiveSession(session);
    setSharingHistory(prev => [session, ...prev]);

    addNotification(
      'Sharing Session Started',
      `Cloud transfer of ${energyLimitKwh} kWh to ${recipient.meter_name} initiated.`,
      'sharing'
    );
    return { success: true };
  };

  const stopSharing = () => {
    if (activeSession) {
      setActiveSession(null);
      addNotification('Sharing Stopped', 'Energy sharing session ended.', 'sharing');
    }
  };

  const stopReceiving = () => {
    if (receivingSession) {
      setReceivingSession(null);
      addNotification('Receiving Ended', 'Incoming energy transfer completed.', 'sharing');
    }
  };

  const saveRecipient = (meterId: string) => {
    setRecipients(prev => prev.map(r => r.meter_id === meterId ? { ...r, is_saved: true } : r));
  };

  const searchRecipients = (query: string) => {
    const q = query.toLowerCase();
    return recipients.filter(r => r.meter_name.toLowerCase().includes(q) || r.meter_id.toLowerCase().includes(q) || r.owner_name.toLowerCase().includes(q));
  };

  const toggleGridStatus = (forcedStatus?: GridStatus) => {
    setMeterData(prev => {
      const next: GridStatus = forcedStatus || (prev.grid_status === 'online' ? 'offline' : 'online');
      const isOnline = next === 'online';
      addNotification(
        isOnline ? 'Grid Power Restored' : 'Grid Outage Detected',
        isOnline ? 'Mains electricity restored.' : 'Blackout detected. Running on battery.',
        isOnline ? 'restored' : 'outage'
      );
      return {
        ...prev,
        grid_status: next,
        voltage: isOnline ? 231.4 : 0.0,
        active_power: isOnline ? 1.54 : 0.0,
        current: isOnline ? 6.8 : 0.0
      };
    });
  };

  const toggleMeterOnline = (forcedOnline?: boolean) => {
    setMeterData(prev => {
      const nextOnline = forcedOnline !== undefined ? forcedOnline : prev.device_status !== 'online';
      return {
        ...prev,
        device_status: nextOnline ? 'online' : 'offline',
        connection_quality: nextOnline ? 'good' : 'offline'
      };
    });
  };

  const toggleMainSupply = async () => {
    const newState = !meterData.main_supply_connected;
    if (meterData.tamper_locked && newState) {
      addNotification(
        'Contactor Blocked',
        'Cannot reconnect power while Tamper Lock is active. Clear tamper with Admin PIN first.',
        'warning'
      );
      return;
    }

    setMeterData(prev => ({
      ...prev,
      main_supply_connected: newState,
      active_power: newState ? 1.54 : 0.0,
      current: newState ? 6.8 : 0.0
    }));

    if (isSupabaseConfigured()) {
      await toggleRemoteSupplyRelay(meterData.meter_id, newState);
    }

    addNotification(
      newState ? 'Supply Connected' : 'Supply Cut',
      newState ? 'Whole-house supply contactor engaged.' : 'Whole-house contactor opened (Power cut).',
      newState ? 'restored' : 'outage'
    );
  };

  const setTariff = (rate: number, currencyCode: string, currencySymbol: string) => {
    setMeterData(prev => ({
      ...prev,
      tariff_rate: rate,
      currency_code: currencyCode,
      currency_symbol: currencySymbol
    }));
  };

  const simulateIncomingShare = () => {
    const session: SharingSession = {
      session_id: `SES-INC-${Date.now().toString().slice(-6)}`,
      source_meter_id: 'MTR-72AF-2091',
      source_meter_name: 'Neighbour House',
      destination_meter_id: meterData.meter_id,
      destination_meter_name: meterData.meter_name,
      direction: 'receiving',
      status: 'active',
      energy_limit_kwh: 1.5,
      power_limit_w: 600,
      current_power_w: 600,
      energy_transferred_kwh: 0,
      elapsed_seconds: 0,
      started_at: new Date().toISOString(),
      source_online: true,
      destination_online: true,
      cloud_sync_status: 'live'
    };
    setReceivingSession(session);
    addNotification('Incoming Energy Share', 'Receiving 1.5 kWh from Neighbour House.', 'sharing');
  };

  const drainBattery = (target = 15) => {
    setMeterData(prev => ({
      ...prev,
      battery_percentage: target,
      battery_status: target < 20 ? 'low' : 'battery'
    }));
    addNotification('Battery Low', `Backup battery at ${target}%.`, 'warning');
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
        fleetMeters,
        selectedMeterId,
        switchMeter,
        refreshFleet,
        userRole,
        setUserRole,
        isAdminUnlocked,
        verifyAdminPin,
        lockAdmin,
        tamperEvents,
        outageLogs,
        isTamperModalOpen,
        setIsTamperModalOpen,
        isAIAssistantOpen,
        setIsAIAssistantOpen,
        budgetProgressPct,
        projectedMonthKwh,
        projectedMonthCostNaira,
        handleAdminSetRelay,
        handleAdminClearTamper,
        handleAdminUpdateConfig,
        handleAdminBulkTariff,
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
