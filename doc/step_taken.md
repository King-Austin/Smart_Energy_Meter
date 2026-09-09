# Voltrix Smart Energy Submeter - Integration & Implementation Steps

> **Project**: Voltrix IoT Smart Energy Submeter  
> **Repository**: `King-Austin/Smart_Energy_Meter`  
> **Active Branch**: `feat/software-upgrade-fleet-admin`  
> **Database / Backend**: Supabase Cloud (`kmosslvdjdhrjgvitctr`)  
> **Status**: **Stage 1 (Software & Web Application) COMPLETE & VERIFIED** | **Stage 2 (Hardware Coupling) SCHEDULED FOR TOMORROW**  
> **Date**: September 9, 2026  

---

## 📌 Executive Summary

This document serves as the master record of all steps executed across each phase of the Voltrix Smart Energy Submeter upgrade. Following the user's explicit directive, the implementation was decoupled into two phases:

1. **Stage 1 (Software-Only)**: Full database schema upgrades, security-hardened RPC stored procedures, TypeScript type models, reactive fleet context, consumer telemetry UI (PZEM-004T metrics), Nigerian Naira (₦/kWh) tariff conversion, 50%/80%/90%/100% budget milestone alerts, run-rate month-end predictions, SS-5GL lid tamper interlock with Admin PIN unlocking (`1234`), grid blackout forensics, centralized multi-meter fleet admin portal, Gemini 1.5 Flash energy assistant, and a multi-meter software simulator.
2. **Stage 2 (Physical Hardware Coupling - Tomorrow)**: Embedded C++ firmware modifications in `Hardware/` (`Hardware.ino`, `sensors.cpp`, `tamper.cpp`, `offline_buffer.cpp`) are deliberately kept **untouched** until the user physically wires and couples the physical enclosure, PZEM-004T module, SS-5GL switch, contactor relay, and battery backup tomorrow.

---

## 🏢 Phase 1: Supabase Cloud Database & Security Architecture (Completed & Live)

### 1.1 Migration Executed
- **File**: [`supabase/migrations/20260909000000_submeter_upgrade.sql`](file:///c:/Users/kingaustin/Downloads/meter_project/supabase/migrations/20260909000000_submeter_upgrade.sql)
- **Status**: Applied directly to remote Supabase project `kmosslvdjdhrjgvitctr` and verified with live SQL queries.

### 1.2 Database Schema Enhancements
1. **`meters` Table**:
   - Extended with multi-meter fleet metadata: `name`, `location`, `building_id`, `tariff_rate` (default `₦85.50`/kWh), `monthly_budget_kwh`, `monthly_budget_naira`, `budget_alert_tiers` (JSON array: `[50, 80, 90, 100]`), `relay_state`, `tamper_locked`, `tamper_last_tripped_at`, `wifi_rssi`, `battery_mv`, and `free_heap_bytes`.
2. **`tamper_events` Table**:
   - Records every physical enclosure breach detected by the SS-5GL micro limit switch.
   - Fields: `meter_id`, `event_type` (`lid_opened`), `severity` (`CRITICAL`), `details`, `relay_interlock_tripped`, `cleared_at`, `cleared_by_admin_pin`.
3. **`outage_logs` Table**:
   - Tracks grid blackout events when PZEM voltage reads 0V while ESP32 is sustained by 18650 Li-ion battery.
   - Fields: `meter_id`, `outage_start`, `outage_end`, `duration_seconds`, `battery_voltage_mv`.
4. **`telemetry` Table**:
   - Receives high-speed digital True-RMS telemetry from PZEM-004T v3.0: `voltage` (V), `current` (A), `active_power` (kW), `energy_total` (kWh), `frequency` (Hz), `power_factor`, `relay_state`, `is_tampered`.

### 1.3 Security RPC Stored Procedures
All critical actuator controls and configuration updates are secured via PostgreSQL RPC functions:
- `record_telemetry(...)`: Real-time ingestion of PZEM telemetry. Automatically verifies tamper state and updates meter summary.
- `batch_sync_telemetry(...)`: Bulk ingestion endpoint for the LittleFS offline buffer (draining buffered readings when Wi-Fi recovers).
- `admin_set_relay(p_meter_id, p_relay_state, p_admin_pin)`: Controls the contactor relay. Enforces Admin PIN `1234`. If the meter has an active tamper lock (`tamper_locked = true`), the relay **cannot** be enabled until the tamper is cleared.
- `admin_clear_tamper(p_meter_id, p_admin_pin)`: Clears the tamper lock, logs the admin resolution timestamp, and restores power to the contactor relay.
- `admin_update_meter_config(p_meter_id, p_tariff_rate, p_monthly_budget_kwh, p_overcurrent_limit, p_admin_pin)`: Updates individual meter parameters.
- `admin_bulk_set_tariff(p_meter_ids, p_new_tariff, p_admin_pin)`: Bulk-updates tariffs across all or selected submeters.

### 1.4 Active Fleet Meters Initialized
Three operational submeters were seeded into the live database:
1. `MTR-8A24-19F2`: Main Residence (Tariff: ₦85.50/kWh, Budget: 250 kWh / ₦21,375)
2. `MTR-B310-44A1`: Apartment 2B (Tariff: ₦85.50/kWh, Budget: 180 kWh / ₦15,390)
3. `MTR-C902-88F3`: Commercial Storefront (Tariff: ₦110.00/kWh, Budget: 600 kWh / ₦66,000)

---

## 💻 Phase 2: Web Application & Frontend Architecture (Completed & Live)

### 2.1 TypeScript Models & Supabase Service
- [`src/types/meter.ts`](file:///c:/Users/kingaustin/Downloads/meter_project/src/types/meter.ts): Added comprehensive types for `MeterSummary`, `TamperEvent`, `OutageLog`, `BudgetSettings`, `FleetKPIs`, `AIInsightReport`, and PZEM readings.
- [`src/services/supabase.ts`](file:///c:/Users/kingaustin/Downloads/meter_project/src/services/supabase.ts): Implemented API wrappers calling Supabase tables and RPCs:
  - `fetchFleetMeters()`
  - `fetchTamperHistory(meterId)`
  - `fetchOutageHistory(meterId)`
  - `adminSetRelay(meterId, state, pin)`
  - `adminClearTamper(meterId, pin)`
  - `adminUpdateMeterConfig(meterId, ...)`
  - `adminBulkSetTariff(meterIds, tariff, pin)`
- [`src/services/mockData.ts`](file:///c:/Users/kingaustin/Downloads/meter_project/src/services/mockData.ts): Updated default initial data with PZEM metrics (V, I, P, E, Hz, PF) and the 3 fleet meters.

### 2.2 Reactive Global State Engine (`src/context/MeterContext.tsx`)
- **Fleet Switching**: Allows instantaneous switching between any submeter (`selectedMeterId`, `switchMeter()`).
- **Role-Based Access Control**: Supports Consumer vs Admin mode (`userRole`), guarded by Admin PIN `1234`.
- **Budget Milestone Alerts Engine**:
  - Calculates real-time consumption vs monthly limit.
  - Automatically triggers in-app and browser notifications at **50%**, **80%**, **90%**, and **100%**.
- **Month-End Run-Rate Projections**:
  - Calculates daily run rate: $(E_{\text{used}} / \text{daysElapsed}) \times \text{totalDaysInMonth}$.
  - Projects expected total monthly energy (kWh) and expected total cost (₦).
- **Realtime Sync**: Subscribes to Supabase Realtime for instant updates on telemetry, relay switching, and tamper alarms.

### 2.3 UI Components Created & Integrated
1. **BudgetSnapshotCard** ([`src/components/home/BudgetSnapshotCard.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/components/home/BudgetSnapshotCard.tsx)):
   - Visual progress bar with milestone indicators (50%, 80%, 90%, 100%).
   - Displays current spending vs budget in ₦ and kWh.
   - Shows projected month-end usage and estimated final bill.
2. **TamperHistoryModal** ([`src/components/notifications/TamperHistoryModal.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/components/notifications/TamperHistoryModal.tsx)):
   - Chronological audit log of enclosure lid breaches.
   - Integrated Admin PIN modal allowing authorized administrators to unlock the contactor relay after inspecting the physical enclosure.
3. **OutageHistoryCard** ([`src/components/energy/OutageHistoryCard.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/components/energy/OutageHistoryCard.tsx)):
   - Displays grid reliability statistics: total blackout count and total downtime.
   - Chronological list of past power outages with timestamps and exact durations.
4. **AdminFleetScreen** ([`src/screens/AdminFleetScreen.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/screens/AdminFleetScreen.tsx)):
   - Centralized management command center for multi-meter facilities.
   - Real-time KPI summary: Total Active Submeters, Total Live Demand (kW), Today's Energy (kWh), Total Revenue (₦), Active Tamper Alerts, and Blackout Events.
   - Submeter card grid with live metrics, quick contactor cutoff switches, and configuration drawer.
   - Global Bulk Tariff Update modal to adjust ₦/kWh rates across all meters simultaneously.
5. **AI Assistant & Insights**:
   - [`src/services/aiService.ts`](file:///c:/Users/kingaustin/Downloads/meter_project/src/services/aiService.ts): Gemini 1.5 Flash client with deterministic telemetry fallback.
   - [`src/components/ai/AIInsightsCard.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/components/ai/AIInsightsCard.tsx): Anomaly indicators, bill forecasts, and personalized energy efficiency tips.
   - [`src/components/ai/AIAssistantDrawer.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/components/ai/AIAssistantDrawer.tsx): Slide-over chat drawer with 4 quick prompt buttons:
     - *"How much did I use today?"*
     - *"Why is my bill high?"*
     - *"When was the last outage?"*
     - *"Is my consumption unusual?"*
6. **Navigation & Screens Integration**:
   - Added `Fleet` tab to [`src/components/layout/BottomNavigation.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/components/layout/BottomNavigation.tsx).
   - Embedded `BudgetSnapshotCard`, tamper banner, and AI insights into [`src/screens/HomeScreen.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/screens/HomeScreen.tsx).
   - Embedded `OutageHistoryCard` into [`src/screens/EnergyScreen.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/screens/EnergyScreen.tsx).
   - Mounted `AdminFleetScreen` and global modals in [`src/App.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/App.tsx).

### 2.4 Software Telemetry & Fleet Simulator
- **File**: [`Hardware/simulate_monitoring.js`](file:///c:/Users/kingaustin/Downloads/meter_project/Hardware/simulate_monitoring.js)
- **Features**:
  - Broadcasts True-RMS PZEM telemetry (V, I, P, E, Hz, PF) to remote Supabase RPC endpoints.
  - Supports `--fleet` flag for multi-meter simulation.
  - Supports `--tamper` flag to simulate an SS-5GL lid breach and test the safety interlock.
  - Supports `--blackout` flag to simulate a 0V grid failure.
  - Tested live against Supabase with **HTTP 200** confirmation on all submeters.

---

## 🛠️ Phase 3: Tomorrow's Hardware Coupling & Firmware Integration Guide

When you are ready to couple the physical hardware tomorrow, follow the step-by-step wiring and firmware integration plan below.

### 3.1 Physical Component Roster & Pinout

| Component | Function | ESP32 GPIO | Interface / Configuration | Notes |
|---|---|---|---|---|
| **PZEM-004T v3.0** | True-RMS Voltage, Current, Power, Energy, Hz, PF | `GPIO 16` (RX2)<br>`GPIO 17` (TX2) | Hardware UART (`Serial2`) @ 9600 baud | 5V VCC, GND. Connect CT coil around Live wire only. |
| **SS-5GL Micro Limit Switch** | Enclosure Lid Tamper Detection | `GPIO 14` | Digital Input (`INPUT_PULLUP`) | Make/break circuit. COM to GPIO 14, NO/NC to GND. Circuit breaks when lid is removed. |
| **Contactor / 30A Relay** | Main AC Load Disconnect | `GPIO 27` | Digital Output (Active LOW via transistor/optocoupler driver) | Cuts AC feed on overcurrent, remote switch, or tamper breach. |
| **Piezo Buzzer** | Tamper & Overload Alarm | `GPIO 19` | Digital Output (Active HIGH) | Emits loud audible pulses when tamper trip occurs. |
| **18650 Li-ion + TP4056** | Uninterruptible Power Supply (UPS) | Power Rail to 3.3V / 5V boost | Continuous DC supply | Keeps ESP32 alive during grid outage to transmit `outage_start` and record duration. |
| **Status LEDs** | Network & Relay Status | `GPIO 2` (Built-in / Blue)<br>`GPIO 4` (Green) | Digital Outputs | Blinks on telemetry transmission; steady when relay active. |

---

### 3.2 High-Voltage & Low-Voltage Wiring Schematic

```
  AC MAINS LIVE (230V) ───────────────┬───────────────────────────────┐
                                      │                               │
                                      ▼                               │
                            ┌───────────────────┐                     │
                            │  30A/40A LOAD     │                     │
                            │  CONTACTOR RELAY  │                     │
                            └─────────┬─────────┘                     │
                                      │ Controlled Output             ▼
                                      ▼                          ┌─────────┐
                                (THROUGH CT COIL)                │ PZEM AC │
                                      │                          │ VOLTAGE │
                                      ▼                          │ L & N   │
                              SUB-PANEL / LOADS                  └─────────┘
                                                                      │
  AC MAINS NEUTRAL ───────────────────┴───────────────────────────────┘

  ════════════════════ LOW-VOLTAGE DC CONTROL SECTION ════════════════════

       ┌────────────────┐
       │ PZEM-004T v3.0 │
       │   5V  ─────────┼────────────────────────────── 5V Rail
       │   GND ─────────┼────────────────────────────── GND Rail
       │   TXD ─────────┼────────────────────────────── GPIO 16 (ESP32 RX2)
       │   RXD ─────────┼────────────────────────────── GPIO 17 (ESP32 TX2)
       └────────────────┘

       ┌────────────────┐
       │ SS-5GL SWITCH  │
       │   COM ─────────┼────────────────────────────── GPIO 14 (INPUT_PULLUP)
       │   NO/NC ───────┼────────────────────────────── GND Rail (Circuit breaks on lid open)
       └────────────────┘

       ┌────────────────┐
       │ RELAY DRIVER   │
       │   IN  ─────────┼────────────────────────────── GPIO 27 (Active LOW)
       │   VCC ─────────┼────────────────────────────── 5V Rail
       │   GND ─────────┼────────────────────────────── GND Rail
       └────────────────┘

       ┌────────────────┐
       │ BUZZER         │
       │   POS (+) ─────┼────────────────────────────── GPIO 19
       │   NEG (-) ─────┼────────────────────────────── GND Rail
       └────────────────┘

       ┌──────────────────────────────────────────────────────────┐
       │ 18650 LI-ION BATTERY + TP4056 CHARGING & BOOST CONVERTER │
       │ Provides continuous 5V/3.3V to ESP32 board during outages│
       └──────────────────────────────────────────────────────────┘
```

---

### 3.3 Firmware Upgrade Tasks (To Be Executed in `Hardware/`)

1. **Install Arduino / PlatformIO Libraries**:
   - `mandarブレ/PZEM-004T-v30` (or `PZEM004Tv30` library for hardware Serial2).
   - `ArduinoJson` (v6 or v7 for JSON payloads).
   - `HTTPClient` and `WiFiClientSecure`.
   - `LittleFS` (built into ESP32 core for offline flash buffer).

2. **Firmware File Modifications Required**:
   - **`Hardware/src/config.h`**:
     - Define pins: `PZEM_RX_PIN 16`, `PZEM_TX_PIN 17`, `TAMPER_PIN 14`, `RELAY_PIN 27`, `BUZZER_PIN 19`.
     - Define `METER_ID` (e.g. `MTR-8A24-19F2`).
     - Define Supabase endpoint and publishable key.
   - **`Hardware/src/sensors.cpp`**:
     - Replace analog ADC voltage/current sampling with `PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);`.
     - Read: `pzem.voltage()`, `pzem.current()`, `pzem.power()`, `pzem.energy()`, `pzem.frequency()`, `pzem.pf()`.
   - **`Hardware/src/tamper.cpp`**:
     - Initialize `pinMode(TAMPER_PIN, INPUT_PULLUP);`.
     - Attach hardware interrupt on GPIO 14 (`RISING` or `FALLING` depending on switch NO/NC setup).
     - Upon trip: immediately call `digitalWrite(RELAY_PIN, HIGH)` (cutoff), sound buzzer on GPIO 19, lock state, and transmit `tamper_event` to Supabase.
   - **`Hardware/src/offline_buffer.cpp`**:
     - Manage a circular FIFO queue in LittleFS (`/telemetry_queue.json`).
     - If Wi-Fi is disconnected, store up to 500 telemetry records.
     - When Wi-Fi reconnects, transmit records in batch using `rpc/batch_sync_telemetry`.
   - **`Hardware/Hardware.ino`**:
     - Initialize `Serial2.begin(9600, SERIAL_8N1, 16, 17);`.
     - Loop every 3 seconds to poll PZEM, check tamper switch, and send JSON payload to `rpc/record_telemetry`.

---

### 3.4 Coupling & Smoke Test Checklist (Tomorrow)

- [ ] **Continuity Check**: Verify SS-5GL switch is closed when lid is fastened, and opens when lid is loosened.
- [ ] **Isolation Check**: Ensure high-voltage AC mains (230V) and CT coil are completely isolated from low-voltage ESP32 GPIOs.
- [ ] **PZEM Serial Test**: Run basic PZEM test sketch to confirm valid AC readings ($V \approx 220\text{--}240\,\text{V}$, $f \approx 50\,\text{Hz}$).
- [ ] **Tamper Trip Test**: Remove lid while running -> verify contactor clicks OFF in $<50\,\text{ms}$, buzzer sounds, and web app displays Tamper Alert.
- [ ] **Admin PIN Unlock Test**: In web app Tamper Modal, enter PIN `1234` -> verify tamper clears, buzzer stops, and contactor re-energizes.
- [ ] **Blackout Simulation**: Disconnect AC mains input -> verify ESP32 stays alive on 18650 battery and transmits 0V outage event.
- [ ] **Wi-Fi Recovery Test**: Disconnect Wi-Fi router for 2 minutes -> verify records accumulate in LittleFS -> reconnect Wi-Fi and verify batch sync completes with no data loss.
