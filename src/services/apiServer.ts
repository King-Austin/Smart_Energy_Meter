import { SharingSession, WalletTransaction } from '../types/meter';
import {
  INITIAL_METER_DATA,
  REGISTERED_RECIPIENTS,
  INITIAL_SHARING_HISTORY,
  HOURLY_DATA,
  WEEKLY_DATA,
  MONTHLY_DATA,
  INITIAL_NOTIFICATIONS,
  INITIAL_WALLET_TRANSACTIONS
} from './mockData';

// Shared In-Memory Backend Store for Vite Live API
export const backendStore = {
  meter: { ...INITIAL_METER_DATA },
  activeSharing: null as SharingSession | null,
  receivingSharing: null as SharingSession | null,
  sharingHistory: [...INITIAL_SHARING_HISTORY],
  recipients: [...REGISTERED_RECIPIENTS],
  notifications: [...INITIAL_NOTIFICATIONS],
  walletTransactions: [...INITIAL_WALLET_TRANSACTIONS] as WalletTransaction[]
};

export function handleApiRequest(req: any, res: any): boolean {
  const url = req.url || '';
  const method = req.method || 'GET';

  // Set standard CORS and JSON headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  // Only handle /api/ routes
  if (!url.startsWith('/api/')) {
    return false;
  }

  res.setHeader('Content-Type', 'application/json');

  const sendJson = (statusCode: number, data: unknown) => {
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
  };

  // Helper to parse JSON body
  const parseBody = (callback: (body: any) => void) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
    });
    req.on('end', () => {
      try {
        const parsed = raw.trim() ? JSON.parse(raw.trim()) : {};
        callback(parsed);
      } catch (e: any) {
        sendJson(400, { error: 'Invalid JSON payload', raw, message: e?.message });
      }
    });
  };

  // 1. Health Check
  if (url === '/api/health') {
    sendJson(200, {
      status: 'online',
      service: 'Meter Cloud Backend API',
      version: '1.0.4',
      activeMeter: backendStore.meter.meter_id,
      timestamp: new Date().toISOString()
    });
    return true;
  }

  // 2. GET /api/meters/live or /api/meters/:id/live
  if (url.match(/^\/api\/meters\/[^/]+\/live$/) || url === '/api/meters/live') {
    sendJson(200, backendStore.meter);
    return true;
  }

  // 3. POST /api/meters/:id/telemetry (FOR HARDWARE ESP32 / GATEWAY INGESTION)
  if (url.match(/^\/api\/meters\/[^/]+\/telemetry$/) && method === 'POST') {
    parseBody(body => {
      if (body.voltage !== undefined) backendStore.meter.voltage = Number(body.voltage);
      if (body.current !== undefined) backendStore.meter.current = Number(body.current);
      if (body.active_power !== undefined) backendStore.meter.active_power = Number(body.active_power);
      if (body.power_factor !== undefined) backendStore.meter.power_factor = Number(body.power_factor);
      if (body.frequency !== undefined) backendStore.meter.frequency = Number(body.frequency);
      if (body.grid_status !== undefined) backendStore.meter.grid_status = body.grid_status;
      if (body.battery_percentage !== undefined) backendStore.meter.battery_percentage = Number(body.battery_percentage);
      if (body.battery_status !== undefined) backendStore.meter.battery_status = body.battery_status;
      if (body.energy_today !== undefined) backendStore.meter.energy_today = Number(body.energy_today);

      backendStore.meter.last_seen = 'Just now';
      backendStore.meter.device_status = 'online';

      sendJson(200, {
        success: true,
        message: 'Telemetry ingested successfully from hardware',
        meter_id: backendStore.meter.meter_id,
        current_readings: {
          power_kw: backendStore.meter.active_power,
          voltage_v: backendStore.meter.voltage,
          current_a: backendStore.meter.current
        }
      });
    });
    return true;
  }

  // 4. Wallet Endpoints: GET /api/wallet & POST /api/wallet/fund
  if (url === '/api/wallet' && method === 'GET') {
    sendJson(200, {
      wallet_balance: backendStore.meter.wallet_balance,
      prepaid_units_kwh: backendStore.meter.prepaid_units_kwh,
      estimated_days_remaining: backendStore.meter.estimated_days_remaining,
      tariff_rate: backendStore.meter.tariff_rate,
      transactions: backendStore.walletTransactions
    });
    return true;
  }

  if (url === '/api/wallet/fund' && method === 'POST') {
    parseBody(body => {
      const amount = Number(body.amount) || 5000;
      const methodStr = body.method || 'card';
      const units = Number((amount / backendStore.meter.tariff_rate).toFixed(1));
      const token = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTx: WalletTransaction = {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'funding',
        title: 'Wallet Funded via API',
        description: `Recharge via ${methodStr.toUpperCase()} (+${units} kWh)`,
        amount_currency: amount,
        units_kwh: units,
        timestamp: 'Just now',
        status: 'successful',
        token_number: token
      };

      backendStore.meter.wallet_balance += amount;
      backendStore.meter.prepaid_units_kwh = Number((backendStore.meter.prepaid_units_kwh + units).toFixed(1));
      backendStore.meter.estimated_days_remaining = Math.max(1, Math.round(backendStore.meter.prepaid_units_kwh / 8.0));
      backendStore.walletTransactions.unshift(newTx);

      sendJson(200, {
        success: true,
        message: 'Wallet funded successfully',
        credited_units_kwh: units,
        new_balance: backendStore.meter.wallet_balance,
        token_number: token,
        transaction: newTx
      });
    });
    return true;
  }

  // 5. POST /api/meters/:id/relay (Whole-House Supply Control)
  if (url.match(/^\/api\/meters\/[^/]+\/relay$/) && method === 'POST') {
    parseBody(body => {
      const connected = body.connected !== undefined ? Boolean(body.connected) : !backendStore.meter.main_supply_connected;
      backendStore.meter.main_supply_connected = connected;
      backendStore.meter.active_power = connected ? 2.46 : 0;

      sendJson(200, {
        success: true,
        main_supply_connected: connected,
        message: connected ? 'House supply relay closed (ON)' : 'House supply relay opened (DISCONNECTED)'
      });
    });
    return true;
  }

  // 6. GET /api/meters/:id/energy
  if (url.match(/^\/api\/meters\/[^/]+\/energy/) || url.startsWith('/api/energy')) {
    sendJson(200, {
      hourly: HOURLY_DATA,
      weekly: WEEKLY_DATA,
      monthly: MONTHLY_DATA,
      summary: {
        today_kwh: backendStore.meter.energy_today,
        estimated_cost_today: backendStore.meter.estimated_cost_today,
        week_kwh: backendStore.meter.energy_week,
        month_kwh: backendStore.meter.energy_month,
        projected_month_kwh: backendStore.meter.projected_month
      }
    });
    return true;
  }

  // 7. GET /api/recipients
  if (url === '/api/recipients') {
    sendJson(200, backendStore.recipients);
    return true;
  }

  // 8. GET /api/sharing/active
  if (url === '/api/sharing/active') {
    sendJson(200, {
      activeSession: backendStore.activeSharing,
      receivingSession: backendStore.receivingSharing
    });
    return true;
  }

  // 9. POST /api/sharing/start
  if (url === '/api/sharing/start' && method === 'POST') {
    parseBody(body => {
      const recipient = backendStore.recipients.find(r => r.meter_id === body.recipient_id || r.meter_name === body.recipient_name);
      if (!recipient) {
        return sendJson(404, { error: 'Recipient meter not found on cloud network' });
      }
      if (!recipient.is_online) {
        return sendJson(400, { error: `${recipient.meter_name} is currently offline` });
      }

      const session: SharingSession = {
        session_id: `SES-${Math.floor(10000 + Math.random() * 90000)}`,
        source_meter_id: backendStore.meter.meter_id,
        source_meter_name: backendStore.meter.meter_name,
        destination_meter_id: recipient.meter_id,
        destination_meter_name: recipient.meter_name,
        direction: 'sending',
        status: 'active',
        power_limit_w: Number(body.power_limit_w) || 500,
        energy_limit_kwh: Number(body.energy_limit_kwh) || 2.0,
        duration_limit_seconds: (Number(body.duration_minutes) || 60) * 60,
        current_power_w: Number(body.power_limit_w) || 500,
        energy_transferred_kwh: 0,
        elapsed_seconds: 0,
        started_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source_online: true,
        destination_online: true,
        cloud_sync_status: 'live'
      };

      backendStore.activeSharing = session;
      sendJson(201, { success: true, session });
    });
    return true;
  }

  // 10. POST /api/sharing/stop
  if (url === '/api/sharing/stop' && method === 'POST') {
    if (backendStore.activeSharing) {
      const ended: SharingSession = {
        ...backendStore.activeSharing,
        status: 'completed',
        ended_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      backendStore.sharingHistory.unshift(ended);
      backendStore.activeSharing = null;
      sendJson(200, { success: true, session: ended });
    } else {
      sendJson(400, { error: 'No active sharing session to stop' });
    }
    return true;
  }

  // 11. GET /api/sharing/history
  if (url === '/api/sharing/history') {
    sendJson(200, backendStore.sharingHistory);
    return true;
  }

  // 12. GET /api/notifications
  if (url === '/api/notifications') {
    sendJson(200, backendStore.notifications);
    return true;
  }

  // Fallback 404 for unhandled /api/ route
  sendJson(404, { error: `Endpoint ${method} ${url} not found` });
  return true;
}
