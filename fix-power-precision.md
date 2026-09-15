# Fix Power Precision Issue

## Context
The user reported that the local hardware LCD shows a power reading of `5.7 W`, but the web dashboard displays `10 W`.

## Investigation & Root Cause
1. **Frontend Formatting (`CurrentPowerCard.tsx` / `formatters.ts`)**: The frontend expects `activePowerKw` in kilowatts and converts it to watts (by multiplying by 1000). If the value is under 1000W, it rounds it to the nearest whole number (e.g., `10 W`).
2. **Firmware Payload Serialization (`supabase_client.cpp`)**: The hardware firmware stores `activePower` internally in `kW`. When pushing telemetry to the backend, it formats the float using `String(readings.activePower, 2)` (2 decimal places). 
3. **The Math**: `5.7 W` is `0.0057 kW`. When formatting `0.0057` to 2 decimal places, the microcontroller's `String()` method rounds it up to `0.01 kW`. The backend receives `0.01`, and the frontend multiplies this by `1000` to get exactly `10 W`.

## Task Breakdown
- [ ] Modify `supabase_client.cpp` `pushTelemetry` function: Change `String(readings.activePower, 2)` to `String(readings.activePower, 4)` to support down to 0.1W precision.
- [ ] Modify `supabase_client.cpp` `pushOfflineRecords` function: Change `String(records[i].activePower, 2)` to `String(records[i].activePower, 4)` to support down to 0.1W precision.
- [ ] (Optional) Review and potentially bump precision for `current` (e.g. 3 decimal places for 1mA resolution) to ensure consistency.
- [ ] (Optional) Update `formatters.ts` in the frontend if the user wants to see fractional watts (e.g., `5.7 W`) instead of rounded whole watts (`6 W`).
- [ ] Rebuild and flash the hardware firmware.

## Verification Checklist
- [ ] Confirm the C++ JSON payload sends `0.0057` instead of `0.01`.
- [ ] Check the web dashboard UI to ensure it now accurately reflects the hardware LCD readings without premature rounding.

## Agent Assignment
- `orchestrator` / `TIER 1 (full)` to execute code changes.

