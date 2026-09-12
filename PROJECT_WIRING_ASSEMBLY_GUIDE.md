# Voltrix Smart Energy Meter - Complete Hardware Assembly & Wiring Guide

This document provides a comprehensive, step-by-step practical guide to assembling the IoT-Enabled Smart Energy Submeter, starting from the required components down to the physical wiring.

---

## 1. Bill of Materials (BOM) & Core Components

To build the complete hardware prototype, you will need the following components:

### A. Processing & Sensing
1. **ESP32-S3-WROOM-1 or ESP32-WROOM-32 Development Board**: The main dual-core microcontroller with Wi-Fi.
2. **PZEM-004T v3.0 AC Multi-Meter Module**: With 100A Split-Core or Solid-Core Current Transformer (CT).

### B. Power Actuation & Load Control
3. **30A High-Power Relay Module (SLA-05VDC-SL-A)**: Capable of switching up to 30 Amperes at 250V AC. Driven by a 5V logic signal. (Do *not* use a standard 10A blue relay for whole-house loads).

### C. Power Supply & Backup
4. **HLK-PM01 AC-DC Converter**: Steps down 100V-240V AC to an isolated 5V DC (3W / 0.6A).
5. *(Optional for UPS)* **TP4056 Lithium Battery Charger Module** & **18650 Li-Ion Battery (3.7V, 2600mAh)**.

### D. User Interface & Indication
6. **1602 LCD Display with I2C PCF8574 Backpack**: Displays voltage, wattage, and remaining units locally.
7. **3x 5mm LEDs (Red, Yellow, Green)**: For visual status indicators (Telemetry, Cloud Sync, Cutoff Alarm).
8. **3x 330Ω Resistors**: Current-limiting resistors for the LEDs.
9. **5V Active/Passive Piezo Buzzer**: For audible trip alarms.

### E. Security & Protection
10. **OMRON SS-5GL Microswitch (Plunger type)**: For the physical lid tamper detection.
11. **14D471K Metal Oxide Varistor (MOV)** & **10A Ceramic Fuse**: For surge suppression and short-circuit protection.

---

## 2. Low-Voltage DC Wiring (ESP32, LCD, Sensors)

Always wire the low-voltage components on the bench before connecting any High-Voltage AC lines. 

### A. Power Distribution
- Connect the **5V output** of the HLK-PM01 power supply to the **VIN / 5V** pin on the ESP32.
- Connect the **GND output** of the HLK-PM01 to the **GND** pin on the ESP32.
- *All other 5V and GND connections must share this common ground.*

### B. PZEM-004T Serial Connection (Modbus-RTU)
- **PZEM 5V** $\rightarrow$ ESP32 5V (or VIN)
- **PZEM GND** $\rightarrow$ ESP32 GND
- **PZEM TX** $\rightarrow$ ESP32 GPIO 16 (UART RX)
- **PZEM RX** $\rightarrow$ ESP32 GPIO 17 (UART TX)
*(Note: A 1kΩ resistor in series on the RX/TX lines is recommended for protection).*

### C. 1602 I2C LCD Display
- **LCD VCC** $\rightarrow$ ESP32 5V
- **LCD GND** $\rightarrow$ ESP32 GND
- **LCD SDA** $\rightarrow$ ESP32 GPIO 21
- **LCD SCL** $\rightarrow$ ESP32 GPIO 22

### D. 30A Power Relay Module (Logic Side)
- **Relay VCC / DC+** $\rightarrow$ ESP32 5V
- **Relay GND / DC-** $\rightarrow$ ESP32 GND
- **Relay IN (Signal)** $\rightarrow$ ESP32 GPIO 13

### E. Status LEDs & Buzzer
- **Green LED (Telemetry)**: ESP32 GPIO 26 $\rightarrow$ 330Ω Resistor $\rightarrow$ LED Anode (+). LED Cathode (-) $\rightarrow$ GND.
- **Yellow/Blue LED (Wi-Fi)**: ESP32 GPIO 27 $\rightarrow$ 330Ω Resistor $\rightarrow$ LED Anode (+). LED Cathode (-) $\rightarrow$ GND.
- **Red LED (Cutoff Alarm)**: ESP32 GPIO 14 $\rightarrow$ 330Ω Resistor $\rightarrow$ LED Anode (+). LED Cathode (-) $\rightarrow$ GND.
- **Buzzer (+)**: ESP32 GPIO 25. **Buzzer (-)**: GND.

### F. Tamper Microswitch
- **Switch Common (COM)** $\rightarrow$ ESP32 GND.
- **Switch Normally Open (NO)** $\rightarrow$ ESP32 GPIO 32. 
*(The ESP32 uses an internal `INPUT_PULLUP` resistor. When the lid is closed, the switch is pressed, connecting GPIO 32 to GND. When opened, it springs to 3.3V, triggering the alarm).*

---

## 3. High-Voltage AC Electrical Wiring

> ⚠️ **DANGER: LETHAL VOLTAGE**  
> Ensure the main breaker is OFF before assembling the AC side. Ensure all AC wiring uses appropriately rated copper wire (e.g., 4mm² or 6mm² for 30A loads). Keep High-Voltage AC wires physically separated from the 3.3V/5V DC logic wires.

### Step 1: Mains Input
Bring the incoming AC lines (from the grid) into the enclosure:
- **AC Live IN**
- **AC Neutral IN**

### Step 2: System Power Supply & Sensing Taps
Tap off the incoming Live and Neutral to power the system and provide voltage reference to the PZEM:
- Connect **AC Live IN** to the `L` input of the HLK-PM01 and the `V_IN` terminal of the PZEM-004T.
- Connect **AC Neutral IN** to the `N` input of the HLK-PM01 and the `V_IN` neutral terminal of the PZEM-004T.
*(Place the 10A fuse and the 14D471K MOV in parallel across the Live and Neutral tap going to the HLK-PM01 for surge protection).*

### Step 3: Routing Through the 30A Relay
The 30A relay acts as the main cutoff switch for the house load.
- Connect the **AC Live IN** to the **COM (Common)** terminal of the 30A Relay module.
- Run a heavy-gauge wire from the **NO (Normally Open)** terminal of the 30A Relay. This is now your **Switched Live Out**.

### Step 4: Routing Through the Current Transformer (CT)
- Take the **Switched Live Out** wire (coming from the relay's NO terminal) and pass it completely through the **PZEM-004T Current Transformer (CT) coil**. 
- After passing through the CT coil, this wire goes directly to the consumer's electrical distribution board as the **Load Live**.

### Step 5: Mains Neutral Routing
- Connect the incoming **AC Neutral IN** directly to the consumer's electrical distribution board as the **Load Neutral**. (The neutral does not pass through the relay or the CT coil).

---

## 4. Final Verification Checklist

Before applying AC mains power:
1. [ ] **Continuity Check**: Ensure absolutely NO continuity between the 5V/3.3V DC rails and the AC Live/Neutral rails using a multimeter.
2. [ ] **Relay State**: With no power applied, verify there is NO continuity between the relay COM and NO terminals.
3. [ ] **CT Coil Direction**: Ensure the load wire passes cleanly through the CT. The direction of flow determines the power factor sign; if readings are negative, flip the CT around on the wire.
4. [ ] **Enclosure Security**: Ensure no exposed AC copper is visible. Use heat shrink tubing on all high-voltage connections.

Once verified, apply AC power. The ESP32 should boot, connect to Wi-Fi (Yellow LED steady), start reading telemetry (Green LED pulsing), and if prepaid balance > 0 and voltage is safe, engage the 30A relay with an audible "CLICK", delivering power to the load.
