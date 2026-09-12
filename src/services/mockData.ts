import {
  MeterTelemetry,
  MeterSummary,
  SharingSession,
  RegisteredRecipient,
  HourlyConsumption,
  DailyConsumption,
  MonthlyConsumption,
  NotificationItem,
  WalletTransaction
} from '../types/meter';

export const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'TXN-9021',
    type: 'funding',
    title: 'Instant Recharge',
    description: 'Smart Meter Direct Credit (+62.50 kWh)',
    amount_currency: 10000,
    units_kwh: 62.5,
    timestamp: 'Today, 2:15 PM',
    status: 'successful'
  },
  {
    id: 'TXN-8840',
    type: 'shared_sent',
    title: 'Energy Shared',
    description: '1.42 kWh shared with Neighbour House',
    amount_currency: 227,
    units_kwh: 1.42,
    timestamp: '14 Aug, 8:20 PM',
    status: 'successful'
  },
  {
    id: 'TXN-7731',
    type: 'funding',
    title: 'Instant Recharge',
    description: 'Smart Meter Direct Credit (+31.25 kWh)',
    amount_currency: 5000,
    units_kwh: 31.25,
    timestamp: '10 Aug, 10:45 AM',
    status: 'successful'
  }
];


export const INITIAL_METER_DATA: MeterTelemetry = {
  meter_id: 'MTR-8A24-19F2',
  meter_name: 'My Home',
  user_id: 'usr_9921',
  voltage: 0.0,
  current: 0.0,
  active_power: 0.0,
  power_factor: 0.0,
  frequency: 0.0,
  apparent_power: 0.0,
  reactive_power: 0.0,

  // Wallet & Prepaid Units
  wallet_balance: 13992,
  prepaid_units_kwh: 87.45,
  estimated_days_remaining: 26,
  auto_topup_enabled: false,
  auto_topup_threshold: 1000,

  energy_today: 1.28,
  energy_yesterday: 4.85,
  energy_week: 31.4,
  energy_month: 92.6,
  projected_month: 124.0,

  estimated_cost_today: 204,
  estimated_bill_month: 14816,
  projected_bill_month: 19840,

  grid_status: 'offline',
  device_status: 'online',
  connection_quality: 'good',

  battery_percentage: 50,
  battery_status: 'battery',

  main_supply_connected: true,
  last_seen: 'Awaiting prototype...',
  firmware_version: 'v3.2',

  tariff_rate: 160.0,
  currency_symbol: '₦',
  currency_code: 'NGN',

  // Protective safety cutoff limits & fleet metadata
  location: 'Flat 1 - Ground Floor',
  building_id: 'BLD-01',
  monthly_budget_naira: 25000.0,
  monthly_budget_kwh: 365.0,
  over_current_limit: 30.0,
  tamper_locked: false,
  is_tampered: false,
  wifi_rssi: -68,
  voltage_cutoff_tripped: false,
  bill_cutoff_tripped: false,
  max_voltage_limit: 240,
  min_voltage_limit: 180,
  bill_limit_threshold: 35000
};

export const INITIAL_FLEET_METERS: MeterSummary[] = [
  {
    meter_id: 'MTR-8A24-19F2',
    meter_name: 'My Home (Live Prototype)',
    location: 'Flat 1 - Ground Floor',
    building_id: 'BLD-01',
    user_id: 'usr_9921',
    voltage: 0.0,
    current: 0.0,
    active_power: 0.0,
    power_factor: 0.0,
    frequency: 0.0,
    wallet_balance: 13992,
    prepaid_units_kwh: 87.45,
    tariff_rate: 160.0,
    monthly_budget_naira: 25000,
    monthly_budget_kwh: 365,
    over_current_limit: 30.0,
    energy_today: 1.28,
    energy_month: 92.6,
    grid_status: 'offline',
    device_status: 'online',
    main_supply_connected: true,
    is_tampered: false,
    tamper_locked: false,
    wifi_rssi: -68,
    battery_percentage: 50,
    last_seen: 'Awaiting prototype packet...'
  }
];

export const REGISTERED_RECIPIENTS: RegisteredRecipient[] = [
  {
    meter_id: 'MTR-72AF-2091',
    meter_name: 'Neighbour House',
    owner_name: 'Adebayo T.',
    is_online: true,
    is_saved: true,
    last_used_date: '14 Aug, 7:32 PM'
  },
  {
    meter_id: 'MTR-34BC-9821',
    meter_name: 'Family House',
    owner_name: 'Okafor Residence',
    is_online: true,
    is_saved: true,
    last_used_date: '12 Aug, 4:10 PM'
  },
  {
    meter_id: 'MTR-55EE-3108',
    meter_name: 'Corner Shop',
    owner_name: 'Chidi K.',
    is_online: false,
    is_saved: true,
    last_used_date: '02 Aug, 11:20 AM'
  },
  {
    meter_id: 'MTR-90CA-1123',
    meter_name: 'Office Annex',
    owner_name: 'David W.',
    is_online: true,
    is_saved: false,
    last_used_date: undefined
  }
];

export const INITIAL_SHARING_HISTORY: SharingSession[] = [
  {
    session_id: 'SES-88219-94',
    source_meter_id: 'MTR-8A24-19F2',
    source_meter_name: 'My Home',
    destination_meter_id: 'MTR-72AF-2091',
    destination_meter_name: 'Neighbour House',
    direction: 'sending',
    status: 'completed',
    power_limit_w: 500,
    energy_limit_kwh: 2.0,
    duration_limit_seconds: 3600,
    current_power_w: 0,
    energy_transferred_kwh: 1.42,
    elapsed_seconds: 2880,
    started_at: '14 Aug 2026, 7:32 PM',
    ended_at: '14 Aug 2026, 8:20 PM',
    source_online: true,
    destination_online: true,
    cloud_sync_status: 'live'
  },
  {
    session_id: 'SES-77312-10',
    source_meter_id: 'MTR-34BC-9821',
    source_meter_name: 'Family House',
    destination_meter_id: 'MTR-8A24-19F2',
    destination_meter_name: 'My Home',
    direction: 'receiving',
    status: 'completed',
    power_limit_w: 400,
    energy_limit_kwh: 1.0,
    duration_limit_seconds: 2400,
    current_power_w: 0,
    energy_transferred_kwh: 0.86,
    elapsed_seconds: 1920,
    started_at: '12 Aug 2026, 4:10 PM',
    ended_at: '12 Aug 2026, 4:42 PM',
    source_online: true,
    destination_online: true,
    cloud_sync_status: 'live'
  },
  {
    session_id: 'SES-61109-42',
    source_meter_id: 'MTR-8A24-19F2',
    source_meter_name: 'My Home',
    destination_meter_id: 'MTR-72AF-2091',
    destination_meter_name: 'Neighbour House',
    direction: 'sending',
    status: 'completed',
    power_limit_w: 750,
    energy_limit_kwh: 2.0,
    duration_limit_seconds: 4200,
    current_power_w: 0,
    energy_transferred_kwh: 2.0,
    elapsed_seconds: 4200,
    started_at: '08 Aug 2026, 2:15 PM',
    ended_at: '08 Aug 2026, 3:25 PM',
    source_online: true,
    destination_online: true,
    cloud_sync_status: 'live'
  }
];

export const HOURLY_DATA: HourlyConsumption[] = [
  { hourLabel: '12 AM', kwh: 0.42, cost: 63 },
  { hourLabel: '2 AM', kwh: 0.35, cost: 52.5 },
  { hourLabel: '4 AM', kwh: 0.31, cost: 46.5 },
  { hourLabel: '6 AM', kwh: 0.88, cost: 132 },
  { hourLabel: '8 AM', kwh: 1.45, cost: 217.5 },
  { hourLabel: '10 AM', kwh: 0.95, cost: 142.5 },
  { hourLabel: '12 PM', kwh: 1.22, cost: 183 },
  { hourLabel: '2 PM', kwh: 1.10, cost: 165 },
  { hourLabel: '4 PM', kwh: 1.65, cost: 247.5 },
  { hourLabel: '6 PM', kwh: 2.46, cost: 369 },
  { hourLabel: '8 PM', kwh: 3.12, cost: 468 },
  { hourLabel: '10 PM', kwh: 1.40, cost: 210 }
];

export const WEEKLY_DATA: DailyConsumption[] = [
  { dayLabel: 'Mon', date: '25 Aug', kwh: 8.2, cost: 1230 },
  { dayLabel: 'Tue', date: '26 Aug', kwh: 7.9, cost: 1185 },
  { dayLabel: 'Wed', date: '27 Aug', kwh: 8.5, cost: 1275 },
  { dayLabel: 'Thu', date: '28 Aug', kwh: 7.1, cost: 1065 },
  { dayLabel: 'Fri', date: '29 Aug', kwh: 9.4, cost: 1410 },
  { dayLabel: 'Sat', date: '30 Aug', kwh: 11.2, cost: 1680 },
  { dayLabel: 'Sun', date: '31 Aug (Today)', kwh: 8.42, cost: 1263 }
];

export const MONTHLY_DATA: MonthlyConsumption[] = [
  { monthLabel: 'May', kwh: 198.4, cost: 29760 },
  { monthLabel: 'Jun', kwh: 210.2, cost: 31530 },
  { monthLabel: 'Jul', kwh: 228.0, cost: 34200 },
  { monthLabel: 'Aug (Current)', kwh: 214.6, cost: 32190 }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-wallet-1',
    title: 'Wallet Funded Successfully',
    message: '₦10,000 was added to your Energy Wallet (+66.6 kWh credited).',
    timestamp: '2 hours ago',
    type: 'wallet',
    is_read: false
  },
  {
    id: 'notif-1',
    title: 'Energy Sharing Completed',
    message: '1.42 kWh was successfully shared with Neighbour House.',
    timestamp: '4 hours ago',
    type: 'sharing',
    is_read: false
  },
  {
    id: 'notif-2',
    title: 'Grid Power Restored',
    message: 'Grid power was restored after 14 minutes.',
    timestamp: 'Yesterday at 9:15 PM',
    type: 'restored',
    is_read: true
  },
  {
    id: 'notif-3',
    title: 'High Consumption Alert',
    message: 'Your home peaked at 3.84 kW during dinner time.',
    timestamp: 'Yesterday at 7:45 PM',
    type: 'warning',
    is_read: true
  }
];
