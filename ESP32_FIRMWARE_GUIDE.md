# Voltrix Smart Energy Meter: ESP32 Hardware & Firmware Engineering Guide

> **Production Guide for Sub-Metering, Anti-Tamper Protection, Autonomous Offline Enforcement, and Nigerian Grid Hardening.**

---

## 1. Microcontroller Model Selection: Do You Need an SD Card?

### ❌ Why You Should NEVER Use an SD Card in Smart Meters
- **Physical Contact Failure**: MicroSD card slots oxidize, vibrate loose, and fail in humid/dusty environments.
- **Flash Corruption**: MicroSD cards corrupt if power cuts mid-write (a daily occurrence on the grid).
- **High Write Wear**: Continuous 2-second energy logging destroys consumer SD cards in under 6 months.

---

###  The Best ESP32 Chips for Autonomous Edge Metering

| Model | CPU & Clock | Flash & RAM | Offline Capability | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **ESP32-S3-WROOM-1** (N8R8 / N16R8) | Dual-Core 240 MHz (Xtensa LX7) | **8MB / 16MB Flash** + **8MB Octal PSRAM** | Stores **5+ years** of second-by-second offline logs in LittleFS + Hardware AES/RSA acceleration for STS tokens. | ⭐⭐⭐⭐⭐ **Best for Commercial Deployments** |
| **ESP32-WROOM-32E** | Dual-Core 240 MHz | **4MB / 8MB Flash** + **520KB SRAM** | Stores **100,000+ hourly logs** in internal NVS flash partition. | ⭐⭐⭐⭐ **Best Budget / High Margin** ($2.50) |
| **ESP32-C6 / C3** | Single-Core RISC-V 160 MHz | **4MB Flash** + **400KB SRAM** | Wi-Fi 6 + Zigbee / Thread capable for sub-meter mesh networks. | ⭐⭐⭐ **Great for Multi-Tenant Mesh** |

> **Pro Tip (Memory Endurance)**: The ESP32's built-in 8MB Flash using **LittleFS** or **NVS (Non-Volatile Storage)** with wear-leveling easily stores thousands of transaction receipts and offline logs. If you want infinite 2-second writes forever, pair it with a cheap **$1 I2C FRAM chip (MB85RC64)** which supports **10 trillion write cycles** with zero wear!

---

## 2. Recommended Bill of Materials (BOM)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             VOLTRIX HARDWARE BOM                                 │
├──────────────────────┬─────────────────────────────┬─────────────────────────────┤
│ Sub-System           │ Component                   │ Purpose / Function          │
├──────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Microcontroller      │ ESP32-S3-WROOM-1 (8MB)      │ Dual-core edge processing   │
├──────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Energy IC / Dual CT  │ PZEM-004T v3.0 OR ADE7758   │ 0.5% Class precision V, I, P│
│                      │ + 2x 100A Split-Core CTs    │ Dual-CT (Live + Neutral)    │
├──────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Power Contactor      │ 60A / 80A Magnetic Latching │ Zero coil heat, 100A inrush │
│                      │ Contactor (230V Coil Pulse) │ contact-weld protection     │
├──────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Tamper Microswitch   │ SPST Sub-miniature switch   │ Detects enclosure opening   │
├──────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Magnetic Sensor      │ A3144 Hall Effect IC        │ Detects Neodymium magnets   │
├──────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Grid Protection      │ 14D471K Varistor (MOV) +    │ Absorbs 4kV lightning and   │
│                      │ GDT + 10A Slow-Blow Fuse    │ NEPA transformer surges     │
├──────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Power Supply         │ HLK-PM01 (5V 3W AC-DC) +    │ Wide input (85V – 265V AC)  │
│                      │ TP4056 + 18650 Li-Ion (3.7V)│ 24-hour backup during blackouts
└──────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

---

## 3. Anti-Tamper & Anti-Bypass Architecture

```
                                  TAMPER ENCLOSURE BOUNDARY
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                        │
  │  Mains Live In ───► [ CT 1 (Live) ] ──────► [ Magnetic Latching Relay ] ───► Live Out  │
  │                                                        ▲                               │
  │                                                        │ 50ms Pulse                    │
  │                                                 [ Relay Driver ]                       │
  │                                                        ▲ (GPIO 23)                     │
  │                                                        │                               │
  │                                                ┌───────────────┐                       │
  │  Mains Neutral ───► [ CT 2 (Neutral) ] ────────┤    ESP32-S3   │                       │
  │                                                │               │                       │
  │  Case Lid Microswitch (GPIO 14) ───────────────┤ Autonomous    │                       │
  │  Hall Magnetic Sensor (GPIO 34) ───────────────┤ Energy & NVS  │                       │
  │  Li-Ion 18650 Battery (3.7V) ──────────────────┤ Engine        │                       │
  │                                                └───────────────┘                       │
  │                                                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Dual-CT Bypass Detection Logic
* **Legitimate Flow**: $I_{\text{Live}} = I_{\text{Neutral}}$.
* **Jumper Bypass**: A copper wire is placed across Live In and Live Out. Current bypasses CT 1, so $I_{\text{Live}} \approx 0\text{ A}$ while $I_{\text{Neutral}} > 0\text{ A}$.
* **Neutral Cut / Ground Return Tamper**: Neutral is cut and grounded to an earth spike. $I_{\text{Neutral}} = 0\text{ A}$ while $I_{\text{Live}} > 0\text{ A}$.
* **Trigger Threshold**: If $|I_{\text{Live}} - I_{\text{Neutral}}| > 0.3\text{ A}$ for longer than 3 seconds:
  1. Flag `TAMPER_PHASE_BYPASS`.
  2. Trip the contactor relay immediately.
  3. Emit audible buzzer tone and log tamper event to NVS + Cloud.

### 2. Case Enclosure Microswitch
* `GPIO 14` is connected to a normally-closed switch held compressed by the plastic meter cover.
* If screws are removed or the lid is pried open:
  1. `GPIO 14` goes `HIGH`.
  2. Microcontroller wakes instantly via **GPIO Interrupt** (even on 18650 battery power during an outage).
  3. Trip contactor into `PERMANENT_LOCKOUT` state.

---

## 4. Autonomous Offline Energy Decrementing Algorithm

**The Rule**: The meter must function 100% autonomously without an active internet connection.

```
       ┌───────────────────────────────┐
       │   Every 1.0 Second Interval   │
       └───────────────┬───────────────┘
                       │
                       ▼
       ┌───────────────────────────────┐
       │ Read Active Power (kW) from CT│
       │ Energy_inc = (kW * 1.0) / 3600│
       └───────────────┬───────────────┘
                       │
                       ▼
       ┌───────────────────────────────┐
       │   Deduct from Local Memory:   │
       │ remaining_kwh -= Energy_inc   │
       │ total_imported_kwh += Energy  │
       └───────────────┬───────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   [ remaining_kwh > 0.0 ]   [ remaining_kwh <= 0.0 ]
          │                         │
          ▼                         ▼
   [ Relay Closed (ON) ]     [ Trip Contactor (CUTOFF) ]
   [ Normal Household Power] [ Turn Red LED ON ]
```

### Wear-Leveling Flash Strategy (Save every 0.1 kWh or on Outage)
Writing to internal flash memory every second will wear out the flash in a few years.
* **In-Memory Accumulator**: Keep deducting in RAM every second.
* **Periodic Flash Write**: Flush to Flash (`Preferences.h`) only when:
  1. Cumulative uncommitted energy reaches `0.05 kWh` (~every 1–2 minutes).
  2. AC Mains Voltage drops below 160V (Brownout Interrupt saves instantly via 18650 battery).
  3. A new recharge token is entered.

---

## 5. Nigerian Grid Hardening (NEPA / Surge / Brownout Protection)

1. **High Voltage Swells (Up to 380V AC)**:
   - When distribution transformers drop neutral, 230V can jump to 415V Phase-to-Phase.
   - Install a **275V / 385V Varistor (MOV 14D471K)** across Line and Neutral + a **Thermal Fuse**.
2. **Brownout Drop (90V - 160V AC)**:
   - Use an ultra-wide input AC-DC converter (**HLK-PM01** or **Mean Well IRM-03-5**) that maintains 5.0V output down to **85V AC input**.
3. **Internal Lithium 18650 UPS**:
   - The TP4056 + Boost converter keeps the ESP32, contactor driver, and tamper sensors alive for **24+ hours of total grid blackout**.

---

## 6. Complete Production C++ Firmware Skeleton for ESP32

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// ================= PIN DEFINITIONS =================
#define RELAY_SET_PIN     23    // Contactor Pulse ON (50ms pulse)
#define RELAY_RESET_PIN   22    // Contactor Pulse OFF (50ms pulse)
#define CASE_TAMPER_PIN   14    // Lid Microswitch (Pull-up)
#define HALL_MAGNET_PIN   34    // A3144 Hall Effect sensor
#define BUZZER_PIN        19    // Alarm Buzzer

// ================= STORAGE KEYS ====================
Preferences nvs;

struct MeterState {
  float remaining_kwh;
  float total_lifetime_kwh;
  bool is_relay_on;
  bool is_tampered;
  char last_token[24];
};

MeterState meter;
float uncommitted_kwh = 0.0;
unsigned long last_cloud_sync = 0;

void pulseRelay(bool turn_on) {
  if (turn_on) {
    digitalWrite(RELAY_SET_PIN, HIGH);
    delay(50);
    digitalWrite(RELAY_SET_PIN, LOW);
    meter.is_relay_on = true;
  } else {
    digitalWrite(RELAY_RESET_PIN, HIGH);
    delay(50);
    digitalWrite(RELAY_RESET_PIN, LOW);
    meter.is_relay_on = false;
  }
}

void saveStateToNVS() {
  nvs.putFloat("rem_kwh", meter.remaining_kwh);
  nvs.putFloat("tot_kwh", meter.total_lifetime_kwh);
  nvs.putBool("relay", meter.is_relay_on);
  nvs.putBool("tamper", meter.is_tampered);
  uncommitted_kwh = 0.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_SET_PIN, OUTPUT);
  pinMode(RELAY_RESET_PIN, OUTPUT);
  pinMode(CASE_TAMPER_PIN, INPUT_PULLUP);
  pinMode(HALL_MAGNET_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Load from Flash NVS
  nvs.begin("voltrix_meter", false);
  meter.remaining_kwh = nvs.getFloat("rem_kwh", 15.0); // Default 15 kWh initial
  meter.total_lifetime_kwh = nvs.getFloat("tot_kwh", 0.0);
  meter.is_tampered = nvs.getBool("tamper", false);

  // Set initial contactor position based on stored balance
  if (meter.remaining_kwh > 0.0 && !meter.is_tampered) {
    pulseRelay(true);
  } else {
    pulseRelay(false);
  }

  // Connect to Wi-Fi (Non-blocking)
  WiFi.begin("ESTATE_WIFI", "PASSWORD");
}

void loop() {
  // 1. HARDWARE TAMPER CHECKS (Runs every cycle)
  if (digitalRead(CASE_TAMPER_PIN) == HIGH) { // Enclosure opened
    meter.is_tampered = true;
    pulseRelay(false); // Immediate Cutoff
    digitalWrite(BUZZER_PIN, HIGH);
    saveStateToNVS();
  }

  // 2. READ PHYSICAL SENSORS (PZEM / Dual CT)
  float live_current = 10.7;      // Read CT 1
  float neutral_current = 10.7;   // Read CT 2
  float voltage = 231.4;          // Read Voltage
  float active_power_kw = (voltage * live_current * 0.96) / 1000.0; // kW

  // 3. DUAL-CT DIFFERENTIAL BYPASS CHECK
  if (abs(live_current - neutral_current) > 0.35) { // 350mA differential
    meter.is_tampered = true;
    pulseRelay(false); // Cutoff
    saveStateToNVS();
  }

  // 4. AUTONOMOUS LOCAL ENERGY DEDUCTION (1-Second Tick)
  static unsigned long last_tick = 0;
  if (millis() - last_tick >= 1000) {
    last_tick = millis();

    if (meter.is_relay_on && active_power_kw > 0.01) {
      float energy_this_sec = active_power_kw / 3600.0;
      meter.remaining_kwh -= energy_this_sec;
      meter.total_lifetime_kwh += energy_this_sec;
      uncommitted_kwh += energy_this_sec;

      // Check for zero balance cutoff (Offline Autonomous Trip)
      if (meter.remaining_kwh <= 0.0) {
        meter.remaining_kwh = 0.0;
        pulseRelay(false); // TRIP CONTACTOR
        saveStateToNVS();
      }

      // Flash wear-leveling: Save to NVS only every 0.05 kWh
      if (uncommitted_kwh >= 0.05) {
        saveStateToNVS();
      }
    }
  }

  // 5. CLOUD SYNC & TOKEN RECHARGE POLLING (Every 5 seconds if Wi-Fi alive)
  if (millis() - last_cloud_sync >= 5000) {
    last_cloud_sync = millis();
    if (WiFi.status() == WL_CONNECTED) {
      syncWithCloud(voltage, live_current, active_power_kw);
    }
  }
}

void syncWithCloud(float v, float i, float kw) {
  HTTPClient http;
  http.begin("http://your-supabase-or-api.com/api/meters/MTR-8A24-19F2/telemetry");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["voltage"] = v;
  doc["current"] = i;
  doc["active_power"] = kw;
  doc["remaining_kwh"] = meter.remaining_kwh;
  doc["is_tampered"] = meter.is_tampered;
  doc["is_relay_on"] = meter.is_relay_on;

  String payload;
  serializeJson(doc, payload);
  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    String res = http.getString();
    StaticJsonDocument<256> resDoc;
    deserializeJson(resDoc, res);

    // If a new 20-digit STS token was recharged on the app
    if (resDoc.containsKey("credited_units")) {
      float added_units = resDoc["credited_units"];
      meter.remaining_kwh += added_units;
      if (!meter.is_tampered && meter.remaining_kwh > 0.0) {
        pulseRelay(true); // Auto-reconnect power!
      }
      saveStateToNVS();
    }
  }
  http.end();
}
```

---

## 7. Key Takeaways for Commercial Reliability

1. **Autonomous Offline Enforcement**: The meter subtracts energy locally in RAM and trips the contactor when units hit `0.00 kWh` — bad actors cannot keep free power by unplugging Wi-Fi.
2. **Dual-CT Metering**: Compares Phase current against Neutral current to detect physical jumper shunts and earth return hacks.
3. **Magnetic Latching Contactor**: Uses a **50ms electrical pulse** to latch ON or OFF. It does not stay energized, does not overheat, and cannot be welded by AC motor inrush.
4. **Flash Memory Endurance**: By buffering energy in RAM and committing to NVS every `0.05 kWh`, the internal 8MB Flash will last **over 15+ years** of continuous usage.
