# Submeter Software Upgrade Master Plan (Software-First Staging)

> **System**: Voltrix IoT Smart Energy Submeter  
> **Status**: STAGED EXECUTION PLAN (Software & Web App First; Hardware Deferred to Tomorrow)  
> **Target Slug**: `submeter-software-upgrade.md`  
> **Primary Agents**: `project-planner`, `frontend-specialist`, `backend-specialist`, `database-architect`  
> **Primary Skills**: `clean-code`, `plan-writing`, `frontend-design`, `database-design`, `api-patterns`

---

## 1. Staging Directive & Scope Boundary

As requested, implementation is strictly decoupled into two distinct stages:

* **STAGE 1: FULL SOFTWARE & WEB APPLICATION (Executing Now)**:
  All database schema migrations, RPC stored procedures, TypeScript types, global reactive state management, multi-meter fleet management, consumer telemetry UI, budget alert engine, tamper/outage forensics dashboards, AI energy intelligence suite, and the software simulation engine.
* **STAGE 2: EMBEDDED HARDWARE FIRMWARE (Deferred to Tomorrow)**:
  All changes to `Hardware/` (PZEM-004T UART driver, SS-5GL limit switch ISR, LittleFS flash buffer, 18650 battery outage sensing, and OTA updater) will remain untouched until the user physically couples and wires the hardware together tomorrow.

---

## 2. Stage 1: Software & Web App Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                SUPABASE CLOUD BACKEND                                  │
│  - meters table (fleet metadata, tariff, budget, overcurrent, relay state)             │
│  - telemetry table (high-speed PZEM metrics: V, I, P, E, Hz, PF)                       │
│  - tamper_events table (SS-5GL limit switch breaches)                                  │
│  - outage_logs table (blackout start/end timestamps & durations)                       │
│  - record_telemetry(), batch_sync_telemetry(), admin_set_relay(), admin_clear_tamper() │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTPS / WSS Realtime
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        WEB APPLICATION (REACT / TYPESCRIPT / VITE)                     │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ GLOBAL STATE: MeterContext.tsx                                                   │  │
│  │ - Multi-meter fleet state (metersList, selectedMeterId, switchMeter)             │  │
│  │ - Role-Based Access Control (Admin with PIN vs Consumer)                         │  │
│  │ - Real-time budget progress engine (50%, 80%, 90%, 100% alerts)                  │  │
│  │ - Month-end run-rate forecasting (kWh & ₦)                                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                           │                                            │
│         ┌─────────────────────────────────┴─────────────────────────────────┐          │
│         ▼                                                                   ▼          │
│  ┌────────────────────────────────────────┐       ┌─────────────────────────────────┐  │
│  │ CONSUMER SCREENS & COMPONENTS          │       │ MULTI-METER FLEET ADMIN PORTAL  │  │
│  │ - HomeScreen: Live PZEM panel (V,I,W,  │       │ - AdminFleetScreen: Fleet KPIs, │  │
│  │   kWh, Hz, PF) + BudgetSnapshotCard    │       │   multi-meter card grid, remote │  │
│  │ - EnergyScreen: 4-way usage switcher   │       │   relay contactor cutoff switches│ │
│  │   (Hourly/Daily/Weekly/Monthly) in ₦   │       │ - SettingsScreen: Individual &  │  │
│  │ - OutageHistoryCard: Blackout tracker  │       │   bulk ₦/kWh tariffs, budgets,  │  │
│  │ - TamperHistoryModal: Audit log        │       │   and overcurrent limits        │  │
│  │ - AIAssistantDrawer & AIInsightsCard   │       │ - Tamper Unlock: Admin PIN gate │  │
│  └────────────────────────────────────────┘       └─────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Stage 1 Detailed Task Breakdown (Software Implementation)

### Task 1: Supabase Database Migration & RPC Stored Procedures
- **Agent**: `database-architect` | **Skill**: `database-design`
- **Deliverable**: `supabase/migrations/20260909000000_submeter_upgrade.sql`
- **Features**:
  - Extend `meters` table: multi-meter support (`name`, `location`, `building_id`), `tariff_rate`, `monthly_budget_kwh`, `monthly_budget_naira`, `budget_alert_tiers`, `relay_state`, `tamper_locked`, `wifi_rssi`, `free_heap_bytes`, `battery_mv`.
  - Create `tamper_events` table for SS-5GL lid openings.
  - Create `outage_logs` table for blackout tracking.
  - RPCs:
    - `record_telemetry(...)`: Real-time ingestion of PZEM parameters.
    - `batch_sync_telemetry(...)`: Bulk ingestion for offline buffer.
    - `admin_set_relay(meter_id, state, pin)`: PIN-authorized relay toggle.
    - `admin_clear_tamper(meter_id, pin)`: PIN-authorized tamper reset & relay restore.
    - `admin_bulk_set_tariff(meter_ids, new_tariff)`: Fleet tariff updater.
- **Verification**: SQL syntax test & execution against local/remote Supabase.

### Task 2: TypeScript Data Models & Supabase Service Layer
- **Agent**: `backend-specialist` | **Skill**: `clean-code`
- **Deliverables**: `src/types/meter.ts` & `src/services/supabase.ts`
- **Features**:
  - Typed interfaces for `MeterSummary`, `TamperEvent`, `OutageLog`, `BudgetSettings`, `FleetKPIs`, and `AIInsightReport`.
  - API functions: `fetchFleetMeters()`, `fetchTamperHistory()`, `fetchOutageHistory()`, `adminSetRelay()`, `adminClearTamper()`, `adminUpdateTariff()`.
- **Verification**: `npx tsc --noEmit` compiles cleanly.

### Task 3: Global Reactive State & Fleet Engine (`MeterContext.tsx`)
- **Agent**: `frontend-specialist` | **Skill**: `frontend-architecture`
- **Deliverable**: `src/context/MeterContext.tsx`
- **Features**:
  - Multi-meter selector and list: `metersList`, `selectedMeterId`, `switchMeter(id)`.
  - Role-Based Access Control: `userRole: 'admin' | 'consumer'` with secure PIN validation.
  - Budget Engine: computes % consumed against monthly limit; triggers in-app and browser notifications at **50%**, **80%**, **90%**, and **100%**.
  - Month-end run-rate projection calculator for kWh and ₦.
  - Realtime subscriptions for multi-meter telemetry, tamper events, and outage logs.
- **Verification**: Context unit tests and state mutation verification.

### Task 4: Multi-Meter Fleet Admin Management Portal
- **Agent**: `frontend-specialist` | **Skill**: `frontend-design`
- **Deliverable**: `src/screens/AdminFleetScreen.tsx` & updated `src/screens/SettingsScreen.tsx`
- **Features**:
  - **Facility KPI Banner**: Total registered meters, live facility demand (kW), today's energy (kWh), total revenue (₦), active tampers count, blackout count.
  - **Multi-Meter Control Grid**:
    - Per-meter status card showing Flat/Location, live kW, Voltage, Relay state pill, and Tamper alert.
    - Contactor Relay Toggle switch with Admin PIN confirmation modal.
    - Quick "Configure" action to edit individual meter tariffs, budget, and safety limits.
  - **Global Tariff & Budget Modal**: Bulk apply updated ₦/kWh rates across all meters.
  - **Fleet Tamper Forensics**: Centralized audit log with "Clear Tamper & Restore Power" button requiring Admin PIN.
- **Verification**: Visual inspection across desktop and mobile viewports.

### Task 5: Consumer Dashboard & Telemetry Enhancements
- **Agent**: `frontend-specialist` | **Skill**: `frontend-design`
- **Deliverables**:
  - `src/components/home/LiveElectricalCard.tsx`: Complete 6 PZEM metrics (V, I, Active kW, Energy kWh, Frequency Hz, Power Factor).
  - `src/components/home/BudgetSnapshotCard.tsx`: Visual progress gauge with 50/80/90/100% badges and run-rate month-end predictions.
  - `src/screens/HomeScreen.tsx`: Integrated telemetry, budget gauge, and meter status pills.
  - `src/screens/EnergyScreen.tsx`: 4-way period switcher (Hourly, Daily, Weekly, Monthly) with ₦ cost trends and outage logs.
- **Verification**: Verify responsive layout, zero layout shifts, and active chart rendering.

### Task 6: Tamper Forensics & Outage History Components
- **Agent**: `frontend-specialist` | **Skill**: `frontend-design`
- **Deliverables**:
  - `src/components/notifications/TamperHistoryModal.tsx`: Chronological SS-5GL lid opening audit trail with Admin PIN unlock action.
  - `src/components/energy/OutageHistoryCard.tsx`: Total blackout count, total downtime (hours/mins), and historical outage logs.
- **Verification**: Open modals with mock/live data and verify UI interactivity.

### Task 7: Gemini AI Energy Intelligence Suite
- **Agent**: `frontend-specialist` & `backend-specialist` | **Skill**: `clean-code`
- **Deliverables**:
  - `src/services/aiService.ts`: Gemini 1.5 Flash client integration.
  - `src/components/ai/AIInsightsCard.tsx`: 7–30 day consumption predictions, month-end bill projections in ₦, load anomaly detection, and energy-saving tips.
  - `src/components/ai/AIAssistantDrawer.tsx`: Floating chat drawer with 4 quick prompt buttons:
    1. *"How much did I use today?"*
    2. *"Why is my bill high?"*
    3. *"When was the last outage?"*
    4. *"Is my consumption unusual?"*
- **Verification**: Verify all 4 quick questions generate contextual, accurate answers referencing active meter data.

### Task 8: Mock Telemetry & Fleet Simulator Upgrade
- **Agent**: `backend-specialist` | **Skill**: `clean-code`
- **Deliverable**: `Hardware/simulate_monitoring.js` (software-side simulator tool)
- **Features**:
  - Upgraded to simulate **PZEM-004T metrics** (V, I, P, E, Hz, PF) for multiple meters.
  - Interactive CLI or automated flags to test SS-5GL lid tamper trigger, overcurrent tripping, and grid blackout simulation.
- **Verification**: Run `node Hardware/simulate_monitoring.js` and observe multi-meter dashboard updates in real time.

---

## 4. Stage 2: Embedded Hardware Firmware (Deferred to Tomorrow)

*Scheduled for when the physical submeter hardware is coupled together:*
- [ ] Install `PZEM004Tv30` library and configure Serial2 UART on GPIO 16 (RX) and GPIO 17 (TX).
- [ ] Connect SS-5GL limit switch to GPIO 14 (`INPUT_PULLUP`) and implement contactor interlock (<50ms trip on GPIO 27).
- [ ] Implement 18650 battery-backed blackout detection (`outage_start` / `outage_end`).
- [ ] Implement LittleFS circular queue (`offline_buffer.cpp`) for buffering up to 500 records during Wi-Fi drops.
- [ ] Implement remote HTTPS OTA firmware updates (`ota_updater.cpp`).

---

## 5. Phase X: Software Quality Verification Checklist

```markdown
- [ ] TypeScript Check: `npx tsc --noEmit` passes with 0 errors.
- [ ] Build Check: `npm run build` completes cleanly without bundle errors.
- [ ] Security Scan: `python .agents/skills/vulnerability-scanner/scripts/security_scan.py .` passes.
- [ ] UX Audit: `python .agents/skills/frontend-design/scripts/ux_audit.py .` passes WCAG AA and responsive tests.
- [ ] Multi-Meter Fleet Test: Admin screen renders multiple meters and toggles relays with PIN.
- [ ] Budget Alert Test: 50%, 80%, 90%, 100% threshold notifications trigger correctly.
- [ ] AI Assistant Test: All 4 quick questions return accurate responses based on active telemetry.
- [ ] Hardware Preservation: Zero changes made to physical firmware files until tomorrow.
```
