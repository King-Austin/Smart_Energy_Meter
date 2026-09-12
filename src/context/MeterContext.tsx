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
  WalletTransaction,
  AppRoute
} from '../types/meter';
import {
  INITIAL_SHARING_HISTORY
} from '../services/mockData';
import { apiService } from '../services/api';
import {
  toggleRemoteSupplyRelay,
  isSupabaseConfigured,
  updateProtectionSettings,
  supabase
} from '../services/supabase';
import {
  triggerHaptic,
  sendNativeNotification,
  listenToNetworkChanges
} from '../services/nativeService';
import { registerBackHandler } from '../services/navigationService';
import { useMeterTelemetry } from './hooks/useMeterTelemetry';
import { useFleetManagement } from './hooks/useFleetManagement';
import { useWalletBilling } from './hooks/useWalletBilling';

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
  handleAdminSetUnits: (meterId: string, units: number, pin: string) => Promise<{ success: boolean; message?: string; error?: string; units?: number }>;
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
  fundWallet: (amount: number, method?: string) => void;
  fundWalletWithPaystack: (amount: number) => Promise<{ success: boolean; units: number; newBalanceUnits?: number; error?: string }>;

  // Protective Safety Cutoffs
  resetSafetyCutoff: () => void;
  setSafetyLimits: (maxVoltage: number, minVoltage: number, billThreshold: number) => void;

  // Navigation, Routing & Themes
  currentRoute: AppRoute;
  navigateToRoute: (route: AppRoute) => void;
  inspectingMeterId: string | null;
  setInspectingMeterId: (meterId: string | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  goBack: () => boolean;
  canGoBack: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setIsSimPanelOpen: (open: boolean) => void;
  
  // Auth
  login: (meterName?: string, meterId?: string) => void;
  logout: () => void;
  updateProfileName: (newName: string) => Promise<boolean>;
  updateProfileLocation: (state: string, lga: string) => Promise<boolean>;

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
  // Meter Selection Identifier
  const [selectedMeterId, setSelectedMeterId] = useState<string>('MTR-8A24-19F2');

  // Notifications State & Actions
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((title: string, message: string, type: NotificationItem['type']) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
        // Fallback
      }
    }

    // Native Mobile Haptic Feedback & Push Notifications
    if (type === 'tamper' || type === 'outage') {
      triggerHaptic('error');
      sendNativeNotification(`🚨 ${title}`, message);
    } else if (type === 'restored' || type === 'wallet') {
      triggerHaptic('success');
      sendNativeNotification(`⚡ ${title}`, message);
    } else if (type === 'warning') {
      triggerHaptic('warning');
      sendNativeNotification(`⚠️ ${title}`, message);
    } else {
      triggerHaptic('light');
    }
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadNotificationCount = notifications.filter(n => !n.is_read).length;

  // Domain Hook 1: Meter Telemetry (Live meter data, subscriptions, forensics)
  const {
    meterData,
    setMeterData,
    tamperEvents,
    outageLogs,
    switchMeter,
    loadTamperAndOutages
  } = useMeterTelemetry({
    selectedMeterId,
    setSelectedMeterId,
    addNotification
  });

  // Domain Hook 2: Fleet Management (Fleet list, role, admin PIN, and admin RPCs)
  const {
    fleetMeters,
    userRole,
    setUserRole,
    isAdminUnlocked,
    verifyAdminPin,
    lockAdmin,
    refreshFleet,
    handleAdminSetRelay,
    handleAdminClearTamper,
    handleAdminSetUnits,
    handleAdminUpdateConfig,
    handleAdminBulkTariff
  } = useFleetManagement({
    selectedMeterId,
    setMeterData,
    addNotification,
    loadTamperAndOutages
  });

  // Domain Hook 3: Wallet Billing (Transactions, recipients, Paystack, STS token)
  const {
    walletTransactions,
    recipients,
    fundWallet,
    fundWalletWithPaystack,
    saveRecipient,
    searchRecipients
  } = useWalletBilling({
    selectedMeterId,
    meterData,
    setMeterData,
    addNotification
  });

  // UI Modal States
  const [isTamperModalOpen, setIsTamperModalOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);
  const [isSimPanelOpen, setIsSimPanelOpen] = useState<boolean>(false);

  // Sharing Sessions
  const [activeSession, setActiveSession] = useState<SharingSession | null>(null);
  const [receivingSession, setReceivingSession] = useState<SharingSession | null>(null);
  const [sharingHistory, setSharingHistory] = useState<SharingSession[]>(INITIAL_SHARING_HISTORY);

  // Theme State & Persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voltrix_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('voltrix_theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Dedicated Route State
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === '#/admin' || hash === '#admin' || path === '/admin') return 'admin';
      if (hash === '#/app' || hash === '#/dashboard' || hash === '#/client' || hash === '#app' || path === '/dashboard' || path === '/app') {
        return 'client';
      }
      if ((window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform()) {
        return 'client';
      }
    }
    return 'landing';
  });

  const [inspectingMeterId, setInspectingMeterId] = useState<string | null>(null);
  const [routeHistory, setRouteHistory] = useState<AppRoute[]>([]);
  const [tabHistory, setTabHistory] = useState<ActiveTab[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const navigateToRoute = useCallback((route: AppRoute) => {
    setCurrentRoute(prev => {
      if (prev !== route) {
        setRouteHistory(h => [...h, prev].slice(-10));
      }
      return route;
    });
    if (typeof window !== 'undefined') {
      if (route === 'admin') {
        window.location.hash = '#/admin';
      } else if (route === 'client') {
        window.location.hash = '#/app';
      } else {
        window.location.hash = '#/';
      }
      const rootEl = document.getElementById('root');
      if (rootEl) {
        if (route === 'admin') {
          rootEl.classList.add('admin-layout');
          rootEl.classList.remove('landing-layout');
        } else if (route === 'landing') {
          rootEl.classList.add('landing-layout');
          rootEl.classList.remove('admin-layout');
        } else {
          rootEl.classList.remove('admin-layout');
          rootEl.classList.remove('landing-layout');
        }
      }
    }
  }, []);

  // Sync URL hash with route state
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      let targetRoute: AppRoute = 'landing';
      if (hash === '#/admin' || hash === '#admin' || path === '/admin') {
        targetRoute = 'admin';
      } else if (hash === '#/app' || hash === '#/dashboard' || hash === '#/client' || hash === '#app' || path === '/dashboard' || path === '/app') {
        targetRoute = 'client';
      } else if ((window as any).Capacitor && typeof (window as any).Capacitor.isNativePlatform === 'function' && (window as any).Capacitor.isNativePlatform()) {
        targetRoute = 'client';
      } else {
        targetRoute = 'landing';
      }
      setCurrentRoute(targetRoute);
      const rootEl = document.getElementById('root');
      if (rootEl) {
        if (targetRoute === 'admin') {
          rootEl.classList.add('admin-layout');
          rootEl.classList.remove('landing-layout');
        } else if (targetRoute === 'landing') {
          rootEl.classList.add('landing-layout');
          rootEl.classList.remove('admin-layout');
        } else {
          rootEl.classList.remove('admin-layout');
          rootEl.classList.remove('landing-layout');
        }
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange();

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleSetActiveTab = useCallback((nextTab: ActiveTab) => {
    setActiveTab(current => {
      if (current !== nextTab) {
        setTabHistory(prev => [...prev, current].slice(-10));
      }
      return nextTab;
    });
  }, []);

  // Back Navigation Handler
  const goBack = useCallback((): boolean => {
    if (isTamperModalOpen) {
      setIsTamperModalOpen(false);
      return true;
    }
    if (isAIAssistantOpen) {
      setIsAIAssistantOpen(false);
      return true;
    }
    if (isSimPanelOpen) {
      setIsSimPanelOpen(false);
      return true;
    }
    if (inspectingMeterId) {
      setInspectingMeterId(null);
      return true;
    }
    if (currentRoute === 'admin' && routeHistory.length > 0) {
      const prevRoute = routeHistory[routeHistory.length - 1];
      setRouteHistory(h => h.slice(0, -1));
      navigateToRoute(prevRoute || 'client');
      return true;
    }
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory(h => h.slice(0, -1));
      setActiveTab(prevTab);
      return true;
    }
    if (activeTab !== 'home') {
      setActiveTab('home');
      return true;
    }
    return false;
  }, [
    isTamperModalOpen,
    isAIAssistantOpen,
    isSimPanelOpen,
    inspectingMeterId,
    currentRoute,
    routeHistory,
    tabHistory,
    activeTab,
    navigateToRoute
  ]);

  const canGoBack = Boolean(
    isTamperModalOpen ||
    isAIAssistantOpen ||
    isSimPanelOpen ||
    inspectingMeterId ||
    (currentRoute === 'admin' && routeHistory.length > 0) ||
    tabHistory.length > 0 ||
    activeTab !== 'home'
  );

  useEffect(() => {
    const unregister = registerBackHandler('meter-context-back', 10, () => goBack());
    return () => unregister();
  }, [goBack]);

  // Backend / Endpoint State
  const [apiEndpointUrl, setApiEndpointUrl] = useState<string>('https://kmosslvdjdhrjgvitctr.supabase.co');
  const [isLiveEndpointActive, setIsLiveEndpointActive] = useState<boolean>(false);
  const sentAlertTiersRef = useRef<{ [tier: string]: boolean }>({});

  // Native Mobile Network Monitor
  useEffect(() => {
    listenToNetworkChanges((status) => {
      if (!status.connected) {
        addNotification(
          'Network Offline',
          'Phone lost internet. Operating in offline cache / direct LAN fallback mode.',
          'warning'
        );
      }
    });
  }, [addNotification]);

  // Budget Projections
  const dayOfMonth = Math.max(1, new Date().getDate());
  const daysInMonth = 30;
  const currentMonthSpent = meterData.estimated_bill_month || (meterData.energy_today * meterData.tariff_rate * dayOfMonth);
  const budgetLimit = meterData.monthly_budget_naira || 25000;
  const budgetProgressPct = Math.min(100, Math.round((currentMonthSpent / budgetLimit) * 100));

  const dailyAvgKwh = (meterData.energy_month || (meterData.energy_today * dayOfMonth * 0.8)) / dayOfMonth;
  const projectedMonthKwh = Math.round(dailyAvgKwh * daysInMonth);
  const projectedMonthCostNaira = Math.round(projectedMonthKwh * (meterData.tariff_rate || 160.0));

  // Proactive Budget Milestone Alerts
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

  // Protective Safety Cutoffs
  const resetSafetyCutoff = useCallback(() => {
    setMeterData(prev => {
      // If the overvoltage limit was lowered to trigger the test trip (e.g. 192V <= 206V),
      // restore max_voltage_limit to a safe default (250V) so it doesn't immediately re-trip!
      const restoredMaxVoltage = (prev.voltage > 50 && prev.voltage >= prev.max_voltage_limit)
        ? Math.max(250.0, Math.ceil(prev.voltage + 20))
        : prev.max_voltage_limit;

      updateProtectionSettings(prev.meter_id, {
        main_supply_connected: true,
        voltage_cutoff_tripped: false,
        bill_cutoff_tripped: false,
        max_voltage_limit: restoredMaxVoltage
      });

      if (isSupabaseConfigured()) {
        toggleRemoteSupplyRelay(prev.meter_id, true);
      }

      addNotification(
        'Protection Re-armed',
        `Contactor reclosed. Mains supply restored! Overvoltage threshold reset to ${restoredMaxVoltage}V.`,
        'restored'
      );

      return {
        ...prev,
        main_supply_connected: true,
        voltage_cutoff_tripped: false,
        bill_cutoff_tripped: false,
        max_voltage_limit: restoredMaxVoltage,
        active_power: 1.54
      };
    });
  }, [addNotification, setMeterData]);


  const setSafetyLimits = useCallback((maxVoltage: number, minVoltage: number, billThreshold: number) => {
    setMeterData(prev => {
      const isOverVoltage = prev.voltage > maxVoltage && prev.voltage > 50;
      const isUnderVoltage = prev.voltage < minVoltage && prev.voltage > 50;
      const willTrip = isOverVoltage || isUnderVoltage;

      updateProtectionSettings(prev.meter_id, {
        max_voltage_limit: maxVoltage,
        min_voltage_limit: minVoltage,
        bill_limit_threshold: billThreshold,
        ...(willTrip ? { voltage_cutoff_tripped: true, main_supply_connected: false } : {})
      });
      addNotification(
        willTrip ? 'SAFETY OVERVOLTAGE TRIPPED' : 'Safety Thresholds Configured',
        willTrip 
          ? `Voltage ${prev.voltage.toFixed(1)}V violated limits (${minVoltage}V - ${maxVoltage}V). Contactor opened!`
          : `Max Voltage: ${maxVoltage}V, Min: ${minVoltage}V, Spend Cap: ₦${billThreshold.toLocaleString()}.`,
        willTrip ? 'outage' : 'system'
      );
      return {
        ...prev,
        max_voltage_limit: maxVoltage,
        min_voltage_limit: minVoltage,
        bill_limit_threshold: billThreshold,
        ...(willTrip ? { voltage_cutoff_tripped: true, main_supply_connected: false, active_power: 0.0, current: 0.0 } : {})
      };
    });
  }, [addNotification, setMeterData]);

  const pingBackend = useCallback(async (targetUrl?: string) => {
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
  }, [apiEndpointUrl]);

  // Cloud Synchronized Sharing
  const startSharing = useCallback((
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
  }, [meterData.grid_status, meterData.prepaid_units_kwh, meterData.meter_id, meterData.meter_name, addNotification]);

  const stopSharing = useCallback(() => {
    if (activeSession) {
      setActiveSession(null);
      addNotification('Sharing Stopped', 'Energy sharing session ended.', 'sharing');
    }
  }, [activeSession, addNotification]);

  const stopReceiving = useCallback(() => {
    if (receivingSession) {
      setReceivingSession(null);
      addNotification('Receiving Ended', 'Incoming energy transfer completed.', 'sharing');
    }
  }, [receivingSession, addNotification]);

  // Device & Simulation Controls
  const toggleGridStatus = useCallback((forcedStatus?: GridStatus) => {
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
  }, [addNotification, setMeterData]);

  const toggleMeterOnline = useCallback((forcedOnline?: boolean) => {
    setMeterData(prev => {
      const nextOnline = forcedOnline !== undefined ? forcedOnline : prev.device_status !== 'online';
      return {
        ...prev,
        device_status: nextOnline ? 'online' : 'offline',
        connection_quality: nextOnline ? 'good' : 'offline'
      };
    });
  }, [setMeterData]);

  const toggleMainSupply = useCallback(async () => {
    const newState = !meterData.main_supply_connected;
    if (meterData.tamper_locked && newState) {
      addNotification(
        'Contactor Blocked',
        'Cannot reconnect power while Tamper Lock is active. Clear tamper with Admin PIN first.',
        'warning'
      );
      return;
    }

    const wasTripped = meterData.voltage_cutoff_tripped || meterData.bill_cutoff_tripped;
    const restoredMaxVoltage = (newState && wasTripped && meterData.voltage > 50 && meterData.voltage >= meterData.max_voltage_limit)
      ? Math.max(250.0, Math.ceil(meterData.voltage + 20))
      : meterData.max_voltage_limit;

    setMeterData(prev => ({
      ...prev,
      main_supply_connected: newState,
      voltage_cutoff_tripped: newState ? false : prev.voltage_cutoff_tripped,
      bill_cutoff_tripped: newState ? false : prev.bill_cutoff_tripped,
      max_voltage_limit: restoredMaxVoltage,
      active_power: newState ? 1.54 : 0.0,
      current: newState ? prev.current : 0.0
    }));

    if (isSupabaseConfigured()) {
      await toggleRemoteSupplyRelay(meterData.meter_id, newState);
      if (newState && wasTripped) {
        await updateProtectionSettings(meterData.meter_id, {
          main_supply_connected: true,
          voltage_cutoff_tripped: false,
          bill_cutoff_tripped: false,
          max_voltage_limit: restoredMaxVoltage
        });
      }
    }

    addNotification(
      newState ? 'Supply Connected' : 'Supply Cut',
      newState ? 'Whole-house supply contactor engaged.' : 'Whole-house contactor opened (Power cut).',
      newState ? 'restored' : 'outage'
    );
  }, [
    meterData.main_supply_connected,
    meterData.tamper_locked,
    meterData.voltage_cutoff_tripped,
    meterData.bill_cutoff_tripped,
    meterData.voltage,
    meterData.max_voltage_limit,
    meterData.meter_id,
    addNotification,
    setMeterData
  ]);


  const setTariff = useCallback((rate: number, currencyCode: string, currencySymbol: string) => {
    setMeterData(prev => ({
      ...prev,
      tariff_rate: rate,
      currency_code: currencyCode,
      currency_symbol: currencySymbol
    }));
  }, [setMeterData]);

  const simulateIncomingShare = useCallback(() => {
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
  }, [meterData.meter_id, meterData.meter_name, addNotification]);

  const drainBattery = useCallback((target = 15) => {
    setMeterData(prev => ({
      ...prev,
      battery_percentage: target,
      battery_status: target < 20 ? 'low' : 'battery'
    }));
    addNotification('Battery Low', `Backup battery at ${target}%.`, 'warning');
  }, [addNotification, setMeterData]);

  const rechargeBattery = useCallback(() => {
    setMeterData(prev => ({
      ...prev,
      battery_percentage: 95,
      battery_status: 'charging'
    }));
    addNotification('Battery Charged', 'Meter backup battery charged to 95%.', 'system');
  }, [addNotification, setMeterData]);

  const simulateVoltageSpike = useCallback((spikeVoltage = 265.0) => {
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
  }, [addNotification, setMeterData]);

  // Auth Controls
  const login = useCallback((meterName = 'My Home', meterId = 'MTR-8A24-19F2') => {
    setMeterData(prev => ({
      ...prev,
      meter_name: meterName,
      meter_id: meterId
    }));
    setIsAuthenticated(true);
    setActiveTab('home');
  }, [setMeterData]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setActiveTab('auth');
  }, []);

  const updateProfileName = useCallback(async (newName: string): Promise<boolean> => {
    const trimmed = newName.trim();
    if (!trimmed) return false;

    setMeterData(prev => ({
      ...prev,
      meter_name: trimmed
    }));

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('meters')
          .update({
            meter_name: trimmed,
            updated_at: new Date().toISOString()
          })
          .eq('meter_id', meterData.meter_id);

        if (error) {
          console.warn('[updateProfileName] Supabase update warning:', error.message);
        }
      }
      addNotification('Profile Updated', `Account display name set to "${trimmed}".`, 'system');
      return true;
    } catch (err) {
      console.warn('[updateProfileName] Error updating name:', err);
      return true;
    }
  }, [meterData.meter_id, setMeterData, addNotification]);

  const updateProfileLocation = useCallback(async (state: string, lga: string): Promise<boolean> => {
    const trimmedState = state.trim();
    const trimmedLga = lga.trim();

    setMeterData(prev => ({
      ...prev,
      state: trimmedState,
      lga: trimmedLga
    }));

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('meters')
          .update({
            state: trimmedState,
            lga: trimmedLga,
            updated_at: new Date().toISOString()
          })
          .eq('meter_id', meterData.meter_id);

        if (error) {
          console.warn('[updateProfileLocation] Supabase update warning:', error.message);
        }
      }
      addNotification('Geo-Location Updated', `Location set to ${trimmedLga}, ${trimmedState}.`, 'system');
      return true;
    } catch (err) {
      console.warn('[updateProfileLocation] Error updating location:', err);
      return true;
    }
  }, [meterData.meter_id, setMeterData, addNotification]);

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
        handleAdminSetUnits,
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
        currentRoute,
        navigateToRoute,
        inspectingMeterId,
        setInspectingMeterId,
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
        setActiveTab: handleSetActiveTab,
        goBack,
        canGoBack,
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
        updateProfileName,
        updateProfileLocation,
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
