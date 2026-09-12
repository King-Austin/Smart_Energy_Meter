# Clean Code & Modular Architecture Plan

> **Task**: Codebase audit, clean code policy implementation, service segregation, and component modularization to eliminate technical debt.
> **Project Type**: Full-Stack IoT Web & Native Mobile (React 18 + TypeScript + Vite + Tailwind CSS + Capacitor Android + Supabase + ESP32 C++).

---

## 1. Overview & Problem Statement

A thorough audit of the codebase revealed several architectural bottlenecks and technical debt:
1. **Monolithic God Context ([`src/context/MeterContext.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/context/MeterContext.tsx))**:
   - Spans **1,224 lines** combining telemetry streaming, fleet administration, role-based access control, PIN verification, wallet payments, Paystack integration, P2P energy sharing, safety cutoffs, and routing.
   - Triggers frequent unnecessary re-renders across the UI whenever 2-second telemetry packets arrive.
2. **Monolithic Screen: Super Admin Dashboard ([`src/screens/SuperAdminDashboard.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/screens/SuperAdminDashboard.tsx))**:
   - Spans **1,240 lines** with 4 full administrative modals (Relay, Config, Bulk Tariff, Adjust Units), a submeter grid card, KPI banner, and search toolbar all embedded in a single file.
3. **Monolithic Screen: Landing Page ([`src/screens/LandingScreen.tsx`](file:///c:/Users/kingaustin/Downloads/meter_project/src/screens/LandingScreen.tsx))**:
   - Spans **803 lines** with navbar, hero, live demo showcase, hardware architecture specs, mobile APK download, FAQ accordion, and footer crammed into one component.
4. **Service Bloat ([`src/services/supabase.ts`](file:///c:/Users/kingaustin/Downloads/meter_project/src/services/supabase.ts))**:
   - Spans **585 lines** mixing client initialization, meter queries, fleet queries, subscriptions, outage queries, tamper RPCs, admin RPCs, and Paystack logs.
5. **Component Duplication**:
   - 4-digit PIN authorization logic and forms are duplicated 4 times across different modals.
   - Status badge logic (`online`/`offline`, `connected`/`cutoff`, `secure`/`tampered`) is manually re-implemented with repetitive Tailwind classes across multiple screens.

---

## 2. Goals & Success Criteria

1. **Modular Screen Architecture**:
   - Decompose `SuperAdminDashboard.tsx` from 1,240 lines to $< 200$ lines by extracting dedicated components into `src/components/admin/`.
   - Decompose `LandingScreen.tsx` from 803 lines to $< 120$ lines by extracting section components into `src/components/landing/`.
2. **Service Segregation**:
   - Split `src/services/supabase.ts` into domain-specific modules under `src/services/supabase/` (`client.ts`, `telemetryService.ts`, `adminService.ts`, `billingService.ts`), while preserving backward compatibility via barrel re-exports.
   - Extract payment and Paystack script loading into `src/services/paymentService.ts`.
3. **Context Decomposition**:
   - Modularize `MeterContext.tsx` by separating domain logic into focused custom hooks (`useMeterTelemetry`, `useFleetManagement`, `useWalletBilling`, `useSafetyProtection`).
   - Maintain the public `useMeter()` interface so zero consumer screens break.
4. **Reusable UI Building Blocks**:
   - Create shared UI atoms in `src/components/common/` (`ModalWrapper.tsx`, `PinAuthModal.tsx`, `StatusBadge.tsx`).
5. **Zero Regressions**:
   - `npm run build` (`tsc && vite build`) must pass with 0 errors.
   - `npx cap sync android` must sync cleanly.
   - All live telemetry, admin RPCs, and iPhone-style UI widgets must retain 100% functionality.

---

## 3. Modular File Structure Plan

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminAdjustUnitsModal.tsx    [NEW - Extracted prepaid units modal]
│   │   ├── AdminBulkTariffModal.tsx     [NEW - Extracted bulk tariff modal]
│   │   ├── AdminConfigModal.tsx         [NEW - Extracted submeter config modal]
│   │   ├── AdminRelayModal.tsx          [NEW - Extracted contactor relay toggle modal]
│   │   ├── FleetKpiBanner.tsx           [NEW - Extracted 6-KPI metrics banner]
│   │   ├── FleetSearchToolbar.tsx       [NEW - Extracted search & filter tab bar]
│   │   ├── SubmeterCard.tsx             [NEW - Extracted submeter telemetry card]
│   │   └── TamperQuickActionBar.tsx     [Existing]
│   ├── common/
│   │   ├── ModalWrapper.tsx             [NEW - Reusable animated modal backdrop]
│   │   ├── PinAuthModal.tsx             [NEW - Reusable 4-digit PIN verification modal]
│   │   └── StatusBadge.tsx              [NEW - Reusable status pills (grid, relay, tamper)]
│   ├── landing/
│   │   ├── LandingFaq.tsx               [NEW - Extracted interactive FAQ accordion]
│   │   ├── LandingFeatures.tsx          [NEW - Extracted feature grid]
│   │   ├── LandingHardwareSpecs.tsx     [NEW - Extracted hardware architecture & pinouts]
│   │   ├── LandingHero.tsx              [NEW - Extracted hero section & glow graphics]
│   │   ├── LandingMobileDownload.tsx    [NEW - Extracted mobile APK download section]
│   │   ├── LandingNav.tsx               [NEW - Extracted navigation bar]
│   │   └── LandingTelemetryDemo.tsx     [NEW - Extracted live telemetry showcase]
│   └── ...
├── context/
│   ├── hooks/
│   │   ├── useFleetManagement.ts        [NEW - Dedicated fleet query & admin RPC hook]
│   │   ├── useMeterTelemetry.ts         [NEW - Dedicated live telemetry & realtime hook]
│   │   └── useWalletBilling.ts          [NEW - Dedicated wallet transactions & Paystack hook]
│   └── MeterContext.tsx                 [REFACTORED - Clean orchestrator & facade]
├── screens/
│   ├── SuperAdminDashboard.tsx          [REFACTORED - Reduced from 1,240 lines to ~160 lines]
│   ├── LandingScreen.tsx                [REFACTORED - Reduced from 803 lines to ~90 lines]
│   └── ...
├── services/
│   ├── paymentService.ts                [NEW - Paystack script loading & transaction handling]
│   ├── supabase/
│   │   ├── adminService.ts              [NEW - Fleet queries & admin RPCs]
│   │   ├── billingService.ts            [NEW - Transactions & budget tracking]
│   │   ├── client.ts                    [NEW - Supabase client initialization & health]
│   │   └── telemetryService.ts          [NEW - Live telemetry, logs, realtime subscriptions]
│   └── supabase.ts                      [REFACTORED - Backward-compatible re-export barrel]
└── utils/
    └── formatters.ts                    [Existing - formatPower, formatEnergy, formatCurrency]
```

---

## 4. Phased Task Breakdown

### Phase 1: Shared UI Primitives (`src/components/common/`)
- [x] **Task 1.1: Create `ModalWrapper.tsx`**
  - **Input**: `isOpen`, `onClose`, `title`, `subtitle`, `icon`, `children`, `maxWidth`.
  - **Output**: Accessible modal with backdrop blur, smooth fade-in, escape key and click-outside dismissal, and mobile-safe padding.
  - **Verify**: Renders cleanly and handles close events.
- [x] **Task 1.2: Create `PinAuthModal.tsx`**
  - **Input**: `isOpen`, `onClose`, `onSuccess`, `title`, `actionLabel`, `isSubmitting`.
  - **Output**: 4-digit PIN form with auto-clear, error states, and quick-fill helper.
  - **Verify**: Validates PIN input and triggers callback.
- [x] **Task 1.3: Create `StatusBadge.tsx`**
  - **Input**: Type (`grid` | `contactor` | `tamper`), value, size.
  - **Output**: Standardized semantic badge with consistent color schemes.
  - **Verify**: Correct styling for all variants.

### Phase 2: Service Segregation (`src/services/`)
- [x] **Task 2.1: Modularize Supabase Services into `src/services/supabase/`**
  - Split `supabase.ts` into `client.ts`, `telemetryService.ts`, `adminService.ts`, and `billingService.ts`.
  - Export all functions through `src/services/supabase/index.ts` and maintain `src/services/supabase.ts` as a re-export barrel.
  - **Verify**: Existing imports throughout the codebase continue to compile without path errors.
- [x] **Task 2.2: Extract Paystack Integration into `paymentService.ts`**
  - Encapsulate external Paystack inline script injection, public key retrieval, and modal event callbacks.
  - **Verify**: `fundWalletWithPaystack` cleanly utilizes `paymentService.ts`.

### Phase 3: Super Admin Dashboard Component Decomposition
- [x] **Task 3.1: Extract Admin Modals into `src/components/admin/`**
  - Create `AdminRelayModal.tsx`, `AdminConfigModal.tsx`, `AdminBulkTariffModal.tsx`, `AdminAdjustUnitsModal.tsx`.
  - Each modal utilizes `ModalWrapper` and `PinAuthModal` where appropriate.
  - **Verify**: Each modal opens, takes input, and completes action via admin RPC.
- [x] **Task 3.2: Extract Fleet Grid Components into `src/components/admin/`**
  - Create `FleetKpiBanner.tsx`, `FleetSearchToolbar.tsx`, and `SubmeterCard.tsx`.
  - **Verify**: Fleet KPIs compute correctly; search & filter tabs work; submeter cards render live load using `formatPower`.
- [x] **Task 3.3: Refactor `SuperAdminDashboard.tsx`**
  - Assemble the screen using the newly created components.
  - **Verify**: File size drops from 1,240 lines to ~308 lines; dashboard functions identically.

### Phase 4: Landing Screen Modularization
- [x] **Task 4.1: Extract Landing Page Sections into `src/components/landing/`**
  - Create `LandingNav.tsx`, `LandingHero.tsx`, `LandingTelemetryDemo.tsx`, `LandingFeatures.tsx`, `LandingHardwareSpecs.tsx`, `LandingMobileDownload.tsx`, `LandingFaq.tsx`, and `LandingQrModal.tsx`.
- [x] **Task 4.2: Refactor `LandingScreen.tsx`**
  - Assemble sections cleanly.
  - **Verify**: File size drops from 803 lines to ~134 lines; full landing page layout, responsive design, APK download, and FAQ accordion function seamlessly.

### Phase 5: Context Modularization & State Slicing
- [x] **Task 5.1: Extract Domain Hooks in `src/context/hooks/`**
  - Extract `useMeterTelemetry.ts` (live stream, subscriptions, 2s polling).
  - Extract `useFleetManagement.ts` (fleet meters, admin RPC dispatches).
  - Extract `useWalletBilling.ts` (wallet transactions, Paystack top-ups).
- [x] **Task 5.2: Streamline `MeterContext.tsx`**
  - Compose the domain hooks inside `MeterProvider`.
  - Expose the unified `useMeter()` interface for full backward compatibility.
  - **Verify**: Context file size drops from 1,224 to 552 lines; all screens receive their expected state slices.

---

## 5. Verification & Testing Plan

1. **TypeScript & Bundling**:
   - Command: `npm run build` (`tsc && vite build`)
   - Criteria: 0 TypeScript compilation errors, 0 unused imports, clean bundle generation.
2. **Capacitor Mobile Sync**:
   - Command: `npx cap sync android`
   - Criteria: Web dist copies and Capacitor Android plugins sync in $< 1\text{s}$.
3. **Runtime & Feature Validation**:
   - Verify Super Admin Portal:
     - Search & filter submeters.
     - Contactor relay toggle modal with PIN.
     - Submeter configuration modal.
     - Bulk tariff update modal.
     - Adjust prepaid units modal.
   - Verify Landing Page:
     - Nav smooth scrolling.
     - Live telemetry demo.
     - Hardware pinout specs.
     - Mobile APK download trigger and QR code modal.
     - FAQ accordion expansion/collapse.
   - Verify Client App:
     - Live telemetry updates (2-second interval).
     - Flexible Watts / kW scaling.
     - Main supply cutoff toggle.
     - Outage history and tamper alerts.
