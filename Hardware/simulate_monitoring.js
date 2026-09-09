/**
 * =====================================================================================
 *  VOLTRIX ESP32 & FLEET MONITORING SIMULATOR (PZEM-004T + Multi-Meter)
 *  Sends continuous 3-second interval telemetry packets to Supabase RPC endpoint.
 *
 *  Usage:
 *    node Hardware/simulate_monitoring.js
 *    node Hardware/simulate_monitoring.js --fleet
 *    node Hardware/simulate_monitoring.js --iterations 5
 *    node Hardware/simulate_monitoring.js --tamper (triggers SS-5GL lid tamper)
 *    node Hardware/simulate_monitoring.js --blackout (simulates grid loss on battery)
 * =====================================================================================
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmosslvdjdhrjgvitctr.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_kqmfZWv3kcKV5v4QMvlZkQ_x8ohW0Oj';
const DEFAULT_METER_ID = process.env.DEFAULT_METER_ID || 'MTR-8A24-19F2';
const INTERVAL_MS = parseInt(process.env.TELEMETRY_INTERVAL_MS || '3000', 10);

const FLEET_METERS = [
  { id: 'MTR-8A24-19F2', name: 'Main Residence', baseV: 231.4, baseI: 6.8, pf: 0.98 },
  { id: 'MTR-B310-44A1', name: 'Apartment 2B', baseV: 229.8, baseI: 3.4, pf: 0.97 },
  { id: 'MTR-C902-88F3', name: 'Commercial Storefront', baseV: 232.0, baseI: 11.2, pf: 0.98 }
];

// Parse CLI arguments
const args = process.argv.slice(2);
let maxIterations = Infinity;
const iterIndex = args.indexOf('--iterations');
if (iterIndex !== -1 && args[iterIndex + 1]) {
  maxIterations = parseInt(args[iterIndex + 1], 10);
}

const isFleetMode = args.includes('--fleet');
const simulateTamper = args.includes('--tamper');
const simulateBlackout = args.includes('--blackout');

console.log('\n' + '='.repeat(72));
console.log('  ⚡ VOLTRIX SMART ENERGY METER - PZEM TELEMETRY & FLEET SIMULATOR');
console.log('='.repeat(72));
console.log(`  Target Supabase : ${SUPABASE_URL}`);
console.log(`  Operating Mode  : ${isFleetMode ? 'Fleet Broadcast (3 Submeters)' : 'Single Meter (' + DEFAULT_METER_ID + ')'}`);
console.log(`  Update Interval : ${INTERVAL_MS / 1000}s`);
console.log(`  Simulate Tamper : ${simulateTamper ? 'YES (SS-5GL Lid Trigger on Cycle 2)' : 'NO'}`);
console.log(`  Simulate Outage : ${simulateBlackout ? 'YES (0V Grid Blackout on Cycle 2)' : 'NO'}`);
console.log(`  Max Cycles      : ${maxIterations === Infinity ? 'Continuous (Ctrl+C to stop)' : maxIterations}`);
console.log('='.repeat(72) + '\n');

let cycleCount = 0;

function generatePzemReadings(meterProfile, isTamperedNow, isBlackoutNow) {
  if (isBlackoutNow) {
    return {
      voltage: 0.0,
      current: 0.0,
      activePower: 0.0,
      powerFactor: 1.0,
      frequency: 0.0,
      energyIncrement: 0.0,
      isTampered: isTamperedNow
    };
  }

  const vDelta = (Math.random() * 4 - 2.0); // +/- 2V
  const iDelta = (Math.random() * 1.6 - 0.8); // +/- 0.8A
  
  const voltage = parseFloat((meterProfile.baseV + vDelta).toFixed(1));
  const current = parseFloat(Math.max(0.5, meterProfile.baseI + iDelta).toFixed(2));
  const powerFactor = meterProfile.pf;
  const frequency = 50.0;
  const activePower = parseFloat(((voltage * current * powerFactor) / 1000).toFixed(2));
  const energyIncrement = parseFloat(((activePower * (INTERVAL_MS / 3600000))).toFixed(4));

  return {
    voltage,
    current,
    activePower,
    powerFactor,
    frequency,
    energyIncrement,
    isTampered: isTamperedNow
  };
}

async function sendPacketForMeter(meterProfile) {
  const isTamperedNow = simulateTamper && cycleCount >= 2;
  const isBlackoutNow = simulateBlackout && cycleCount >= 2;

  const readings = generatePzemReadings(meterProfile, isTamperedNow, isBlackoutNow);
  const timestamp = new Date().toLocaleTimeString();

  const payload = {
    p_meter_id: meterProfile.id,
    p_voltage: readings.voltage,
    p_current: readings.current,
    p_active_power: readings.activePower,
    p_power_factor: readings.powerFactor,
    p_frequency: readings.frequency,
    p_energy_increment: readings.energyIncrement,
    p_is_tampered: readings.isTampered,
    p_battery_percentage: 82,
    p_wifi_rssi: -65 + Math.floor(Math.random() * 6),
    p_free_heap: 185420 - Math.floor(Math.random() * 500),
    p_uptime_sec: cycleCount * 3
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
      console.error(`[${timestamp}] [${meterProfile.id}] ❌ HTTP ${res.status}: ${errText}`);
      return;
    }

    const data = await res.json();
    console.log(
      `[${timestamp}] [${meterProfile.id} - ${meterProfile.name}] ✅ HTTP 200 (${elapsedMs}ms) | ` +
      `V: ${readings.voltage.toFixed(1)}V | I: ${readings.current.toFixed(2)}A | ` +
      `P: ${readings.activePower.toFixed(2)}kW | Relay: ${data.main_supply_connected ? 'ON' : 'OFF'} | ` +
      `Tamper: ${data.tamper_locked ? 'LOCKED' : 'NORMAL'}`
    );
  } catch (err) {
    console.error(`[${timestamp}] [${meterProfile.id}] ❌ Network error:`, err.message);
  }
}

async function runCycle() {
  cycleCount++;
  console.log(`\n--- Cycle #${cycleCount} ---`);

  if (isFleetMode) {
    for (const meter of FLEET_METERS) {
      await sendPacketForMeter(meter);
    }
  } else {
    const defaultMeter = FLEET_METERS.find(m => m.id === DEFAULT_METER_ID) || FLEET_METERS[0];
    await sendPacketForMeter(defaultMeter);
  }

  if (cycleCount >= maxIterations) {
    console.log(`\n🏁 Completed ${maxIterations} simulation cycle(s).`);
    process.exit(0);
  }
}

// Initial cycle & interval
runCycle();
setInterval(runCycle, INTERVAL_MS);
