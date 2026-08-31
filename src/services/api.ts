import { MeterTelemetry, SharingSession, RegisteredRecipient, NotificationItem } from '../types/meter';

export interface TelemetryPayload {
  voltage?: number;
  current?: number;
  active_power?: number;
  power_factor?: number;
  frequency?: number;
  grid_status?: 'online' | 'offline';
  battery_percentage?: number;
  battery_status?: 'charging' | 'battery' | 'low';
  energy_today?: number;
}

export class MeterApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  // 1. Health check & Ping
  async ping(): Promise<{ success: boolean; latencyMs: number; data?: any; error?: string }> {
    const start = performance.now();
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return { success: true, latencyMs, data };
    } catch (err: any) {
      return { success: false, latencyMs: 0, error: err.message || 'Unable to connect to endpoint' };
    }
  }

  // 2. Fetch Live Telemetry
  async getLiveTelemetry(meterId: string = 'MTR-8A24-19F2'): Promise<MeterTelemetry> {
    const res = await fetch(`${this.baseUrl}/meters/${meterId}/live`);
    if (!res.ok) throw new Error(`Failed to fetch live telemetry: ${res.status}`);
    return res.json();
  }

  // 3. Post Telemetry from Hardware (e.g. ESP32)
  async postTelemetry(meterId: string, payload: TelemetryPayload) {
    const res = await fetch(`${this.baseUrl}/meters/${meterId}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to ingest telemetry: ${res.status}`);
    return res.json();
  }

  // 4. Toggle Whole-House Supply Relay
  async toggleSupplyRelay(meterId: string, connected: boolean) {
    const res = await fetch(`${this.baseUrl}/meters/${meterId}/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected })
    });
    if (!res.ok) throw new Error(`Failed to switch relay: ${res.status}`);
    return res.json();
  }

  // 5. Get Registered Cloud Recipients
  async getRecipients(): Promise<RegisteredRecipient[]> {
    const res = await fetch(`${this.baseUrl}/recipients`);
    if (!res.ok) throw new Error(`Failed to fetch recipients: ${res.status}`);
    return res.json();
  }

  // 6. Start Cloud Sharing Session
  async startSharing(
    recipientId: string,
    powerLimitW: number,
    energyLimitKwh: number,
    durationMinutes: number
  ): Promise<{ success: boolean; session?: SharingSession; error?: string }> {
    const res = await fetch(`${this.baseUrl}/sharing/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id: recipientId,
        power_limit_w: powerLimitW,
        energy_limit_kwh: energyLimitKwh,
        duration_minutes: durationMinutes
      })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to start sharing' };
    return { success: true, session: data.session };
  }

  // 7. Stop Cloud Sharing Session
  async stopSharing(): Promise<{ success: boolean; session?: SharingSession }> {
    const res = await fetch(`${this.baseUrl}/sharing/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to stop sharing');
    return res.json();
  }

  // 8. Get Active Sharing Session
  async getActiveSharing(): Promise<{ activeSession: SharingSession | null; receivingSession: SharingSession | null }> {
    const res = await fetch(`${this.baseUrl}/sharing/active`);
    if (!res.ok) throw new Error('Failed to fetch active session');
    return res.json();
  }

  // 9. Get Sharing History
  async getSharingHistory(): Promise<SharingSession[]> {
    const res = await fetch(`${this.baseUrl}/sharing/history`);
    if (!res.ok) throw new Error('Failed to fetch sharing history');
    return res.json();
  }

  // 10. Get Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${this.baseUrl}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  }
}

export const apiService = new MeterApiClient('/api');
