/**
 * =====================================================================================
 *  VOLTRIX ESP32 MONITORING SIMULATOR
 *  Sends continuous 5-second interval mock telemetry packets to Supabase RPC endpoint.
 *
 *  Usage:
 *    node Hardware/simulate_monitoring.js
 *    node Hardware/simulate_monitoring.js --iterations 10
 * =====================================================================================
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmosslvdjdhrjgvitctr.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_kqmfZWv3kcKV5v4QMvlZkQ_x8ohW0Oj';
const METER_ID = process.env.DEFAULT_METER_ID || 'MTR-8A24-19F2';
const INTERVAL_MS = parseInt(process.env.TELEMETRY_INTERVAL_MS || '5000', 10);

// Parse CLI argument --iterations
const args = process.argv.slice(2);
let maxIterations = Infinity;
const iterIndex = args.indexOf('--iterations');
if (iterIndex !== -1 && args[iterIndex + 1]) {
  maxIterations = parseInt(args[iterIndex + 1], 10);
}

console.log('\n' + '='.repeat(68));
console.log('  ⚡ VOLTRIX SMART ENERGY METER - 5-SECOND MONITORING SIMULATOR');
console.log('='.repeat(68));
console.log(`  Target Supabase : ${SUPABASE_URL}`);
console.log(`  Meter ID        : ${METER_ID}`);
console.log(`  Update Interval : ${INTERVAL_MS / 1000}s`);
console.log(`  Max Cycles      : ${maxIterations === Infinity ? 'Continuous (Ctrl+C to stop)' : maxIterations}`);
console.log('='.repeat(68) + '\n');

let cycleCount = 0;
let baseVoltage = 231.2;
let baseCurrent = 7.8;
let relayState = true;

function generateMockReadings() {
  // Simulates AC grid noise and residential load fluctuation
  const vDelta = (Math.random() * 5 - 2.5); // +/- 2.5V
  const iDelta = (Math.random() * 2.4 - 1.2); // +/- 1.2A
  
  const voltage = parseFloat((baseVoltage + vDelta).toFixed(1));
  const current = parseFloat(Math.max(2.0, baseCurrent + iDelta).toFixed(2));
  const powerFactor = 0.96;
  const frequency = 50.0;
  const activePower = parseFloat(((voltage * current * powerFactor) / 1000).toFixed(2));

  return { voltage, current, activePower, powerFactor, frequency };
}

async function sendTelemetry() {
  cycleCount++;
  const readings = generateMockReadings();
  const timestamp = new Date().toLocaleTimeString();

  const payload = {
    p_meter_id: METER_ID,
    p_voltage: readings.voltage,
    p_current: readings.current,
    p_active_power: readings.activePower,
    p_power_factor: readings.powerFactor,
    p_frequency: readings.frequency,
    p_is_tampered: false,
    p_is_relay_on: relayState
  };

  try {
    const startTime = Date.now();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_telemetry`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const elapsedMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[${timestamp}] [Cycle #${cycleCount}] ❌ HTTP ${res.status}: ${errText}`);
      return;
    }

    const data = await res.json();
    console.log(
      `[${timestamp}] [Cycle #${cycleCount}] ✅ HTTP 200 (${elapsedMs}ms) | ` +
      `V: ${readings.voltage.toFixed(1)}V | I: ${readings.current.toFixed(2)}A | ` +
      `P: ${readings.activePower.toFixed(2)}kW | Relay: ${data.main_supply_connected ? 'ON' : 'OFF'} | ` +
      `Units: ${data.prepaid_units_kwh} kWh`
    );

    relayState = data.main_supply_connected;
  } catch (err) {
    console.error(`[${timestamp}] [Cycle #${cycleCount}] ❌ Network error:`, err.message);
  }

  if (cycleCount >= maxIterations) {
    console.log(`\n🎉 Completed ${cycleCount} telemetry monitoring cycles.`);
    if (timer) clearInterval(timer);
    return;
  }
}

// Send first immediately, then interval
sendTelemetry();
const timer = setInterval(sendTelemetry, INTERVAL_MS);

