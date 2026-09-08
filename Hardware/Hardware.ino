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

// Pulse magnetic latching contactor relay (50ms pulse, zero continuous heat)
void pulseRelay(bool turnOn) {
  if (turnOn) {
    digitalWrite(RELAY_SET_PIN, HIGH);
    delay(50);
    digitalWrite(RELAY_SET_PIN, LOW);
    meter.isRelayOn = true;
    Serial.println(F("[CONTACTOR] Latching Pulse -> ON (Power Supplied)"));
  } else {
    digitalWrite(RELAY_RESET_PIN, HIGH);
    delay(50);
    digitalWrite(RELAY_RESET_PIN, LOW);
    meter.isRelayOn = false;
    Serial.println(F("[CONTACTOR] Latching Pulse -> OFF (Power Cut)"));
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
  Serial.println(F("   VOLTRIX SMART ENERGY METER - ESP32 FIRMWARE v1.0.4  "));
  Serial.println(F("   Monitoring Mode (5-Second Supabase Interval)       "));
  Serial.println(F("=======================================================\n"));

  pinMode(RELAY_SET_PIN, OUTPUT);
  pinMode(RELAY_RESET_PIN, OUTPUT);
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

  // Latch contactor to stored state
  if (meter.remainingKwh > 0.0f && !meter.isTampered) {
    pulseRelay(true);
  } else {
    pulseRelay(false);
  }

  // Connect to Wi-Fi
  connectWiFi();
}

void loop() {
  unsigned long now = millis();

  // 1. TAMPER MONITORING (Only checked if physical sensor pins are enabled)
#if ENABLE_PHYSICAL_TAMPER_PINS
  if (!meter.isTampered && Sensors.checkTamperConditions(meter, currentReadings)) {
    Serial.println(F("[ALARM] TAMPER DETECTED! Immediate Contactor Lockout!"));
    pulseRelay(false);
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
        pulseRelay(false);
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

    // Generate/read mock monitoring data (simulationMode = true)
    Sensors.readSensors(currentReadings, true);

    // Print readable diagnostics to Serial
    Serial.println(F("-------------------------------------------------------"));
    Serial.printf("[TELEMETRY] Meter: %s | V: %.1fV | I: %.2fA | P: %.2fkW | PF: %.2f\n",
                  meter.meterId, currentReadings.voltage, currentReadings.liveCurrent,
                  currentReadings.activePower, currentReadings.powerFactor);
    Serial.printf("[STATUS] Units: %.2f kWh | Relay: %s | Tamper: %s\n",
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
        Serial.println(F("[CLOUD] Supabase Telemetry Sync -> HTTP 200 OK"));
        // Check for remote relay commands from user web dashboard
        if (!sync.mainSupplyConnected && meter.isRelayOn) {
          Serial.println(F("[REMOTE] Cloud Relay Cutoff Command Received."));
          pulseRelay(false);
        } else if (sync.mainSupplyConnected && !meter.isRelayOn && !meter.isTampered && meter.remainingKwh > 0.0f) {
          Serial.println(F("[REMOTE] Cloud Relay Restore Command Received."));
          pulseRelay(true);
        }
      } else {
        Serial.print(F("[CLOUD ERROR] Sync failed: "));
        Serial.println(sync.errorMessage);
      }
    }
  }
}
