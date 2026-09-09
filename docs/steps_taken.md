# Voltrix Smart Submeter: Integration Steps & Phase Execution Guide (Software-First Staged Scope)

> **Document**: `docs/steps_taken.md`  
> **Status**: Active Architectural & Execution Reference  
> **Target Project**: Voltrix IoT Smart Energy Submeter  
> **Execution Constraint**: **Software & Web Application First (Executing Now)**; Hardware C++ Firmware Deferred to Tomorrow  

---

## Table of Contents
1. [Staging Directive & Phased Execution Strategy](#1-staging-directive--phased-execution-strategy)
2. [Target Software Architecture](#2-target-software-architecture)
3. [Phase 1: Supabase Database Migration & Fleet RPC Layer](#phase-1-supabase-database-migration--fleet-rpc-layer)
4. [Phase 2: TypeScript Data Models & Supabase Service Layer](#phase-2-typescript-data-models--supabase-service-layer)
5. [Phase 3: Global Reactive State & Multi-Meter Fleet Engine](#phase-3-global-reactive-state--multi-meter-fleet-engine)
6. [Phase 4: Multi-Meter Fleet Admin Management Portal](#phase-4-multi-meter-fleet-admin-management-portal)
7. [Phase 5: Consumer Dashboard, PZEM Panel & Budget Milestone Gauge](#phase-5-consumer-dashboard-pzem-panel--budget-milestone-gauge)
8. [Phase 6: Tamper Forensics & Outage History Dashboards](#phase-6-tamper-forensics--outage-history-dashboards)
9. [Phase 7: Gemini AI Energy Intelligence Suite & Assistant Drawer](#phase-7-gemini-ai-energy-intelligence-suite--assistant-drawer)
10. [Phase 8: Multi-Meter Fleet Software Simulator](#phase-8-multi-meter-fleet-software-simulator)
11. [Phase 9: Software Quality Verification Matrix](#phase-9-software-quality-verification-matrix)
12. [Stage 2 Preview: Hardware Integration (Tomorrow)](#stage-2-preview-hardware-integration-tomorrow)

---

## 1. Staging Directive & Phased Execution Strategy

Per project scope instructions:
- **STAGE 1 (Executing Now)**: **100% Software Implementation**. All development is conducted on the Supabase backend (PostgreSQL schema, RPCs, Realtime channels) and the React/TypeScript/Vite web application (state machine, multi-meter fleet admin screen, consumer telemetry, budget progress gauge, tamper/outage modals, AI chat assistant, and telemetry simulator).
- **STAGE 2 (Deferred to Tomorrow)**: **Physical Embedded Hardware**. Once the user physically couples and wires the hardware components (ESP32-S3, PZEM-004T UART, SS-5GL limit switch, 18650 Li-ion battery rail, contactor relay, buzzer), firmware modifications in `Hardware/` will be executed.

---

## 2. Target Software Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                SUPABASE CLOUD BACKEND                                  │
│  - meters table (fleet metadata, tariff, budget, overcurrent, relay state)             │
│  - telemetry table (PZEM metrics: V, I, P, E, Hz, PF)                                  │
│  - tamper_events table (SS-5GL lid breaches)                                           │
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

## Phase 1: Supabase Database Migration & Fleet RPC Layer

### Deliverable: `supabase/migrations/20260909000000_submeter_upgrade.sql`

#### Schema Updates:
1. **`meters` Table**:
   - Add `name` (TEXT, default `'Main Submeter'`)
   - Add `location` (TEXT, default `'Building Main'`)
   - Add `building_id` (TEXT, default `'BLD-01'`)
   - Add `tariff_rate` (FLOAT, default `68.5`)
   - Add `monthly_budget_kwh` (FLOAT, default `300.0`)
   - Add `monthly_budget_naira` (FLOAT, default `25000.0`)
   - Add `budget_alert_tiers` (JSONB, default `'{"50":false,"80":false,"90":false,"100":false}'::jsonb`)
   - Add `over_current_limit` (FLOAT, default `30.0`)
   - Add `relay_state` (BOOLEAN, default `true`)
   - Add `is_tampered` (BOOLEAN, default `false`)
   - Add `tamper_locked` (BOOLEAN, default `false`)
   - Add `wifi_rssi` (INTEGER)
   - Add `free_heap_bytes` (INTEGER)
   - Add `uptime_seconds` (BIGINT)
   - Add `battery_mv` (INTEGER)
   - Add `ota_url` (TEXT)
   - Add `ota_version` (TEXT)
2. **`tamper_events` Table**:
   - `id` (UUID PK default `gen_random_uuid()`)
   - `meter_id` (TEXT references `meters(meter_id)`)
   - `event_type` (TEXT default `'ss5gl_lid_opened'`)
   - `description` (TEXT)
   - `created_at` (TIMESTAMPTZ default `now()`)
   - `resolved` (BOOLEAN default `false`)
   - `resolved_by` (TEXT)
   - `resolved_at` (TIMESTAMPTZ)
3. **`outage_logs` Table**:
   - `id` (UUID PK default `gen_random_uuid()`)
   - `meter_id` (TEXT references `meters(meter_id)`)
   - `outage_start` (TIMESTAMPTZ not null)
   - `outage_end` (TIMESTAMPTZ)
   - `duration_seconds` (INTEGER)
   - `cause` (TEXT default `'grid_loss_detected_by_battery'`)
4. **RPC Functions**:
   - `record_telemetry(...)`: Ingests PZEM telemetry, enforces overcurrent trip, and logs outage / tamper.
   - `batch_sync_telemetry(...)`: Unpacks offline JSON array.
   - `admin_set_relay(p_meter_id, p_state, p_admin_pin)`: Validates PIN and updates relay state.
   - `admin_clear_tamper(p_meter_id, p_admin_pin)`: Validates PIN, resets `is_tampered` and `tamper_locked`, and restores relay.
   - `admin_update_meter_config(p_meter_id, p_tariff, p_budget_naira, p_budget_kwh, p_overcurrent)`: Configuration updater.

---

## Phase 2: TypeScript Data Models & Supabase Service Layer

### Deliverables: `src/types/meter.ts` & `src/services/supabase.ts`

- Extended `MeterTelemetry` with PZEM-004T metrics: `frequency`, `power_factor`, `apparent_power`, `reactive_power`.
- New models:
  ```typescript
  export interface MeterSummary {
    meter_id: string;
    meter_name: string;
    location: string;
    is_online: boolean;
    main_supply_connected: boolean;
    is_tampered: boolean;
    tamper_locked: boolean;
    voltage: number;
    current: number;
    active_power: number;
    energy_today: number;
    tariff_rate: number;
    monthly_budget_naira: number;
  }

  export interface TamperEvent {
    id: string;
    meter_id: string;
    event_type: string;
    description: string;
    created_at: string;
    resolved: boolean;
  }

  export interface OutageLog {
    id: string;
    meter_id: string;
    outage_start: string;
    outage_end?: string;
    duration_seconds?: number;
    cause?: string;
  }
  ```
- Service layer methods in `src/services/supabase.ts`:
  - `fetchFleetMeters(): Promise<MeterSummary[]>`
  - `fetchTamperEvents(meterId: string): Promise<TamperEvent[]>`
  - `fetchOutageLogs(meterId: string): Promise<OutageLog[]>`
  - `adminSetRelay(meterId: string, state: boolean, pin: string): Promise<{ success: boolean; message: string }>`
  - `adminClearTamper(meterId: string, pin: string): Promise<{ success: boolean; message: string }>`
  - `adminUpdateMeterConfig(...): Promise<boolean>`

---

## Phase 3: Global Reactive State & Multi-Meter Fleet Engine

### Deliverable: `src/context/MeterContext.tsx`

- Tracks `metersList: MeterSummary[]` and `selectedMeterId: string`.
- Provides `switchMeter(meterId: string)` to instantly toggle the active viewing submeter across the entire app.
- Role-Based Access Control (`userRole: 'admin' | 'consumer'`) with PIN challenge.
- Real-time budget progress calculator ($50\%, 80\%, 90\%, 100\%$) for the selected meter.
- Run-rate projection formula:
  $$\text{Projected Month kWh} = \left(\frac{\text{kWh Used Today} \times 30}{\text{Day of Month}}\right)$$
  $$\text{Projected Month Cost} = \text{Projected Month kWh} \times \text{Tariff Rate (₦)}$$
- Web Push & in-app toast notification engine.

---

## Phase 4: Multi-Meter Fleet Admin Management Portal

### Deliverable: `src/screens/AdminFleetScreen.tsx`

- **Fleet KPI Summary Bar**:
  - Total Submeters Registered
  - Total Real-Time Facility Load (kW)
  - Total Facility Energy Today (kWh)
  - Total Facility Revenue Today (₦)
  - Active Tamper Alert Count
  - Blackout Count
- **Multi-Meter Control Grid**:
  - Individual cards for each registered submeter with live status pills (Online, Blackout, Tampered, Relay Cut).
  - Contactor Relay Toggle with confirmation modal and Admin PIN prompt.
  - "Configure" modal to update individual meter tariffs (₦/kWh), monthly budgets, and overcurrent limits.
- **Global Fleet Actions**:
  - "Apply Global Tariff" modal (bulk update across all submeters).
  - "Fleet Tamper Audit" modal with history logs and Admin PIN unlock.

---

## Phase 5: Consumer Dashboard, PZEM Panel & Budget Milestone Gauge

### Deliverables:
- `src/components/home/LiveElectricalCard.tsx`: Complete 6 PZEM parameters (V, I, Active kW, Total kWh, Frequency Hz, Power Factor).
- `src/components/home/BudgetSnapshotCard.tsx`: Visual progress gauge with 50%, 80%, 90%, 100% threshold badges and run-rate predictions.
- `src/screens/HomeScreen.tsx`: Integrated telemetry, budget gauge, and status pills.
- `src/screens/EnergyScreen.tsx`: 4-way timeframe switcher (Hourly, Daily, Weekly, Monthly) with ₦ cost trends and blackout history.

---

## Phase 6: Tamper Forensics & Outage History Dashboards

### Deliverables:
- `src/components/notifications/TamperHistoryModal.tsx`: Chronological SS-5GL lid opening audit trail with Admin PIN unlock action.
- `src/components/energy/OutageHistoryCard.tsx`: Total blackout count, total downtime (hours/mins), and historical outage logs.

---

## Phase 7: Gemini AI Energy Intelligence Suite & Assistant Drawer

### Deliverables:
- `src/services/aiService.ts`: Gemini 1.5 Flash client integration.
- `src/components/ai/AIInsightsCard.tsx`: 7–30 day consumption predictions, month-end bill projections in ₦, load anomaly detection, and energy-saving tips.
- `src/components/ai/AIAssistantDrawer.tsx`: Floating chat drawer with 4 quick prompt buttons:
  1. *"How much did I use today?"*
  2. *"Why is my bill high?"*
  3. *"When was the last outage?"*
  4. *"Is my consumption unusual?"*

---

## Phase 8: Multi-Meter Fleet Software Simulator

### Deliverable: `Hardware/simulate_monitoring.js` (Software Simulator)

- Enhanced Node.js simulation script that generates realistic PZEM telemetry (Voltage, Current, Power, Energy, Hz, PF) for multiple meters.
- Supports simulating an SS-5GL lid tamper trigger (`--tamper`) and grid blackout (`--blackout`) to test the web application end-to-end without hardware.

---

## Phase 9: Software Quality Verification Matrix

| Check Type | Command / Script | Acceptance Criteria |
|:---|:---|:---|
| **Type Integrity** | `npx tsc --noEmit` | 0 errors |
| **Production Build** | `npm run build` | Builds cleanly into `/dist` |
| **Security Scan** | `python .agents/skills/vulnerability-scanner/scripts/security_scan.py .` | 0 critical/high issues |
| **UX & Contrast Audit** | `python .agents/skills/frontend-design/scripts/ux_audit.py .` | Passes WCAG AA compliance |
| **Multi-Meter Simulator**| `node Hardware/simulate_monitoring.js` | Feeds live multi-meter data to Supabase |

---

## Stage 2 Preview: Hardware Integration (Tomorrow)

*When physical assembly is ready tomorrow:*
- [ ] Connect PZEM-004T v3.0 UART to ESP32 Serial2 (GPIO 16 RX / GPIO 17 TX).
- [ ] Connect SS-5GL limit switch to GPIO 14 (`INPUT_PULLUP`).
- [ ] Connect contactor relay to GPIO 27 and alarm buzzer to GPIO 19.
- [ ] Flash firmware with `PZEM004Tv30` driver, LittleFS offline buffer, and battery-backed outage logic.
