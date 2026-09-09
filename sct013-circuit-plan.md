# Circuit & Firmware Plan: Interfacing SCT-013 Current Sensor with ESP32

**Project:** Voltrix Smart Energy Meter  
**Target Microcontroller:** ESP32-WROOM-32 (30-pin / 38-pin DevKit)  
**Sensor:** YHDC SCT-013 Split-Core Current Transformer  
**ADC Pin:** `GPIO 35` (ADC1 Channel 7 — Wi-Fi safe)  

---

## 1. Overview & Problem Statement

The YHDC SCT-013 is an inductive split-core current transformer that clamps around an AC mains line. It outputs an alternating current or voltage proportional to the load current.

### Physical & Electrical Challenges
1. **Alternating Current (AC) Negative Swing:**  
   AC waveforms cycle through positive and negative polarities. The ESP32 internal Analog-to-Digital Converter (ADC) **only accepts $0\text{V}$ to $3.3\text{V}$ DC**. Feeding negative voltages directly into an ESP32 pin will clip the waveform, cause corrupted data, and permanently degrade or destroy the internal ADC multiplexer silicon.
2. **ADC Selection Conflict (Wi-Fi vs ADC2):**  
   The ESP32 has two ADC units: ADC1 and ADC2. The Wi-Fi subsystem relies on ADC2; whenever Wi-Fi transmission occurs (which happens every 5 seconds when streaming telemetry to Supabase), all ADC2 pins (`GPIO 0, 2, 4, 12, 13, 14, 15, 25, 26, 27`) fail to read or cause Wi-Fi brownouts. **Only ADC1 pins (`GPIO 32 - 39`) can be safely used.**
3. **Sensor Variant Discrepancy:**  
   - **`SCT-013-000`**: Current output ($100\text{A} : 50\text{mA}$). Requires an external **Burden Resistor** ($R_{\text{burden}}$) to convert current to voltage.
   - **`SCT-013-030` / `050` / `020`**: Voltage output ($30\text{A} : 1\text{V}_{\text{RMS}}$). Has a built-in internal burden resistor; **no external burden resistor may be added**.

---

## 2. Signal Conditioning Circuit Architecture

To safely read the sensor with the ESP32, we introduce a **DC Bias Midpoint Circuit**:
- Two $10\text{k}\Omega$ 1% precision metal film resistors form a voltage divider between $+3.3\text{V}$ and $\text{GND}$, setting a virtual ground at **$+1.65\text{V}$**.
- A $10\mu\text{F}$ electrolytic capacitor bypasses AC ripple on the virtual ground to physical $\text{GND}$, creating a stiff, low-impedance reference.
- One leg of the SCT-013 connects to this $1.65\text{V}$ reference, while the other leg connects to `GPIO 35`.
- The AC signal now oscillates around $+1.65\text{V}$ (e.g. between $0.65\text{V}$ and $2.65\text{V}$), remaining comfortably within the ESP32's $0\text{--}3.3\text{V}$ safe window.

## 3. Circuit Schematic & Visual Breadboard Wiring

![ESP32 to Single YHDC SCT-013-000 Breadboard Setup](C:/Users/kingaustin/.gemini/antigravity-ide/brain/bedbff4d-1d70-42b7-b90a-961fe70b8a92/sct013_single_sensor_breadboard_1788904290883.jpg)

```
                          ESP32 +3.3V Pin
                                 │
                                [R1] 10kΩ (1% metal film)
                                 │
                                 ├─────────────────────────────────┐
                                 │                                 │
                                [C1] 10µF Capacitor                │
                                 │   (Electrolytic,                │
                                 │    + to 1.65V, - to GND)        │
                                 │                                 │
                          ESP32 GND Pin                            │
                                                                   │
                                                SCT-013            │
                                            3.5mm Audio Jack       │
                                            ┌──────────────┐       │
         (Virtual Ground: 1.65V DC)         │              │       │
       ─────────────────────────────────────┤ Sleeve    Tip├───────┴──────► ESP32 GPIO 35 (ADC1_CH7)
                                            │      Ring    │
                                            └──────┬───────┘
                                                   │
                                  ┌────────────────┴────────────────┐
                                  │   FOR SCT-013-000 ONLY:         │
                                  │   Add [R_burden] = 22Ω - 33Ω    │
                                  │   across Tip and Sleeve.        │
                                  │   (DO NOT ADD for SCT-013-030!) │
                                  └─────────────────────────────────┘
```

### 3.5mm Audio Jack Pinout
- **Tip (Left channel)**: AC Sensor Signal Output $\to$ Connects to ESP32 **`GPIO 35`**.
- **Sleeve (Ground/Base)**: AC Return Reference $\to$ Connects to **$1.65\text{V}$ DC Virtual Ground**.
- **Ring (Right channel)**: Unconnected in standard YHDC 2-core cables (internally connected to sleeve or floating).

---

## 4. Burden Resistor Selection Guide

| Sensor Model | Output Type | Built-in Burden? | External Resistor Required? | Calculation / Value |
| :--- | :--- | :---: | :---: | :--- |
| **SCT-013-000** | Current ($100\text{A}:50\text{mA}$) | ❌ NO | **✅ YES** | **$22\Omega\text{--}33\Omega$** ($1/4\text{W}$ or $1/2\text{W}$, 1% tolerance) |
| **SCT-013-030** | Voltage ($30\text{A}:1\text{V}_{\text{RMS}}$) | **✅ YES** | ❌ NO | **None** (direct connection) |
| **SCT-013-050** | Voltage ($50\text{A}:1\text{V}_{\text{RMS}}$) | **✅ YES** | ❌ NO | **None** (direct connection) |
| **SCT-013-020** | Voltage ($20\text{A}:1\text{V}_{\text{RMS}}$) | **✅ YES** | ❌ NO | **None** (direct connection) |

### Calculating $R_{\text{burden}}$ for SCT-013-000:
1. Max primary current: $I_{\text{primary\_RMS}} = 30\text{A}$ (typical home max)
2. CT Turns ratio: $N = 2000 \implies I_{\text{secondary\_RMS}} = 30 / 2000 = 0.015\text{A} = 15\text{mA}$
3. Peak secondary current: $I_{\text{secondary\_peak}} = 15\text{mA} \times \sqrt{2} \approx 21.21\text{mA}$
4. Desired peak voltage swing across burden: $1.0\text{V}_{\text{peak}}$ (leaves $0.65\text{V}$ headroom below $3.3\text{V}$ rails)
5. $R_{\text{burden}} = \frac{V_{\text{peak}}}{I_{\text{secondary\_peak}}} = \frac{1.0\text{V}}{0.02121\text{A}} \approx 47.1\Omega$ (or **$33\Omega$** for up to 45A peak).

---

## 5. Bill of Materials (BOM)

| Item | Component | Specification | Quantity | Purpose |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Current Sensor** | YHDC SCT-013 (000 or 030 model) | 1 | Non-invasive AC inductive sensing |
| 2 | **Resistors $R_1, R_2$** | $10\text{ k}\Omega \pm 1\%$ Metal Film, $1/4\text{W}$ | 2 | Voltage divider for $1.65\text{V}$ DC bias |
| 3 | **Filter Capacitor $C_1$** | $10\mu\text{F} \pm 20\%$ Electrolytic ($16\text{V}\text{--}50\text{V}$) | 1 | Low-impedance AC ground & noise sink |
| 4 | **Burden Resistor $R_b$** | $22\Omega\text{--}33\Omega \pm 1\%$ Metal Film | 1 | (Only if using SCT-013-000) |
| 5 | **Audio Socket** | 3.5mm Stereo Female Audio Jack (PJ-307 or terminal block) | 1 | Clean solderless connection to sensor plug |
| 6 | **Jumper Wires & Breadboard** | Standard $0.1''$ pitch | 1 set | Bench prototyping |

---

## 6. Safety & Physical Installation Rules

> [!WARNING]
> ### 1. The Single-Wire Clamping Rule
> A Current Transformer functions via electromagnetic induction. 
> - **CORRECT:** Clamp around **ONLY the Live (Phase) wire OR ONLY the Neutral wire**.
> - **WRONG:** Clamping around a two-core household extension cord containing both Live and Neutral. When both conductors are clamped inside the same core, their equal and opposite magnetic fields cancel out completely, yielding an ADC reading of **0.00 A**.

> [!CAUTION]
> ### 2. Never Open-Circuit an SCT-013-000 Under Load
> If using the current-output `SCT-013-000`, **never disconnect the burden resistor while AC current is flowing through the primary wire**. An open-circuit CT develops very high voltage spikes across the secondary terminals that can destroy the insulation and pose an electric shock risk.

---

## 7. Firmware Integration Architecture

### 7.1 True RMS Algorithm (200ms Window)
Standard mains frequency in Nigeria/UK/EU is $50\text{Hz}$ ($T = 20\text{ms}$). Sampling across 10 complete grid cycles ($200\text{ms}$) eliminates fractional-cycle DC leakage errors:

$$\text{ADC Raw} \in [0, 4095] \implies V_{\text{instantaneous}} = \frac{\text{raw}}{4095.0} \times 3.3\text{V}$$

$$V_{\text{AC}} = V_{\text{instantaneous}} - V_{\text{bias}}$$

$$V_{\text{RMS}} = \sqrt{\frac{1}{N}\sum_{i=1}^{N} (V_{\text{AC}, i})^2}$$

$$I_{\text{RMS}} = V_{\text{RMS}} \times \text{Calibration Factor}$$

### 7.2 Low-Load Noise Floor Suppression
To prevent the high-sensitivity 12-bit ADC from showing ghost phantom current (e.g. $0.05\text{--}0.12\text{A}$) due to ambient electromagnetic noise:
```cpp
if (currentRMS < NOISE_FLOOR_AMPS) {
  currentRMS = 0.0f;
}
```

### 7.3 File Modifications Required
1. **`Hardware/src/config.h`**:
   - `#define CURRENT_SENSOR_PIN 35`
   - `#define ENABLE_PHYSICAL_CURRENT_SENSOR true`
   - `#define CURRENT_CALIBRATION 30.0f`
   - `#define NOISE_FLOOR_AMPS 0.15f`
2. **`Hardware/src/sensors.h` & `Hardware/src/sensors.cpp`**:
   - Implement `float readTrueRMSCurrent(uint16_t sampleCycles = 10);`
   - Dynamically compute $V_{\text{bias}}$ to eliminate resistor tolerance drift.
   - Calculate Active Power $P = V \times I_{\text{RMS}} \times \text{PF}$ and Apparent Power $S = V \times I_{\text{RMS}}$.
3. **`Hardware/Hardware.ino`**:
   - Set `analogReadResolution(12);`
   - Set `analogSetAttenuation(ADC_11db);`
   - Stream verified $I_{\text{RMS}}$ to Supabase `record_telemetry`.

---

## 8. Step-by-Step Bench Verification Procedure

1. **Breadboard Check**:
   - Power ESP32 via USB.
   - Measure DC voltage with a Digital Multimeter between virtual ground (junction of $R_1, R_2, C_1$) and ESP32 GND.
   - Confirm reading is **$1.64\text{V}\text{--}1.66\text{V}$**.
2. **Zero-Load Noise Check**:
   - Plug the SCT-013 jack into the circuit with the clamp resting on the table (not clamped around any wire).
   - Open ESP32 Serial Monitor at $115200\text{ baud}$.
   - Confirm Serial reads: `I_RMS: 0.00 A | Power: 0.00 kW`.
3. **Known Resistive Load Test**:
   - Clamp the sensor around the single Live conductor of an appliance with a known wattage (e.g., an electric iron rated at $1000\text{W}$, or a kettle rated at $1500\text{W}$).
   - Expected current at $230\text{V}$: $I = \frac{1000\text{W}}{230\text{V}} = 4.35\text{A}$.
   - Check Serial Monitor; adjust `CURRENT_CALIBRATION` in `config.h` so the reading matches your handheld clamp meter within $\pm 1\%$.
4. **Cloud & Dashboard Verification**:
   - Verify that Supabase table `telemetry_logs` receives the live ampere and active power payload.
   - Verify web dashboard at `http://localhost:5173` immediately reflects the physical appliance load in real time.

---

## 9. Alternative Option: PZEM-004T v3.0 Dedicated Metering Module

![PZEM-004T v3.0 to ESP32 Hardware Wiring Diagram](C:/Users/kingaustin/.gemini/antigravity-ide/brain/bedbff4d-1d70-42b7-b90a-961fe70b8a92/pzem004t_esp32_wiring_1788904395251.jpg)

### Advantages of PZEM-004T
- **Zero Breadboard Components:** Eliminates bias resistors, bypass capacitor, and burden resistor.
- **True Mains Voltage Sensing:** Measures live grid voltage ($80\text{--}260\text{V}$ AC), unlocking real physical overvoltage/undervoltage protection.
- **Optically Isolated:** High-voltage AC side is galvanically separated from the ESP32 via optocouplers.
- **Hardware Energy Accumulation:** Kilowatt-hours ($\text{kWh}$) are tracked internally on the PZEM chip EEPROM.

### Connections
- **PZEM AC Terminals:** Connect to AC Mains Live (L) and Neutral (N).
- **PZEM CT Terminals:** Connect to the SCT-013 CT clamp leads.
- **PZEM Low Voltage Header:**
  - `VCC` $\to$ ESP32 **5V (VIN)**
  - `GND` $\to$ ESP32 **GND**
  - `TX` $\to$ ESP32 **GPIO 16 (RX2)**
  - `RX` $\to$ ESP32 **GPIO 17 (TX2)**

