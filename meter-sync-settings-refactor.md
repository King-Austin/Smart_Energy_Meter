# Meter Two-Way Sync, Guardrail Sliders & Lean Settings Refactor

## Overview
Refactor the Voltrix Smart Energy Meter system to ensure:
- Bi-directional contactor synchronization (GPIO 13) between Supabase cloud commands and physical ESP32 status.
- Interactive range sliders for protective voltage cutoffs, enabling overvoltage trip tests down to 230V/210V against live mains (~213V).
- Client-lean Settings screen with all administrative and debug clutter removed.
- Completely live Energy usage screen with 0% mock data.
- Hardened SS-5GL lid tamper latching with seamless Admin PIN `1234` clearing.

## Project Type
**WEB / FULL-STACK (React + Vite + Supabase + ESP32 C++ Firmware)**

## Success Criteria
- [x] Mains switch displays correct GPIO 13 assignment and real-time bi-directional synchronization (Cloud Target vs Hardware ACK).
- [x] Max Voltage and Min Voltage configured as smooth range sliders.
- [x] Sliding Max Voltage below live voltage (e.g. 210V < 213V) triggers immediate overvoltage trip, opening contactor on GPIO 13.
- [x] Settings page stripped of Cloud Backend, Tariff/Currency, Saved Recipients, Simulator, and Fleet portal.
- [x] Energy screen contains zero mock datasets (`HOURLY_DATA`, `WEEKLY_DATA`, `MONTHLY_DATA` removed).
- [x] Tamper red panel on Home screen unlocks via Admin PIN `1234`, restoring supply and re-energizing prototype.

## Tech Stack
- Frontend: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite
- Backend / Realtime: Supabase PostgreSQL, Realtime Subscriptions, RPC Functions
- Embedded Firmware: ESP32 Dev Module (NodeMCU-32S), Arduino C++, PZEM-004T v3.0, FreeRTOS

## File Structure
- `src/screens/SettingsScreen.tsx`: Lean client settings, contactor switch (GPIO 13), voltage sliders.
- `src/screens/EnergyScreen.tsx`: 100% live telemetry curves & outage history.
- `src/screens/HomeScreen.tsx`: Live dashboard cards & tamper banner.
- `src/context/MeterContext.tsx`: Two-way sync state management & protection controls.
- `src/services/supabase.ts`: DB RPCs & realtime listeners.
- `supabase/migrations/`: RPC function updates for `record_telemetry` and `admin_clear_tamper`.
- `Hardware/Hardware.ino`: ESP32 firmware contactor sync & tamper handling.

## Task Breakdown

- [x] Task 1: Supabase RPC & Schema Update
  - Best Agent: `database-architect` | Best Skill: `database-design`
  - INPUT: Current `record_telemetry` RPC
  - OUTPUT: Upgraded RPC supporting `p_is_relay_on`, updating `hardware_relay_ack` in `meters` and setting `voltage_cutoff_tripped` on threshold violation
  - VERIFY: Execute test SQL in Supabase and confirm successful schema updates

- [x] Task 2: MeterContext & Types Alignment
  - Best Agent: `frontend-specialist` | Best Skill: `frontend-architecture`
  - INPUT: `src/types/meter.ts`, `src/context/MeterContext.tsx`
  - OUTPUT: State tracking for `hardware_relay_ack`, live overvoltage trip check when sliders update, sync status indicator
  - VERIFY: Type check with `npx tsc --noEmit`

- [x] Task 3: SettingsScreen Lean Refactor & Voltage Sliders
  - Best Agent: `frontend-specialist` | Best Skill: `frontend-design`
  - INPUT: `src/screens/SettingsScreen.tsx`
  - OUTPUT: Stripped cards (Endpoints, Tariff, Recipients, Simulator, Fleet), added smart range sliders (190V–260V with live PZEM marker), and GPIO 13 contactor toggle with two-way ACK
  - VERIFY: Inspect Settings screen visually; verify only 6 essential cards remain

- [x] Task 4: EnergyScreen Zero-Mock Data Refactor
  - Best Agent: `frontend-specialist` | Best Skill: `clean-code`
  - INPUT: `src/screens/EnergyScreen.tsx`
  - OUTPUT: Eradicate `HOURLY_DATA`, `WEEKLY_DATA`, `MONTHLY_DATA`; render strictly from Supabase `telemetry_logs`
  - VERIFY: Confirm no mock data imports or references remain in `EnergyScreen.tsx`

- [x] Task 5: Tamper Forensics & PIN Unlock Verification
  - Best Agent: `security-auditor` | Best Skill: `clean-code`
  - INPUT: `src/components/notifications/TamperHistoryModal.tsx`
  - OUTPUT: Reliable Admin PIN `1234` clear flow; updates Supabase and restores supply contactor
  - VERIFY: Test unlock flow and verify tamper cleared in DB

- [x] Task 6: ESP32 Firmware Telemetry Alignment
  - Best Agent: `backend-specialist` | Best Skill: `clean-code`
  - INPUT: `Hardware/Hardware.ino`, `Hardware/src/supabase_client.cpp`
  - OUTPUT: Accurate two-way sync loop reflecting cloud commands on D13 and acknowledging state
  - VERIFY: Serial monitor / terminal log verification

## ✅ PHASE X COMPLETE
- Build: ✅ Pass (`npm run build` completed in 4.09s with 0 errors)
- Two-Way Contactor Sync: ✅ Supabase schema + RPC + React Context + GPIO 13 Active LOW
- Smart Sliders: ✅ Interactive 190V–260V with live PZEM reference (~213V)
- Lean Client Settings: ✅ Endpoint, Tariff, Recipients, Simulator, and Fleet removed
- Energy View: ✅ 0% mock data, 100% live telemetry
- Tamper Security: ✅ Latching interlock with PIN `1234` reversal
- Date: 2026-09-12
