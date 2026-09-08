export type GridStatus = 'online' | 'offline' | 'restored';
export type DeviceStatus = 'online' | 'offline' | 'reconnecting' | 'weak';
export type BatteryStatus = 'charging' | 'battery' | 'low';
export type SharingDirection = 'sending' | 'receiving';

export type SharingStatus =
  | 'idle'
  | 'validating'
  | 'starting'
  | 'active'
  | 'receiving'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'offline'
  | 'connection_lost'
  | 'energy_limit_reached'
  | 'time_limit_reached'
  | 'protection_stopped';

export type CloudSyncStatus = 'live' | 'syncing' | 'lost' | 'ready';

export interface WalletTransaction {
  id: string;
  type: 'funding' | 'energy_purchase' | 'shared_sent' | 'shared_received' | 'auto_recharge';
  title: string;
  description: string;
  amount_currency: number;
  units_kwh?: number;
  timestamp: string;
  status: 'successful' | 'pending' | 'failed';
  token_number?: string; // 20-digit STS meter token
}

export interface MeterTelemetry {
  meter_id: string;
  meter_name: string;
  user_id: string;
  voltage: number; // V (e.g. 231)
  current: number; // A (e.g. 10.7)
  active_power: number; // kW (e.g. 2.46)
  power_factor: number; // (e.g. 0.96)
  frequency: number; // Hz (e.g. 50.0)
  apparent_power: number; // kVA
  reactive_power: number; // kVAR
  
  // Wallet & Prepaid Credits
  wallet_balance: number; // e.g. 14,500 (Currency)
  prepaid_units_kwh: number; // e.g. 96.6 kWh remaining
  estimated_days_remaining: number; // e.g. 12 days
  auto_topup_enabled: boolean;
  auto_topup_threshold: number; // e.g. 2,000

  energy_today: number; // kWh (e.g. 8.42)
  energy_yesterday: number; // kWh (e.g. 9.56)
  energy_week: number; // kWh (e.g. 54.8)
  energy_month: number; // kWh (e.g. 214.6)
  projected_month: number; // kWh (e.g. 246)
  
  estimated_cost_today: number; // e.g. 1263
  estimated_bill_month: number; // e.g. 32190
  projected_bill_month: number; // e.g. 36900
  
  grid_status: GridStatus;
  device_status: DeviceStatus;
  connection_quality: 'good' | 'fair' | 'poor' | 'offline';
  
  battery_percentage: number; // % (e.g. 82)
  battery_status: BatteryStatus;
  
  main_supply_connected: boolean;
  is_tampered?: boolean;
  last_seen: string;
  firmware_version: string;
  
  tariff_rate: number; // ₦/kWh (e.g. 68.5)
  currency_symbol: string; // ₦, $, €, £
  currency_code: string; // NGN, USD, EUR, GBP

  // Real Hardware Protective Cutoff Thresholds
  max_voltage_limit: number; // V (e.g. 250) - Trips contactor if exceeded
  min_voltage_limit: number; // V (e.g. 180) - Brownout protection
  bill_limit_threshold: number; // ₦ (e.g. 35,000) - Cutoff if monthly spend exceeded
  voltage_cutoff_tripped: boolean;
  bill_cutoff_tripped: boolean;
}

export interface SharingSession {
  session_id: string;
  source_meter_id: string;
  source_meter_name: string;
  destination_meter_id: string;
  destination_meter_name: string;
  direction: SharingDirection;
  status: SharingStatus;
  
  energy_limit_kwh: number; // e.g. 2.0 (Energy Cap)
  power_limit_w?: number; // Optional building load
  duration_limit_seconds?: number; // Optional time cap
  
  current_power_w: number; // Realtime live draw (W)
  energy_transferred_kwh: number; // e.g. 0.74
  elapsed_seconds: number; // e.g. 1920
  
  started_at: string;
  ended_at?: string;
  
  source_online: boolean;
  destination_online: boolean;
  cloud_sync_status: CloudSyncStatus;
}

export interface RegisteredRecipient {
  meter_id: string;
  meter_name: string;
  owner_name: string;
  is_online: boolean;
  is_saved: boolean;
  last_used_date?: string;
}

export interface HourlyConsumption {
  hourLabel: string;
  kwh: number;
  cost: number;
}

export interface DailyConsumption {
  dayLabel: string;
  date: string;
  kwh: number;
  cost: number;
}

export interface MonthlyConsumption {
  monthLabel: string;
  kwh: number;
  cost: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'outage' | 'restored' | 'warning' | 'sharing' | 'system' | 'offline' | 'wallet';
  is_read: boolean;
}

export type ActiveTab = 'home' | 'energy' | 'wallet' | 'share' | 'settings' | 'device' | 'auth';
export type EnergyPeriod = 'today' | 'week' | 'month';
