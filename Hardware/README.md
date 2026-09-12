# Voltrix Smart Energy Meter: ESP32 Hardware & Synchronization

Firmware and monitoring implementation for the **Voltrix Smart Energy Meter** powered by ESP32. Configured for 5-second interval cloud telemetry synchronization with Supabase and autonomous edge enforcement.

---

## 📁 Directory Structure

```
Hardware/
├── Hardware.ino              # Single-file Arduino IDE firmware sketch
├── platformio.ini            # PlatformIO build configuration
├── simulate_monitoring.js    # Node.js 5-second mock telemetry simulator
└── src/
    ├── config.h              # WiFi & Supabase API configuration
    ├── meter_state.h         # MeterState and SensorReadings structures
    ├── sensors.h / .cpp      # AC sensor sampling & tamper detection
    ├── supabase_client.h/.cpp# HTTPS PostgREST/RPC synchronization client
    └── main.cpp              # Modular PlatformIO entry point
```

---

## ⚡ Active Configuration

- **Target Supabase Project**: `Smart_energy_meter` (`kmosslvdjdhrjgvitctr`)
- **API URL**: `https://kmosslvdjdhrjgvitctr.supabase.co`
- **RPC Ingestion**: `/rest/v1/rpc/record_telemetry`
- **Wi-Fi SSID**: `testmode`
- **Wi-Fi Password**: `#kingaustin`
- **Default Meter ID**: `MTR-8A24-19F2`
- **Sending Interval**: Every `5000 ms` (5 seconds)

---

## 🔌 Hardware GPIO Pin Mapping (Verified PCB Layout)

| Pin | Direction / Mode | Peripheral | Header / Description |
| :--- | :--- | :--- | :--- |
| **GPIO 13** | Output | **Relay Contactor** | Header U2 (Active LOW trigger via bottom jumper) |
| **GPIO 25** | Output | **Audible Buzzer** | BUZZER Footprint (Active HIGH / 2kHz tone) |
| **GPIO 26** | Output | **LED 1 (Pulse)** | LED OUTPUTS Pin 1 (Energy / TX pulse) |
| **GPIO 27** | Output | **LED 2 (Status)** | LED OUTPUTS Pin 2 (System / Wi-Fi status) |
| **GPIO 14** | Output | **LED 3 (Alarm)** | LED OUTPUTS Pin 3 (Tamper / Trip alarm) |
| **GPIO 32** | Input (`INPUT_PULLUP`) | **SS-5GL Lid Switch** | Header CN1 (LOW = closed, HIGH = lid opened) |
| **GPIO 21** | I2C Data (`SDA`) | **1602/2004 LCD** | LCD Header Pin 3 (PCF8574 address `0x27`/`0x3F`) |
| **GPIO 22** | I2C Clock (`SCL`) | **1602/2004 LCD** | LCD Header Pin 2 |
| **GPIO 16** | UART2 RX (`RX2`) | **PZEM-004T v3.0** | PZEM Header Pin 3 (TX from sensor) |
| **GPIO 17** | UART2 TX (`TX2`) | **PZEM-004T v3.0** | PZEM Header Pin 2 (RX to sensor) |
| **VIN / 5V**| DC Power Input | **5V Power Rail** | Header CN2 Pin 2 |
| **GND** | DC Return | **Common Ground** | Header CN2 Pin 1 |

---

## 🚀 Option 1: Flashing with Arduino IDE

1. **Install ESP32 Board Support**:
   - In Arduino IDE, go to **File** > **Preferences**.
   - In *Additional Board Manager URLs*, add:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to **Tools** > **Board** > **Boards Manager**, search for `esp32` by *Espressif Systems*, and install.

2. **Install Required Library**:
   - Go to **Tools** > **Manage Libraries...**
   - Search for **`ArduinoJson`** (by *Benoit Blanchon*) and click **Install** (v6.x or v7.x).

3. **Open Sketch**:
   - Open [`Hardware/Hardware.ino`](Hardware.ino) in Arduino IDE.

4. **Select Board & Port**:
   - Board: **ESP32 Dev Module** (or **ESP32S3 Dev Module**)
   - Flash Size: **4MB** or **8MB**
   - Upload Speed: **921600**
   - Select your USB COM port.

5. **Upload & Monitor**:
   - Click **Upload** (Ctrl + U).
   - Open **Serial Monitor** (Ctrl + Shift + M) and set baud rate to **`115200`**.
   - You will see the Wi-Fi connection progress and formatted telemetry outputs transmitted every 5 seconds.

---

## 💻 Option 2: Live Simulator (No Board Required)

You can test the exact same 5-second telemetry ingestion and watch the web dashboard update right now without plugging in the ESP32:

```bash
# Run continuously:
node Hardware/simulate_monitoring.js

# Or run 10 cycles (50 seconds):
node Hardware/simulate_monitoring.js --iterations 10
```
