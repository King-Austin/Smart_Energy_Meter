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

## 🔌 Hardware GPIO Pin Mapping

| Pin | Function | Hardware Component | Description |
| :--- | :--- | :--- | :--- |
| **GPIO 23** | Output (50ms Pulse) | Contactor Set Coil | Latches relay to ON position |
| **GPIO 22** | Output (50ms Pulse) | Contactor Reset Coil | Latches relay to OFF position |
| **GPIO 14** | Input (Pull-up) | Case Lid Microswitch | Goes HIGH when meter lid is opened |
| **GPIO 34** | Input | A3144 Hall Effect | Detects strong external magnets |
| **GPIO 19** | Output | Audible Buzzer | Sounds alarm on tamper / zero units |
| **GPIO 2**  | Output | Status LED | Blinks on each cloud transmission |

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
