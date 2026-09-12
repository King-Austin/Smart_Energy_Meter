# DESIGN AND IMPLEMENTATION OF AN IOT-ENABLED SMART ENERGY METER WITH CONSUMPTION ANALYTICS

---

### **Undergraduate Engineering Capstone Project Report & Technical Specification**
- **Academic Project Topic:** *Design and Implementation of an IoT-Enabled Smart Energy Meter with Consumption Analytics*
- **Academic Level:** Bachelor of Engineering (B.Eng.) / Final Year Capstone Thesis
- **Project Supervisor:** **Prof. Mrs. Okezie**
- **Hardware Revision:** v3.2.0 Live Hardware-in-the-Loop Prototype
- **Software Revision:** Voltrix Web Dashboard & Native Android APK (Capacitor v8)

---

## TABLE OF CONTENTS

1. [CHAPTER 1: INTRODUCTION & PROJECT BACKGROUND](#chapter-1-introduction--project-background)
   - 1.1 Problem Statement & Background
   - 1.2 Aim and Objectives of the Project
   - 1.3 Scope and Significance of the Work
   - 1.4 Academic Supervision & Departmental Context
2. [CHAPTER 2: SYSTEM ARCHITECTURE & BLOCK DIAGRAM](#chapter-2-system-architecture--block-diagram)
   - 2.1 High-Level Conceptual Block Diagram
   - 2.2 Hardware-Firmware-Cloud Coordination
   - 2.3 Elimination of the 20-Digit STS Token Paradigm
3. [CHAPTER 3: HARDWARE DESIGN & COMPONENT SPECIFICATIONS](#chapter-3-hardware-design--component-specifications)
   - 3.1 Microcontroller Unit: ESP32-WROOM-32
   - 3.2 Power Metering Sensor: PZEM-004T v3.0 True-RMS
   - 3.3 Power Actuator: 30A High-Power Relay Module
   - 3.4 Display Subsystem: 1602 I2C LCD (PCF8574)
   - 3.5 Physical Enclosure Security: SS-5GL Tamper Switch
   - 3.6 Audible Alarm & Visual Status Indicators
   - 3.7 Regulated DC Power Supply Unit
4. [CHAPTER 4: ELECTRICAL WIRING, PINOUT & SCHEMATIC ANALYSIS](#chapter-4-electrical-wiring-pinout--schematic-analysis)
   - 4.1 Master GPIO Allocation Table
   - 4.2 Physical Header Pinout Mapping (Top-to-Bottom)
   - 4.3 High-Voltage AC Electrical Wiring Diagram
   - 4.4 Low-Voltage DC Control & Optocoupler Isolation
5. [CHAPTER 5: EMBEDDED FIRMWARE & EDGE LOGIC DESIGN](#chapter-5-embedded-firmware--edge-logic-design)
   - 5.1 FreeRTOS Multitasking Architecture
   - 5.2 PZEM Modbus-RTU Communication Protocol
   - 5.3 Autonomous Safety Guardrails & Sub-200ms Cutoff Algorithm
   - 5.4 Non-Volatile Storage (NVS) & Offline Energy Depreciation
   - 5.5 Wi-Fi Reconnection & Telemetry State Machine
6. [CHAPTER 6: IOT CLOUD BACKEND & DATABASE ARCHITECTURE](#chapter-6-iot-cloud-backend--database-architecture)
   - 6.1 PostgreSQL Relational Schema (Supabase)
   - 6.2 Real-Time WebSocket Telemetry Channel
   - 6.3 Security, Authentication & Row Level Security (RLS)
7. [CHAPTER 7: TOKENLESS AUTOMATED BILLING & PAYSTACK INTEGRATION](#chapter-7-tokenless-automated-billing--paystack-integration)
   - 7.1 Mathematical Tariff-to-Energy Conversion Model
   - 7.2 Zero STS Token Recharging Workflow
   - 7.3 Paystack Payment Gateway & Test Key Simulation Architecture
   - 7.4 Automatic Contactor/Relay Re-Arming on Payment Confirmation
8. [CHAPTER 8: FRONTEND DASHBOARD & MOBILE CLIENT DESIGN](#chapter-8-frontend-dashboard--mobile-client-design)
   - 8.1 Modern Minimalist Design System (Dual Light/Dark Theme)
   - 8.2 Interactive Slideshow & Telemetry Visualizer
   - 8.3 Cross-Platform Architecture: Vite + React + Capacitor Android
9. [CHAPTER 9: ARTIFICIAL INTELLIGENCE ENERGY ADVISOR](#chapter-9-artificial-intelligence-energy-advisor)
   - 9.1 AI Context Ingestion & Prompt Pipeline
   - 9.2 Real-Time Consumption Profiling & Anomaly Detection
   - 9.3 End-of-Month Budget Forecasting Algorithm
10. [CHAPTER 10: EXPERIMENTAL TESTING, CALIBRATION & RESULTS](#chapter-10-experimental-testing-calibration--results)
    - 10.1 Sensor Accuracy Benchmarking (vs. FLUKE True-RMS Multimeter)
    - 10.2 Relay Cutoff Response Latency Test
    - 10.3 Cloud Sync & Payment Latency Test
    - 10.4 Offline Autonomy & Resilience Under Grid Outage
11. [CHAPTER 11: CONCLUSION & FUTURE RECOMMENDATIONS](#chapter-11-conclusion--future-recommendations)
    - 11.1 Concluding Remarks
    - 11.2 Key Contributions of the Research
    - 11.3 Recommendations for Future Work

---

## CHAPTER 1: INTRODUCTION & PROJECT BACKGROUND

### 1.1 Problem Statement & Background
Conventional electrical energy meters deployed in residential and commercial sub-metering systems face three fundamental limitations:
1. **The Friction of Standard Transfer Specification (STS) Prepaid Keypads:** Traditional prepaid meters require users to purchase a paper or SMS voucher containing a 20-digit STS token. The consumer must then manually type these 20 digits onto a deteriorating physical keypad on the wall. Errors in entry, lost voucher slips, and keypad membrane failure cause frequent power lockouts.
2. **Absence of Real-Time Visibility:** Consumers only discover their balance is exhausted when the power abruptly cuts off. Traditional meters lack real-time load analytics, wattage profiling, and automated alerts.
3. **Lack of Autonomous Edge Protective Guardrails:** Power grids in developing regions frequently suffer from violent voltage surges (>260V) and brownouts (<180V). Traditional meters do not protect consumer appliances from these surges; instead, domestic electronic equipment is routinely destroyed.

### 1.2 Aim and Objectives of the Project
The primary aim of this undergraduate thesis is to **design and implement an IoT-enabled smart energy submeter with consumption analytics and autonomous protection**, completely eliminating physical 20-digit voucher tokens.

Specific engineering objectives include:
- Designing an edge IoT metering unit using the **ESP32-WROOM-32** and **PZEM-004T v3.0** sensor to sample True-RMS AC voltage, current, active power, and frequency at 50Hz.
- Implementing an autonomous safety cutoff subsystem utilizing a **30A High-Power Relay Module** actuated via GPIO 13 within sub-200ms latency during line overvoltage or zero-unit exhaustion.
- Engineering a **Tokenless Automated Smart Recharging Pipeline** using the **Paystack API**, where tariff-derived kilowatt-hours ($kWh$) are credited directly to the hardware over secure IoT synchronization.
- Building a cross-platform progressive web application and **native Android APK** with Apple-grade dual-theme aesthetics (Light and Dark modes).
- Integrating an **Embedded AI Energy Advisor** that provides natural-language energy forecasting, anomaly alerts, and load profiling.

### 1.3 Scope and Significance of the Work
The project delivers a fully working hardware-in-the-loop prototype alongside production-ready cloud and mobile client applications. It is tailored specifically for sub-tenants, residential estates, private landlords, and multi-unit complexes seeking transparent energy accounting without STS keypad friction.

### 1.4 Academic Supervision & Departmental Context
- **Project Topic:** *Design and Implementation of an IoT-Enabled Smart Energy Meter with Consumption Analytics*
- **Academic Supervisor:** **Prof. Mrs. Okezie**
- **Project Role:** Undergraduate Final Year Engineering Capstone Prototype

---

## CHAPTER 2: SYSTEM ARCHITECTURE & BLOCK DIAGRAM

### 2.1 High-Level Conceptual Block Diagram

```
+-------------------------------------------------------------------------------+
|                             MAINS AC SUPPLY (220V, 50Hz)                      |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
                     +-------------------------------------+
                     |     PZEM-004T v3.0 Sensor Module    |
                     |  - Voltage Sampling (80-260V AC)    |
                     |  - Current CT Coil (0-100A AC)      |
                     +------------------+------------------+
                                        | (UART2 Modbus-RTU)
                                        v
+--------------------+       +----------------------+       +--------------------+
| SS-5GL Tamper Sw.  | ----> |   ESP32-WROOM-32     | ----> | 30A Power Relay    |
| (GPIO 32 Pull-Up)  |       |   - Dual-Core 240MHz |       | Module (GPIO 13)   |
+--------------------+       |   - FreeRTOS Engine  |       +---------+----------+
                             +----------+-----------+                 |
                                        | (Wi-Fi WebSocket/REST)      v
                                        v                    +-------------------+
                             +----------------------+        | Household AC Load |
                             | Supabase Cloud / DB  |        +-------------------+
                             +----------+-----------+
                                        |
                                        v
                    +---------------------------------------+
                    |  Web Dashboard & Native Android App   |
                    |  - Live Sub-Second Telemetry          |
                    |  - Tokenless Paystack Recharge        |
                    |  - Voltrix AI Energy Advisor          |
                    +---------------------------------------+
```

### 2.2 Hardware-Firmware-Cloud Coordination
1. **Edge Metering:** The PZEM-004T samples AC parameters and transmits binary telemetry over UART2 (GPIO 16/17) to the ESP32.
2. **Edge Decision:** The ESP32 evaluates live voltage and prepaid balance against safety thresholds. If voltage exceeds the cutoff (e.g. 250V), it immediately pulls GPIO 13 HIGH, de-energizing the 30A relay.
3. **Cloud Synchronization:** Validated telemetry frames are batched and dispatched via WebSockets to Supabase PostgreSQL every 2.5 seconds.
4. **Client Interface:** The web and Android client display real-time graphs, allows remote relay control, and executes tokenless recharges.

### 2.3 Elimination of the 20-Digit STS Token Paradigm
In legacy STS systems:
$$\text{Payment} \longrightarrow \text{Token Generation Algorithm} \longrightarrow \text{20-Digit String} \longrightarrow \text{Manual Keypad Input} \longrightarrow \text{Meter Acceptance}$$

In the Voltrix Smart Architecture:
$$\text{Payment via Paystack} \longrightarrow \text{Exact Units Calculated} \longrightarrow \text{Direct IoT Hardware Balance Increment} \longrightarrow \text{Immediate Contactor Re-Arm}$$

---

## CHAPTER 3: HARDWARE DESIGN & COMPONENT SPECIFICATIONS

### 3.1 Microcontroller Unit: ESP32-WROOM-32 (NodeMCU-32S)
- **Core Architecture:** Xtensa Dual-Core 32-bit LX6 microprocessor operating at 240 MHz.
- **Memory:** 520 KB internal SRAM, 4 MB external SPI Flash memory.
- **Wireless Connectivity:** 802.11 b/g/n Wi-Fi (up to 150 Mbps) and Bluetooth v4.2 BR/EDR & BLE.
- **Operating Voltage:** 3.3V DC (5V supplied via on-board LDO regulator to VIN).
- **Justification:** High computational throughput to handle FreeRTOS scheduling, Modbus decoding, cryptographic TLS network handshakes, and sub-millisecond GPIO actuation concurrently.

### 3.2 Power Metering Sensor: PZEM-004T v3.0 True-RMS
- **Measurement Ranges:**
  - AC Voltage: 80.0 V to 260.0 V AC (Resolution: 0.1V, Accuracy: 0.5%).
  - AC Current: 0.000 A to 100.0 A AC via external Current Transformer (CT).
  - Active Power: 0.0 W to 23,000 W (Resolution: 0.1W, Accuracy: 0.5%).
  - Active Energy: 0.00 to 9999.99 kWh.
  - Grid Frequency: 45.0 Hz to 65.0 Hz (Resolution: 0.1Hz).
  - Power Factor: 0.00 to 1.00.
- **Communications:** Optically isolated UART interface operating at 9600 baud (8N1) implementing the Modbus-RTU protocol.

### 3.3 Power Actuator: 30A High-Power Relay Module
- **Model / Type:** SLA-05VDC-SL-A / Songle 30A Heavy-Duty Power Relay.
- **Contact Rating:** 30A @ 250V AC / 30A @ 30V DC.
- **Coil Voltage:** 5V DC.
- **Trigger Logic:** Active-LOW input driven by an on-board PC817 optocoupler and NPN driver transistor.
  - `LOW (0.0V)` at signal pin $\rightarrow$ Optocoupler activates $\rightarrow$ Relay coil energizes $\rightarrow$ Contacts CLOSED (Load Connected).
  - `HIGH (3.3V)` at signal pin $\rightarrow$ Optocoupler cuts off $\rightarrow$ Relay de-energizes $\rightarrow$ Contacts OPEN (Load Isolated).
- **Switching Speed:** Release time $<15\text{ ms}$, Mechanical endurance $>10^7$ cycles.
- **Correction Note:** This 30A module replaces oversized 60A/63A industrial contactors, drastically reducing physical enclosure volume and standby coil power consumption.

### 3.4 Display Subsystem: 1602 LCD with PCF8574 I2C Backpack
- **Display Matrix:** 16 characters $\times$ 2 lines, high-contrast monochrome with blue LED backlight.
- **Interface:** I2C bus using PCF8574 expander (Address: `0x27`).
- **Data Lines:** SDA connected to ESP32 `GPIO 21`, SCL connected to ESP32 `GPIO 22`.

### 3.5 Physical Enclosure Security: SS-5GL Tamper Switch
- **Switch Type:** OMRON SS-5GL snap-action subminiature microswitch.
- **Mounting:** Positioned on the internal enclosure lid rim.
- **Logic:** Connected to ESP32 `GPIO 32` configured as `INPUT_PULLUP`.
  - Lid closed: Switch lever depressed $\rightarrow$ `GPIO 32` pulled to `GND (LOW)`.
  - Lid breached: Switch lever released $\rightarrow$ `GPIO 32` pulled to `3.3V (HIGH)` $\rightarrow$ Tamper interrupt fired $\rightarrow$ Relay cutoff & cloud alert.

### 3.6 Audible Alarm & Visual Status Indicators
- **Buzzer:** 5V continuous/passive piezoelectric buzzer driven via `GPIO 25` for audible trip alarms.
- **LED 1 (Pulse / Telemetry):** `GPIO 26` (Flashes proportionally to power consumption).
- **LED 2 (System / Wi-Fi):** `GPIO 27` (Solid when cloud IoT connection is healthy).
- **LED 3 (Alarm / Cutoff):** `GPIO 14` (Illuminates solid red during overvoltage or tamper trip).
- **Current-Limiting Resistors:** $330\,\Omega$ metal-film resistors in series with each LED anode.

### 3.7 Regulated DC Power Supply Unit
- **AC-DC Converter:** HLK-PM01 / 5V 2A isolated switching step-down converter.
- **Input:** 100V - 240V AC, 50/60Hz.
- **Output:** 5.0V DC $\pm 2\%$, 2000mA max.
- **Distribution:** Powers ESP32 VIN, LCD backlight, PZEM-004T logic, and 30A relay coil.

---

## CHAPTER 4: ELECTRICAL WIRING, PINOUT & SCHEMATIC ANALYSIS

### 4.1 Master GPIO Allocation Table

| ESP32 Pin | GPIO | Mode | Connected Peripheral | Connector Header | Electrical Operation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **D13** | `GPIO 13` | Output | **30A Power Relay Module** | U2 Relay Header (Pin 3) | **Active-LOW:** `LOW` = Relay Closed (ON), `HIGH` = Relay Open (OFF) |
| **D25** | `GPIO 25` | Output | **Audible Alarm Buzzer** | BUZZER Footprint (Right) | **Active-HIGH:** 2kHz tone on cutoff trip or tamper alert |
| **D26** | `GPIO 26` | Output | **LED 1 (Pulse/Telemetry)** | LED OUTPUTS (Pin 1) | **Active-HIGH:** Energy pulse indicator |
| **D27** | `GPIO 27` | Output | **LED 2 (Wi-Fi/Cloud Sync)**| LED OUTPUTS (Pin 2) | **Active-HIGH:** Solid on active WebSocket connection |
| **D14** | `GPIO 14` | Output | **LED 3 (Cutoff/Alarm)** | LED OUTPUTS (Pin 3) | **Active-HIGH:** Solid on overvoltage, tamper, or zero balance |
| **D32** | `GPIO 32` | Input | **SS-5GL Lid Tamper Switch** | CN1 Header (Bottom pad) | `INPUT_PULLUP`: `LOW` = Lid Secure, `HIGH` = Lid Tampered |
| **D21** | `GPIO 21` | I2C SDA | **1602 LCD Display** | LCD Header (Pin 3) | PCF8574 I2C Serial Data line |
| **D22** | `GPIO 22` | I2C SCL | **1602 LCD Display** | LCD Header (Pin 2) | PCF8574 I2C Serial Clock line |
| **D16** | `GPIO 16` | UART RX | **PZEM-004T (TXD Pin)** | PZEM Header (Pin 3) | 9600 baud Modbus-RTU receiver |
| **D17** | `GPIO 17` | UART TX | **PZEM-004T (RXD Pin)** | PZEM Header (Pin 2) | 9600 baud Modbus-RTU transmitter |
| **VIN** | `VIN` | Power | **+5V DC Rail** | CN2 Header (Bottom pad) | Main system DC power input |
| **GND** | `GND` | Ground | **Common System GND** | CN2 Header (Top pad) | Common return reference rail |

### 4.2 Physical Header Pinout Mapping (Top-to-Bottom)

```
+-------------------------------------------------------------------------------+
| HEADER IDENTIFIER       | PIN 1 (Top)  | PIN 2        | PIN 3        | PIN 4  |
+-------------------------+--------------+--------------+--------------+--------+
| 1. LCD Header (4-Pin)   | +5V VCC      | SCL (D22)    | SDA (D21)    | GND    |
| 2. PZEM Header (4-Pin)  | +5V VCC      | PZEM RX(D17) | PZEM TX(D16) | GND    |
| 3. LED Outputs (4-Pin)  | LED 1 (D26)  | LED 2 (D27)  | LED 3 (D14)  | GND    |
| 4. U2 Relay (3-Pin)     | Spare        | GND          | Trigger(D13) | --     |
| 5. CN1 Tamper (2-Pin)   | GND          | Signal (D32) | --           | --     |
| 6. CN2 5V Power (2-Pin) | GND          | +5V DC IN    | --           | --     |
+-------------------------------------------------------------------------------+
```

### 4.3 High-Voltage AC Electrical Wiring Diagram

```
MAINS AC IN (LIVE) -----[30A FUSE]-----+
                                       |
                                       v
                             +-------------------+
                             |  30A POWER RELAY  |
                             |  - COM Contact    |
                             |  - NO Contact     |
                             +---------+---------+
                                       |
                                       v (Switched Live)
                             +---------+---------+
                             |   PZEM CT COIL    | ----> (Load Wire Passes Through)
                             +---------+---------+
                                       |
                                       v
                             LOAD AC LIVE TERMINAL

MAINS AC IN (NEUTRAL) -----------------+----------------> LOAD AC NEUTRAL TERMINAL
                                       |
                                       +----------------> PZEM-004T Neutral Sense
```

---

## CHAPTER 5: EMBEDDED FIRMWARE & EDGE LOGIC DESIGN

### 5.1 FreeRTOS Multitasking Architecture
The ESP32 firmware executes on FreeRTOS with four dedicated concurrent tasks:
1. `Task_PzemAcquisition` (Priority 3, Core 1, Execution: 500ms): Polls Modbus registers, verifies 16-bit CRC, updates volatile telemetry structs.
2. `Task_SafetyGuardrail` (Priority 4, Core 1, Execution: 50ms): Compares line voltage against `max_voltage_limit`. If $V_{\text{line}} > V_{\text{max}}$, drives GPIO 13 HIGH in $<10\text{ ms}$.
3. `Task_TelemetrySync` (Priority 2, Core 0, Execution: 2500ms): Encodes JSON payload and pushes to cloud via WebSocket/REST.
4. `Task_LcdDisplay` (Priority 1, Core 0, Execution: 1000ms): Cycles through display pages (Voltage, Watts, Balance).

### 5.2 PZEM Modbus-RTU Frame Structure
- **Slave Address:** `0x01`
- **Function Code:** `0x04` (Read Input Registers)
- **Start Address:** `0x0000`
- **Register Count:** `0x000A` (10 Registers = Voltage, Current, Power, Energy, Frequency, PF)
- **CRC Check:** 16-bit Modbus CRC appended at bytes 7 and 8.

### 5.3 Autonomous Safety Guardrails & Sub-200ms Cutoff Algorithm

```cpp
void evaluateSafetyLimits(float liveVoltage, float balanceKwh) {
    // 1. Overvoltage Cutoff Check
    if (liveVoltage >= protectionSettings.max_voltage_limit) {
        actuateRelay(false); // Disconnect 30A relay immediately
        tripReason = TRIP_OVERVOLTAGE;
        digitalWrite(PIN_LED_ALARM, HIGH);
        triggerAlarmBuzzer(true);
        return;
    }
    
    // 2. Brownout Protection Check
    if (liveVoltage <= protectionSettings.min_voltage_limit && liveVoltage > 40.0) {
        actuateRelay(false);
        tripReason = TRIP_BROWNOUT;
        return;
    }
    
    // 3. Zero Prepaid Balance Check
    if (balanceKwh <= 0.000) {
        actuateRelay(false);
        tripReason = TRIP_ZERO_BALANCE;
        return;
    }
}
```

### 5.4 Non-Volatile Storage (NVS) & Offline Depreciation
Prepaid units are depreciated locally every second:
$$\Delta E = P_{\text{active}} \times \Delta t = \frac{\text{Watts} \times 1\text{ s}}{3,600,000\text{ J/kWh}}$$
$$\text{Units}_{\text{remaining}} = \text{Units}_{\text{previous}} - \Delta E$$
Values are committed to ESP32 Flash NVS every 60 seconds (or immediately on power loss detection via brownout detector interrupt).

---

## CHAPTER 6: IOT CLOUD BACKEND & DATABASE ARCHITECTURE

### 6.1 PostgreSQL Relational Schema (Supabase)

```sql
-- 1. Meters Table
CREATE TABLE public.meters (
    meter_id VARCHAR(64) PRIMARY KEY,
    meter_name VARCHAR(128) NOT NULL,
    location VARCHAR(256),
    tariff_rate NUMERIC(10,2) DEFAULT 160.00,
    prepaid_units_kwh NUMERIC(12,4) DEFAULT 100.0000,
    main_supply_connected BOOLEAN DEFAULT TRUE,
    voltage_cutoff_tripped BOOLEAN DEFAULT FALSE,
    max_voltage_limit INTEGER DEFAULT 250,
    min_voltage_limit INTEGER DEFAULT 180,
    tamper_status VARCHAR(32) DEFAULT 'SECURE',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Telemetry Readings Log
CREATE TABLE public.meter_readings (
    id BIGSERIAL PRIMARY KEY,
    meter_id VARCHAR(64) REFERENCES public.meters(meter_id),
    voltage NUMERIC(6,2) NOT NULL,
    current NUMERIC(6,3) NOT NULL,
    active_power NUMERIC(8,2) NOT NULL,
    power_factor NUMERIC(4,2),
    frequency NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Billing & Transactions (Direct Recharges - No STS Tokens)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id VARCHAR(64) REFERENCES public.meters(meter_id),
    amount_paid NUMERIC(10,2) NOT NULL,
    units_credited_kwh NUMERIC(10,2) NOT NULL,
    tariff_rate NUMERIC(10,2) NOT NULL,
    payment_reference VARCHAR(128) UNIQUE NOT NULL,
    payment_channel VARCHAR(64) DEFAULT 'Paystack',
    status VARCHAR(32) DEFAULT 'SUCCESSFUL',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## CHAPTER 7: TOKENLESS AUTOMATED BILLING & PAYSTACK INTEGRATION

### 7.1 Mathematical Tariff-to-Energy Conversion Model
When a consumer initiates a recharge of amount $A$ (in Nigerian Naira, ₦):
$$\text{Tariff Rate } (T) = ₦160.00\text{ per kWh}$$
$$\text{Kilowatt-Hours Credited } (E_{\text{credit}}) = \frac{A}{T} = \frac{A}{160.00}$$
$$\text{Updated Hardware Balance } (B_{\text{new}}) = B_{\text{current}} + E_{\text{credit}}$$

*Example:* A payment of $₦5,000.00$ yields:
$$E_{\text{credit}} = \frac{5000}{160} = 31.25\text{ kWh}$$

### 7.2 Zero STS Token Recharging Workflow
Unlike traditional meters requiring a 20-digit numerical code typed on a physical wall keypad:
1. User enters $₦5,000$ in the mobile app.
2. System computes $+31.25\text{ kWh}$ dynamically.
3. User authorizes transaction via Paystack (Debit Card, Bank Transfer, or USSD).
4. Paystack returns successful transaction reference (`PST-...`).
5. Webhook / Client invokes `recordPaystackTransaction()` in Supabase.
6. Supabase atomically increments `prepaid_units_kwh` by $+31.25\text{ kWh}$.
7. ESP32 receives real-time WebSocket update, re-arms 30A relay switch, and displays updated balance on 1602 LCD in $<1.5\text{ seconds}$.

---

## CHAPTER 8: FRONTEND DASHBOARD & MOBILE CLIENT DESIGN

### 8.1 Modern Minimalist Design System (Dual Light/Dark Theme)
The frontend application was developed using **React 19**, **TypeScript**, and **Tailwind CSS**, strictly implementing Apple Human Interface Guidelines:
- **Light Theme:** Apple ceramic white (`#f8fafc` / `#ffffff`), slate typography (`#0f172a`), refined micro-borders (`#e2e8f0`), and soft floating elevations.
- **Dark Theme:** Obsidian slate (`#080a0f`), glassmorphism card surfaces (`bg-slate-900/80`), luminous orange accent glows (`#ff5b26`).
- **Typography:** Modern clean sans-serif pairing high-contrast numerical metrics with contextual descriptions.

### 8.2 Interactive Slideshow & Telemetry Visualizer
The landing page incorporates an automated, touch-optimized product showcase:
- Auto-advancing 5-stage carousel (every 5 seconds) highlighting:
  1. *Live Telemetry & 30A Relay Control* (`home_light.png`)
  2. *High-Resolution Consumption Analytics* (`energy_light.png`)
  3. *Voltrix AI Energy Advisor* (`ai_light.png`)
  4. *Zero-Token Direct Recharging* (`wallet_light.png`)
  5. *Surge & 30A Relay Protection* (`settings_light.png`)
- Animated filling progress bar on active slide pills.
- Mobile touch swipe detection (`onTouchStart`, `onTouchEnd`).
- Embedded interactive Paystack Test Checkout Simulator.

---

## CHAPTER 9: ARTIFICIAL INTELLIGENCE ENERGY ADVISOR

### 9.1 AI Context Ingestion & Prompt Pipeline
The Voltrix AI Advisor ingests live telemetry:
```json
{
  "voltage": 220.4,
  "active_load_watts": 185.0,
  "current_amps": 0.84,
  "power_factor": 0.96,
  "prepaid_units_kwh": 124.95,
  "daily_consumption_kwh": 1.28
}
```
The advisor processes this state through a specialized energy heuristics prompt to compute:
- **Estimated Runway:** $\text{Days Remaining} = \frac{124.95\text{ kWh}}{1.28\text{ kWh/day}} \approx 97\text{ days (or 12 days at full load)}$.
- **Standby Phantom Load Detection:** Flagging loads continuously drawing $>150\text{W}$ during off-peak night hours.
- **Tariff Forecast:** Projected monthly expenditure if current wattage is maintained.

---

## CHAPTER 10: EXPERIMENTAL TESTING, CALIBRATION & RESULTS

### 10.1 Sensor Accuracy Benchmarking
Tests conducted using standard resistive loads (100W incandescent lamp, 1000W heating element, 1800W kettle) measured simultaneously against a calibrated **FLUKE 87V True-RMS Digital Multimeter**:

| Test Parameter | Fluke 87V Reference | PZEM-004T Prototype | Absolute Error | Percentage Error (%) |
| :--- | :--- | :--- | :--- | :--- |
| **Grid Voltage (V)** | 221.8 V | 221.2 V | 0.6 V | **0.27%** |
| **Active Current (100W)** | 0.452 A | 0.450 A | 0.002 A | **0.44%** |
| **Active Current (1000W)**| 4.545 A | 4.510 A | 0.035 A | **0.77%** |
| **Active Power (1000W)** | 998.0 W | 992.5 W | 5.5 W | **0.55%** |
| **Frequency (Hz)** | 50.02 Hz | 50.00 Hz | 0.02 Hz | **0.04%** |

*Conclusion:* Overall metering accuracy is within **$\pm 0.8\%$**, easily surpassing IEC 62053-21 Class 1.0 residential metering standards.

### 10.2 Relay Cutoff Response Latency Test
- **Test Condition:** AC input stepped artificially from 220V to 258V using a variable autotransformer (Variac).
- **Overvoltage Threshold Set:** 250V.
- **Measured Response Times:**
  - PZEM Register Detection Time: $85\text{ ms}$
  - ESP32 Interrupt & Logic Processing: $<1\text{ ms}$
  - 30A Relay Mechanical Contact Separation: $12\text{ ms}$
  - **Total Cutoff Latency:** **$98\text{ ms}$ (Well within the $<200\text{ ms}$ safety target).**

---

## CHAPTER 11: CONCLUSION & FUTURE RECOMMENDATIONS

### 11.1 Concluding Remarks
The project successfully designed, prototyped, and validated an **IoT-Enabled Smart Energy Meter with Consumption Analytics**. By integrating the ESP32 microcontroller, PZEM-004T sensor, and an opto-isolated 30A power relay module with a modern cloud-synchronized web and Android application, the research successfully demonstrates:
1. Complete elimination of manual 20-digit STS keypad codes.
2. Sub-200ms autonomous protection against damaging grid overvoltage surges.
3. Real-time consumption visibility and predictive AI budgeting for end-users.

### 11.2 Key Contributions of the Research
- **Hardware-in-the-Loop Validation:** Delivery of a physical working prototype capable of switching up to 30A domestic AC circuits safely.
- **Unified Software Parity:** Seamless user experience across desktop browsers and native Android APK.
- **Scholarly Attribution:** Conducted under the academic supervision of **Prof. Mrs. Okezie**.

### 11.3 Recommendations for Future Work
- Implementation of physical split-meter architecture with wireless LoRa communication between the consumer in-home display and pole-mounted 30A relay enclosure.
- Expansion to polyphase (three-phase 415V) domestic distribution systems.
- Integration of edge tinyML models running directly on the ESP32 for appliance fingerprinting (Non-Intrusive Load Monitoring - NILM).

---
*End of Technical Thesis Report & Hardware Specification Document.*
