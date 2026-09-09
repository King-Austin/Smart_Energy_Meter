/*
 * =====================================================================================
 *  VOLTRIX SMART ENERGY METER - ARDUINO IDE FIRMWARE (.INO)
 *  Board: ESP32 Dev Module / ESP32-S3 Dev Module
 *  Required Libraries:
 *    - WiFi (Built-in to ESP32 core)
 *    - HTTPClient (Built-in to ESP32 core)
 *    - WiFiClientSecure (Built-in to ESP32 core)
 *    - Preferences (Built-in to ESP32 core)
 *    - ArduinoJson (v6.x or v7.x by Benoit Blanchon, available in Arduino Library Manager)
 *
 *  Mode: Live Telemetry Monitoring (5-Second Interval, Mock Sensor Stream)
 *  Target Supabase Project: kmosslvdjdhrjgvitctr (Smart_energy_meter)
 * =====================================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <Preferences.h>
#include "src/config.h"
#include "src/meter_state.h"
#include "src/sensors.h"
#include "src/supabase_client.h"

// Non-volatile storage (NVS) for wear-leveling offline resilience
Preferences nvs;

MeterState meter;
SensorReadings currentReadings;
float uncommittedKwh = 0.0f;
unsigned long lastTelemetryMillis = 0;
unsigned long lastEnergyTickMillis = 0;

// Single-channel Relay Contactor Control on pin D27 (Active LOW Trigger)
// LOW (0.0V) = Relay energized / Contacts closed / Bulb ON
// HIGH (3.3V) / INPUT High-Z = Relay de-energized / Contacts open / Bulb OFF
void setRelay(bool turnOn) {
  if (turnOn) {
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, LOW); // Sinks to 0V: Optocoupler fires -> Relay snaps closed -> Bulb ON
    meter.isRelayOn = true;
    Serial.println(F("[RELAY D27] Contactor CLOSED -> Pin D27 LOW (0.0V) [Bulb ON]"));
  } else {
    // Cut current cleanly: drive HIGH then float to INPUT (High-Z)
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, HIGH);
    pinMode(RELAY_PIN, INPUT);
    meter.isRelayOn = false;
    Serial.println(F("[RELAY D27] Contactor OPEN -> Pin D27 High-Z Float [Bulb OFF]"));
  }
}

void saveNVS() {
  nvs.putFloat("rem_kwh", meter.remainingKwh);
  nvs.putFloat("tot_kwh", meter.totalLifetimeKwh);
  nvs.putBool("relay", meter.isRelayOn);
  nvs.putBool("tamper", meter.isTampered);
  uncommittedKwh = 0.0f;
}

void connectWiFi() {
  Serial.print(F("[WIFI] Connecting to SSID: "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[WIFI] Connected successfully!"));
    Serial.print(F("[WIFI] Assigned IP: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n[WIFI] Connection timed out. Continuing offline mode..."));
  }
}

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  delay(1000);

  Serial.println(F("\n======================================================="));
  Serial.println(F("   VOLTRIX SMART ENERGY METER - ESP32 FIRMWARE v1.0.5  "));
  Serial.println(F("   Hardware: Relay (D27 Active LOW) | ZMPT101B (D35)   "));
  Serial.println(F("   Monitoring Mode (5-Second Supabase Interval)       "));
  Serial.println(F("=======================================================\n"));

  // Quick Relay Self-Test: Click ON then OFF so user immediately verifies the bulb & relay
  Serial.println(F("[RELAY TEST] Testing Pin D27 (Self-Test Click)..."));
  setRelay(true);
  delay(1000);
  setRelay(false);
  delay(800);
  setRelay(true); // Default ON at boot
  Serial.println(F("[RELAY] Power ON: Contactor CLOSED (Bulb ON)"));

  // Configure ADC for ZMPT101B AC Voltage Sensor on GPIO 35
  analogReadResolution(12); // 12-bit (0 - 4095)
  analogSetAttenuation(ADC_11db); // 11dB gives full 0V to 3.3V range

  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Initialize sensors and tamper inputs
  Sensors.begin();
  Supabase.begin();

  // Load state from Flash NVS
  nvs.begin("voltrix_meter", false);
  strncpy(meter.meterId, DEFAULT_METER_ID, sizeof(meter.meterId));
  meter.remainingKwh = nvs.getFloat("rem_kwh", 96.6f);
  meter.totalLifetimeKwh = nvs.getFloat("tot_kwh", 214.6f);
  
#if ENABLE_PHYSICAL_TAMPER_PINS
  meter.isTampered = nvs.getBool("tamper", false);
#else
  meter.isTampered = false; // Bench simulation: clear tamper lockout
#endif
  meter.tamperReason = TamperType::NONE;

  // Set relay to stored state
  if (meter.remainingKwh > 0.0f && !meter.isTampered) {
    setRelay(true);
  } else {
    setRelay(false);
  }

  // Connect to Wi-Fi
  connectWiFi();
}

void loop() {
  // Check for interactive Serial keyboard test commands (Type 1 for ON, 0 for OFF, t to Toggle)
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == '1') {
      Serial.println(F("\n>>> [MANUAL TEST] KEY '1' PRESSED -> FORCING RELAY ON (Pin D27 = LOW) <<<"));
      setRelay(true);
    } else if (cmd == '0') {
      Serial.println(F("\n>>> [MANUAL TEST] KEY '0' PRESSED -> FORCING RELAY OFF (Pin D27 = HIGH) <<<"));
      setRelay(false);
    } else if (cmd == 't' || cmd == 'T') {
      Serial.println(F("\n>>> [MANUAL TEST] KEY 't' PRESSED -> TOGGLING RELAY <<<"));
      setRelay(!meter.isRelayOn);
    }
  }

  unsigned long now = millis();


  // 1. HARDWARE PROTECTIVE & TAMPER MONITORING
#if ENABLE_PHYSICAL_VOLTAGE
  // Immediate Overvoltage Safety Cutoff (trips if voltage exceeds safe threshold, e.g. 250V)
  if (meter.isRelayOn && currentReadings.voltage >= OVERVOLTAGE_LIMIT) {
    Serial.printf("[OVERVOLTAGE ALARM] %.1fV EXCEEDED CUTOFF (%.0fV)! Immediate Relay Cutoff!\n",
                  currentReadings.voltage, OVERVOLTAGE_LIMIT);
    setRelay(false);
    saveNVS();
  }
#endif

#if ENABLE_PHYSICAL_TAMPER_PINS
  if (!meter.isTampered && Sensors.checkTamperConditions(meter, currentReadings)) {
    Serial.println(F("[ALARM] TAMPER DETECTED! Immediate Contactor Lockout!"));
    setRelay(false);
    saveNVS();
  }
#endif

  // 2. AUTONOMOUS LOCAL ENERGY DEDUCTION (1-Second Tick)
  if (now - lastEnergyTickMillis >= ENERGY_TICK_MS) {
    lastEnergyTickMillis = now;

    if (meter.isRelayOn && currentReadings.activePower > 0.01f) {
      float energyThisSec = currentReadings.activePower / 3600.0f; // kWh = kW * (1/3600 h)
      meter.remainingKwh = max(0.0f, meter.remainingKwh - energyThisSec);
      meter.totalLifetimeKwh += energyThisSec;
      uncommittedKwh += energyThisSec;

      // Autonomous zero-balance trip
      if (meter.remainingKwh <= 0.0f) {
        Serial.println(F("[BALANCE] Units Exhausted! Auto-tripping contactor."));
        setRelay(false);
        saveNVS();
      }

      // Flash wear-leveling: write to NVS only after 0.05 kWh accumulated
      if (uncommittedKwh >= 0.05f) {
        saveNVS();
      }
    }
  }

  // 3. 5-SECOND TELEMETRY MONITORING & CLOUD SYNCHRONIZATION
  if (now - lastTelemetryMillis >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMillis = now;

    // Read sensors (True RMS voltage on D35)
    Sensors.readSensors(currentReadings, true);

    // Print readable diagnostics to Serial
    Serial.println(F("-------------------------------------------------------"));
    Serial.printf("[TELEMETRY] Meter: %s | V_RMS: %.1fV | I: %.2fA | P: %.2fkW | PF: %.2f\n",
                  meter.meterId, currentReadings.voltage, currentReadings.liveCurrent,
                  currentReadings.activePower, currentReadings.powerFactor);
    Serial.printf("[STATUS] Units: %.2f kWh | Relay (D27): %s | Tamper: %s\n",
                  meter.remainingKwh, meter.isRelayOn ? "CLOSED (ON)" : "OPEN (OFF)",
                  meter.isTampered ? "TRIPPED" : "SECURE");

    // Auto-reconnect WiFi if connection dropped
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("[WIFI] Reconnecting..."));
      WiFi.reconnect();
    } else {
      digitalWrite(STATUS_LED_PIN, HIGH);
      SupabaseSyncResult sync = Supabase.sendTelemetry(meter.meterId, currentReadings, meter);
      digitalWrite(STATUS_LED_PIN, LOW);

      if (sync.success) {
        Serial.printf("[CLOUD] Sync HTTP 200 | Cloud Supply: %s | Prepaid: %.2f kWh\n",
                      sync.mainSupplyConnected ? "CONNECT (ON)" : "CUTOFF (OFF)",
                      sync.prepaidUnitsKwh);

        // Remote relay commands from user web dashboard (Active-LOW Trigger)
        if (!sync.mainSupplyConnected && meter.isRelayOn) {
          Serial.println(F(">>> [REMOTE COMMAND] Dashboard switched Mains OFF -> Opening Relay (Bulb OFF) <<<"));
          setRelay(false);
          saveNVS();
        } else if (sync.mainSupplyConnected && !meter.isRelayOn && !meter.isTampered && meter.remainingKwh > 0.0f) {
          Serial.println(F(">>> [REMOTE COMMAND] Dashboard switched Mains ON -> Closing Relay (Pin D27 = LOW, Bulb ON) <<<"));
          setRelay(true);
          saveNVS();
        }
      } else {
        Serial.print(F("[CLOUD ERROR] Sync failed: "));
        Serial.println(sync.errorMessage);
      }
    }
  }
}
