# Root Cause Investigation & Remediation Plan: Relay Actuation & Cloud Synchronization Failure

## Overview
A comprehensive investigation was conducted to determine why the physical relay did not trip when the Max Voltage slider was lowered to 207V, and why cloud web dashboard commands do not actuate the ESP32. 

The investigation discovered **two primary root causes**:
1. **PostgREST RPC Overload Conflict (PGRST203)**: Four conflicting overloaded signatures of `public.record_telemetry` exist in PostgreSQL. PostgREST rejects all incoming ESP32 telemetry with `HTTP 400 PGRST203: Could not choose the best candidate function`. The ESP32 has been completely unable to talk to Supabase since `00:49:50 UTC`.
2. **Hardcoded Overvoltage Limit on ESP32 Edge**: The ESP32 sketch has a hardcoded `#define OVERVOLTAGE_LIMIT 250.0f` in `config.h`, and does not update its local trip threshold dynamically from the cloud slider.

## Project Type
**FULL-STACK EMBEDDED & CLOUD (PostgreSQL / Supabase RPC + ESP32 C++ Firmware + React UI)**

---

## Evidence & Diagnostics

### Diagnostic 1: PostgreSQL Function Overloads
Querying `pg_proc` revealed 4 conflicting overloads in `public.record_telemetry`:
```sql
1. record_telemetry(p_meter_id text, p_voltage numeric, p_current numeric, p_active_power numeric, p_power_factor numeric, p_frequency numeric, p_is_tampered boolean, p_is_relay_on boolean)
2. record_telemetry(p_meter_id text, p_voltage numeric, p_current numeric, p_active_power numeric, p_power_factor numeric, p_frequency numeric, p_energy_increment numeric, p_is_tampered boolean, p_battery_percentage integer)
3. record_telemetry(p_meter_id text, p_voltage numeric, p_current numeric, p_active_power numeric, p_power_factor numeric, p_frequency numeric, p_energy_increment numeric, p_is_tampered boolean, p_battery_percentage integer, p_wifi_rssi integer, p_free_heap integer, p_uptime_sec bigint)
4. record_telemetry(p_meter_id text, p_voltage numeric, p_current numeric, p_active_power numeric, p_power_factor numeric, p_frequency numeric, p_energy_increment numeric, p_is_tampered boolean, p_battery_percentage integer, p_wifi_rssi integer, p_free_heap integer, p_uptime_sec bigint, p_is_relay_on boolean)
```

### Diagnostic 2: Live HTTP Request Simulation
Executing an HTTP POST from Node.js with the exact ESP32 payload against `https://kmosslvdjdhrjgvitctr.supabase.co/rest/v1/rpc/record_telemetry`:
```json
{
  "code": "PGRST203",
  "details": null,
  "hint": "Try renaming the parameters or the function itself in the database so function overloading can be resolved",
  "message": "Could not choose the best candidate function between: public.record_telemetry(...) and public.record_telemetry(...)"
}
```
**Conclusion**: Because the ESP32 received HTTP 400 on every single request, `sync.success` evaluated to `false`. The ESP32 discarded the response, never updated its state, never opened the contactor, and never acknowledged changes back to the UI.

### Diagnostic 3: Hardware Edge vs Cloud Threshold
In `Hardware.ino`:
```cpp
if (meter.isRelayOn && currentReadings.voltage >= OVERVOLTAGE_LIMIT)
```
`OVERVOLTAGE_LIMIT` is fixed at `250.0f`. The ESP32 does not receive or store the user's custom 207V setting locally.

---

## Remediation Tasks

### Task 1: Drop All Conflicting RPC Overloads & Create Single Canonical Function
- **Action**: Execute `DROP FUNCTION` for all 4 overloaded versions of `record_telemetry`.
- **Create**: A single canonical `record_telemetry` function with clean parameters.
- **Return Payload**:
  - `main_supply_connected`: Boolean
  - `voltage_cutoff_tripped`: Boolean
  - `max_voltage_limit`: Numeric (dynamic from cloud slider)
  - `min_voltage_limit`: Numeric
  - `tamper_locked`: Boolean
  - `hardware_relay_ack`: Boolean

### Task 2: Permissive Security Configuration for Demonstration Mode
- Explicitly grant full permissions to `anon, authenticated, service_role` on all public tables and sequences.
- Disable Row Level Security (RLS) on `meters`, `telemetry_logs`, `tamper_events`, etc., so demonstration requests, guest dashboards, and automated edge heartbeats are 100% immune to authorization blocks or token expiry.

### Task 3: In-Memory Offline Telemetry Queue & Auto-Flush on ESP32
- **Data Structure**: Circular RAM buffer of 64 telemetry snapshots (`OfflineTelemetryRecord`) on the ESP32 (~2 KB heap overhead).
- **Offline Behavior**:
  - When `WiFi.status() != WL_CONNECTED`, the 2-second telemetry loop buffers PZEM readings into RAM.
  - LCD displays `[OFFLINE Q: <count>]` so the user knows local buffering is active.
- **Reconnection Flush**:
  - When Wi-Fi reconnects, the ESP32 sequentially flushes the queued records to Supabase `telemetry_logs`.
  - Clears buffer and transitions back to live real-time sync.

### Task 4: Wi-Fi Offline Status LED Indication (GPIO 27)
- **Connected**: `LED_STATUS_PIN` (GPIO 27) shines SOLID ON.
- **Disconnected / Offline**: `LED_STATUS_PIN` executes a rapid 200ms non-blocking blink cadence (Strobe Warning) so that the user and onlookers can immediately see that Wi-Fi is disconnected.

### Task 5: Dynamic Voltage Cutoff on ESP32 Firmware
- In `Hardware/src/meter_state.h`: Add `float maxVoltageLimit = 240.0f;` and `float minVoltageLimit = 180.0f;`.
- In `Hardware/src/supabase_client.cpp`: Parse `max_voltage_limit` and `min_voltage_limit` from the response.
- In `Hardware/Hardware.ino`:
  ```cpp
  if (meter.isRelayOn && currentReadings.voltage >= meter.maxVoltageLimit) {
    Serial.printf("\n⚡ [OVERVOLTAGE] %.1fV exceeded dynamic limit (%.0fV)! Tripping Contactor!\n",
                  currentReadings.voltage, meter.maxVoltageLimit);
    setRelay(false);
    saveNVS();
  }
  ```
- Set `RELAY_ACTIVE_LEVEL HIGH` and `RELAY_INACTIVE_LEVEL LOW` in `Hardware/src/config.h` so that `setRelay(false)` drives GPIO 13 to 0.0V (LOW), de-energizing the contactor coil and turning off the bulb.

---

## Verification Checklist
- [ ] Direct test call to `rest/v1/rpc/record_telemetry` returns `HTTP 200 OK` with zero `PGRST203` errors.
- [ ] RLS disabled and permissions verified across all public tables.
- [ ] ESP32 sends live telemetry and receives `[CLOUD SYNC 200 OK]`.
- [ ] `last_seen` in Supabase `meters` updates in real-time.
- [ ] Lowering Max Voltage slider to 207V on web immediately trips contactor on ESP32 (bulb turns off).
- [ ] Web dashboard shows `ESP32 ACK: D13 LOW (OPEN)`.
- [ ] When Wi-Fi is disconnected:
  - LED 2 (GPIO 27) rapid-blinks.
  - Telemetry accumulates in offline memory queue.
  - On Wi-Fi reconnect, buffered records upload to cloud automatically.
