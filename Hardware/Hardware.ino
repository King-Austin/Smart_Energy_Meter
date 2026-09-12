/*
 * =====================================================================================
 *  VOLTRIX SMART ENERGY METER - PRODUCTION LIVE FIRMWARE v3.1
 *  Board: ESP32 Dev Module (30-Pin E32-30P / NodeMCU-32S)
 * 
 *  PERIPHERAL INTEGRATION:
 *    - PZEM-004T v3.0  : Hardware UART2 (RX=GPIO 16, TX=GPIO 17) @ 9600 baud
 *    - 1602/2004 I2C LCD: GPIO 21 (SDA), GPIO 22 (SCL)
 *    - Contactor Relay : GPIO 13 (Active LOW Trigger on U2)
 *    - SS-5GL Lid Tamper: GPIO 32 (INPUT_PULLUP, CN1)
 *    - Acoustic Buzzer : GPIO 25 (Melodic, non-droning meaningful beeps)
 *    - LED 1 (Pulse)   : GPIO 26 (Telemetry / Energy accumulation tick)
 *    - LED 2 (Status)  : GPIO 27 (Solid when Wi-Fi connected, blinks while connecting)
 *    - LED 3 (Alarm)   : GPIO 14 (Solid RED on Tamper / Contactor Cutoff)
 * 
 *  ACOUSTIC SOUND SIGNATURES:
 *    - Boot Up         : Cheerful 2-tone ascending chime
 *    - Wi-Fi Connected : 3-note melodic confirmation arpeggio
 *    - Relay Snap ON   : Crisp single confirmation pip (2.8 kHz)
 *    - Relay Snap OFF  : Descending 2-tone disconnect chirp
 *    - Tamper Alarm    : Urgent 3-beep warning burst (Beep-Beep-BEEP!) repeated every 2.2s
 *    - Overvoltage Trip: 2-tone hazard siren (Hi-Lo)
 *    - Zero Balance    : Two cautionary pips
 * =====================================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <Preferences.h>
#include "src/config.h"
#include "src/meter_state.h"
#include "src/sensors.h"
#include "src/display.h"
#include "src/buzzer.h"
#include "src/supabase_client.h"
#include "src/wireless_terminal.h"

Preferences nvs;

MeterState meter;
SensorReadings currentReadings;
float uncommittedKwh = 0.0f;
unsigned long lastTelemetryMillis = 0;
unsigned long lastEnergyTickMillis = 0;
unsigned long pulseLedOffMillis = 0;
unsigned long remoteCutoffBannerUntil = 0;

// In-Memory Offline Telemetry Queue (Circular RAM buffer)
OfflineTelemetryRecord offlineQueue[MAX_OFFLINE_RECORDS];
int offlineQueueHead = 0;
int offlineQueueCount = 0;

// Wi-Fi Status LED cadence (rapid strobe when offline, solid when online)
unsigned long lastStatusBlinkMillis = 0;
bool statusLedState = false;

// Main Contactor Relay Control on D13 (Active LOW Trigger)
void setRelay(bool turnOn) {
  pinMode(RELAY_PIN, OUTPUT);
  if (turnOn) {
    digitalWrite(RELAY_PIN, RELAY_ACTIVE_LEVEL); // Sinks D13 to 0.0V -> Contactor SNAPS ON
    meter.isRelayOn = true;
    digitalWrite(LED_ALARM_PIN, LOW); // Turn off Alarm LED
    Buzzer.play(BuzzerTone::RELAY_ON); // Meaningful crisp activation pip
    Serial.printf("[RELAY D13] Contactor CLOSED -> Mains Supply ON (Pin D13 = 0.0V)\n");
  } else {
    digitalWrite(RELAY_PIN, RELAY_INACTIVE_LEVEL); // Drives D13 to 3.3V -> Contactor OPENS
    meter.isRelayOn = false;
    digitalWrite(LED_ALARM_PIN, HIGH); // Light Alarm LED
    Buzzer.play(BuzzerTone::RELAY_OFF); // Meaningful descending disconnect chirp
    Serial.printf("[RELAY D13] Contactor OPEN -> Mains Supply ISOLATED (Pin D13 = 3.3V)\n");
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

  Display.showWiFiConnecting(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(300);
    digitalWrite(LED_STATUS_PIN, !digitalRead(LED_STATUS_PIN)); // Blink LED2 while connecting
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_STATUS_PIN, HIGH); // Solid LED2 when online
    Serial.println(F("\n[WIFI] Connected successfully!"));
    Serial.print(F("[WIFI] Assigned IP: "));
    Serial.println(WiFi.localIP());

    // Initialize Wireless Web Console & Web OTA Server
    WTerminal.begin(80);

    Display.showWiFiConnected(WiFi.localIP().toString().c_str());
    delay(1200);
  } else {
    digitalWrite(LED_STATUS_PIN, LOW);
    Serial.println(F("\n[WIFI] Connection timed out. Running in autonomous edge mode..."));
    Display.printLine(0, "WIFI TIMED OUT  ");
    Display.printLine(1, "OFFLINE RUNNING ");
    delay(1200);
  }
}

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  delay(600);

  Serial.println(F("\n========================================================"));
  Serial.println(F("   VOLTRIX SMART ENERGY METER - PRODUCTION FIRMWARE v3.1"));
  Serial.println(F("   Hardware: PZEM-004T | I2C LCD | SS-5GL | Acoustic Sound"));
  Serial.println(F("========================================================\n"));

  // 1. Initialize Status LEDs & Buzzer
  pinMode(LED_PULSE_PIN, OUTPUT);
  pinMode(LED_STATUS_PIN, OUTPUT);
  pinMode(LED_ALARM_PIN, OUTPUT);
  digitalWrite(LED_PULSE_PIN, LOW);
  digitalWrite(LED_STATUS_PIN, LOW);
  digitalWrite(LED_ALARM_PIN, LOW);

  Buzzer.begin();

  // 2. Initialize Visual Display (1602/2004 I2C LCD)
  Display.begin();
  Display.showBoot(DEFAULT_METER_ID);
  delay(1200);

  // 3. Initialize Sensors (PZEM-004T UART2 on D16/D17, SS-5GL Tamper on D32)
  Sensors.begin();
  Supabase.begin();

  // 4. Load persistent meter state from NVS Flash
  nvs.begin("voltrix_meter", false);
  strncpy(meter.meterId, DEFAULT_METER_ID, sizeof(meter.meterId));
  meter.remainingKwh = nvs.getFloat("rem_kwh", 96.6f);
  meter.totalLifetimeKwh = nvs.getFloat("tot_kwh", 214.6f);
  meter.isTampered = nvs.getBool("tamper", false);
  meter.tamperReason = TamperType::NONE;

  // 5. Contactor Relay Default State: Single crisp beep at boot if untampered
  if (!meter.isTampered) {
    Serial.println(F("[RELAY] Energizing Main Contactor Relay on D13..."));
    setRelay(true);
  } else {
    Serial.println(F("[RELAY] Tamper latched from previous session - keeping contactor ISOLATED."));
    setRelay(false);
    Buzzer.startAlarm(BuzzerTone::TAMPER_ALARM);
    Display.showTamperAlert("CONTACT ADMIN   ");
  }

  // 6. Connect to Wi-Fi
  connectWiFi();
}

void loop() {
  // 0. Handle Wireless Web Console & OTA Server
  WTerminal.handle();
  if (WTerminal.isUpdating()) {
    delay(5);
    return;
  }

  unsigned long now = millis();

  // 1. Wi-Fi Status LED indication (GPIO 27): Solid when online, rapid 200ms blink strobe when offline
  bool wifiOnline = (WiFi.status() == WL_CONNECTED);
  if (wifiOnline) {
    digitalWrite(LED_STATUS_PIN, HIGH);
  } else {
    if (now - lastStatusBlinkMillis >= 200) {
      lastStatusBlinkMillis = now;
      statusLedState = !statusLedState;
      digitalWrite(LED_STATUS_PIN, statusLedState ? HIGH : LOW);
    }
  }

  // 2. NON-BLOCKING ACOUSTIC ALARM CADENCE (repeats meaningful beeps, never drones)
  Buzzer.update();

  // 3. Reset Pulse LED after 60ms pulse duration
  if (pulseLedOffMillis > 0 && now >= pulseLedOffMillis) {
    digitalWrite(LED_PULSE_PIN, LOW);
    pulseLedOffMillis = 0;
  }

  // 4. Interactive Serial Keyboard Debug Controls (115200 Baud)
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == '1') {
      Serial.println(F("\n[MANUAL] Forcing Relay ON..."));
      setRelay(true);
      saveNVS();
    } else if (cmd == '0') {
      Serial.println(F("\n[MANUAL] Forcing Relay OFF..."));
      setRelay(false);
      saveNVS();
    } else if (cmd == 't' || cmd == 'T') {
      Serial.println(F("\n[MANUAL] Toggling Relay..."));
      setRelay(!meter.isRelayOn);
      saveNVS();
    } else if (cmd == 'c' || cmd == 'C') {
      Serial.println(F("\n[SECURITY] Clearing Tamper Lockout..."));
      Sensors.clearTamper(meter);
      Buzzer.stopAlarm();
      setRelay(true);
      saveNVS();
    }
  }

  // -----------------------------------------------------------------
  // 5. REAL-TIME SAFETY & LID TAMPER MONITORING (SS-5GL on D32)
  // -----------------------------------------------------------------
  bool physicalTamper = Sensors.checkTamperConditions(meter, currentReadings);
  if (physicalTamper || meter.isTampered) {
    if (meter.isRelayOn) {
      Serial.println(F("\n🚨 [SECURITY ALARM] Tamper Active! Immediate Contactor Lockout!"));
      setRelay(false);
      saveNVS();
    }
    Display.showTamperAlert("CONTACT ADMIN   ");
    digitalWrite(LED_ALARM_PIN, HIGH);
    if (!Buzzer.isAlarmActive()) {
      Buzzer.startAlarm(BuzzerTone::TAMPER_ALARM);
    }
  }

  // Dynamic Overvoltage Safety Cutoff (checks against dynamic limit meter.maxVoltageLimit)
  if (meter.isRelayOn && currentReadings.voltage >= meter.maxVoltageLimit) {
    Serial.printf("\n⚡ [OVERVOLTAGE] %.1fV exceeded cutoff (%.0fV)! Tripping Contactor!\n",
                  currentReadings.voltage, meter.maxVoltageLimit);
    setRelay(false);
    saveNVS();
    Buzzer.startAlarm(BuzzerTone::OVERVOLTAGE_ALARM);
    Display.showOvervoltageAlert(currentReadings.voltage);
    digitalWrite(LED_ALARM_PIN, HIGH);
  }

  // Exhausted Prepaid Balance Cutoff (0.00 kWh)
  if (meter.isRelayOn && meter.remainingKwh <= 0.0f) {
    Serial.println(F("\n💳 [PREPAID] Zero Units Remaining! Auto-tripping contactor."));
    setRelay(false);
    saveNVS();
    Buzzer.startAlarm(BuzzerTone::ZERO_BALANCE);
    Display.showPowerCutoff("ZERO UNITS BAL  ");
    digitalWrite(LED_ALARM_PIN, HIGH);
  }

  // -----------------------------------------------------------------
  // 6. AUTONOMOUS LOCAL ENERGY DEDUCTION (1-Second Interval)
  // -----------------------------------------------------------------
  if (now - lastEnergyTickMillis >= ENERGY_TICK_MS) {
    lastEnergyTickMillis = now;

    if (meter.isRelayOn && currentReadings.activePower > 0.005f) {
      float energyThisSec = currentReadings.activePower / 3600.0f; // kWh = kW * (1/3600 h)
      meter.remainingKwh = max(0.0f, meter.remainingKwh - energyThisSec);
      meter.totalLifetimeKwh += energyThisSec;
      uncommittedKwh += energyThisSec;

      // Pulse LED1 (GPIO 26) on energy consumption
      digitalWrite(LED_PULSE_PIN, HIGH);
      pulseLedOffMillis = now + 60;

      // Flash wear-leveling: commit to Flash NVS every 0.05 kWh
      if (uncommittedKwh >= 0.05f) {
        saveNVS();
      }
    }
  }

  // -----------------------------------------------------------------
  // 7. LIVE TELEMETRY, DISPLAY REFRESH & CLOUD SYNC (2-Second Interval)
  // -----------------------------------------------------------------
  if (now - lastTelemetryMillis >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMillis = now;

    // 1. Acquire true RMS readings from PZEM-004T (Zero mock data!)
    Sensors.readSensors(currentReadings);

    // 2. Update Physical LCD Display (if no active high-priority safety trip)
    if (!meter.isTampered && meter.remainingKwh > 0.0f && currentReadings.voltage < meter.maxVoltageLimit) {
      Display.updateLiveTelemetry(currentReadings, meter, wifiOnline, offlineQueueCount);
    }

    // 3. Serial & Wireless Terminal Real-Time Telemetry Report
    WTerminal.updateTelemetry(currentReadings, meter, wifiOnline);
    WTerminal.println(F("----------------------------------------------------------------"));
    if (Sensors.isPzemOnline()) {
      WTerminal.printf("[PZEM LIVE RMS] V: %.1fV | I: %.2fA | P: %.2fkW | PF: %.2f | F: %.1fHz\n",
                       currentReadings.voltage, currentReadings.liveCurrent,
                       currentReadings.activePower, currentReadings.powerFactor,
                       currentReadings.frequency);
    } else {
      WTerminal.printf("[PZEM DISCONNECTED] AC Mains is OFF (0.0V) | Running on Backup Battery\n");
    }
    WTerminal.printf("[STATUS] Relay D13: %s | Bal: %.2f kWh | Tamper D32: %s | WiFi: %s | OfflineQ: %d\n",
                     meter.isRelayOn ? "CLOSED (ON)" : "OPEN (OFF)",
                     meter.remainingKwh,
                     meter.isTampered ? "BREACH" : "SECURE",
                     wifiOnline ? "CONNECTED" : "OFFLINE",
                     offlineQueueCount);

    // 4. Cloud Telemetry Transmission & Remote Relay Synchronization
    if (!wifiOnline) {
      // Wi-Fi is offline: buffer live telemetry into circular RAM queue (up to MAX_OFFLINE_RECORDS)
      if (offlineQueueCount < MAX_OFFLINE_RECORDS) {
        int idx = (offlineQueueHead + offlineQueueCount) % MAX_OFFLINE_RECORDS;
        offlineQueue[idx].voltage = currentReadings.voltage;
        offlineQueue[idx].liveCurrent = currentReadings.liveCurrent;
        offlineQueue[idx].activePower = currentReadings.activePower;
        offlineQueue[idx].powerFactor = currentReadings.powerFactor;
        offlineQueue[idx].frequency = currentReadings.frequency;
        offlineQueue[idx].isTampered = meter.isTampered;
        offlineQueue[idx].isRelayOn = meter.isRelayOn;
        offlineQueue[idx].timestampSeconds = now / 1000;
        offlineQueueCount++;
      } else {
        // Queue full: overwrite oldest entry (circular FIFO)
        offlineQueueHead = (offlineQueueHead + 1) % MAX_OFFLINE_RECORDS;
        int idx = (offlineQueueHead + MAX_OFFLINE_RECORDS - 1) % MAX_OFFLINE_RECORDS;
        offlineQueue[idx].voltage = currentReadings.voltage;
        offlineQueue[idx].liveCurrent = currentReadings.liveCurrent;
        offlineQueue[idx].activePower = currentReadings.activePower;
        offlineQueue[idx].powerFactor = currentReadings.powerFactor;
        offlineQueue[idx].frequency = currentReadings.frequency;
        offlineQueue[idx].isTampered = meter.isTampered;
        offlineQueue[idx].isRelayOn = meter.isRelayOn;
        offlineQueue[idx].timestampSeconds = now / 1000;
      }
      Serial.printf("[OFFLINE BUFFER] Wi-Fi offline. Buffered reading into RAM (%d/%d queued)\n",
                    offlineQueueCount, MAX_OFFLINE_RECORDS);
      WiFi.reconnect();
    } else {
      // If reconnected and we have offline buffered records, flush them to Supabase!
      if (offlineQueueCount > 0) {
        Serial.printf("[OFFLINE FLUSH] Reconnected! Flushing %d buffered telemetry logs to Supabase...\n", offlineQueueCount);
        OfflineTelemetryRecord batch[MAX_OFFLINE_RECORDS];
        for (int i = 0; i < offlineQueueCount; i++) {
          batch[i] = offlineQueue[(offlineQueueHead + i) % MAX_OFFLINE_RECORDS];
        }
        if (Supabase.uploadOfflineBatch(meter.meterId, batch, offlineQueueCount)) {
          Serial.println(F("[OFFLINE FLUSH] Flush SUCCESS! All buffered logs written to cloud."));
          offlineQueueCount = 0;
          offlineQueueHead = 0;
        } else {
          Serial.println(F("[OFFLINE FLUSH] Batch upload deferred to next cycle."));
        }
      }

      // Pulse LED1 (GPIO 26) during telemetry upload
      digitalWrite(LED_PULSE_PIN, HIGH);
      pulseLedOffMillis = now + 80;

      SupabaseSyncResult sync = Supabase.sendTelemetry(meter.meterId, currentReadings, meter);

      if (sync.success) {
        Serial.printf("[CLOUD SYNC 200 OK] Remote Supply: %s | Dynamic Cutoff: %.0fV | Prepaid: %.2f kWh\n",
                      sync.mainSupplyConnected ? "CONNECTED (ON)" : "ISOLATED (OFF)",
                      sync.maxVoltageLimit,
                      sync.prepaidUnitsKwh);

        // Synchronize dynamic voltage limits from web sliders
        if (sync.maxVoltageLimit > 100.0f) {
          meter.maxVoltageLimit = sync.maxVoltageLimit;
        }
        if (sync.minVoltageLimit > 50.0f) {
          meter.minVoltageLimit = sync.minVoltageLimit;
        }

        // Synchronize cloud prepaid balance if updated
        if (sync.prepaidUnitsKwh > 0.0f && fabs(sync.prepaidUnitsKwh - meter.remainingKwh) > 0.05f) {
          meter.remainingKwh = sync.prepaidUnitsKwh;
          saveNVS();
        }

        // =============================================================
        // CLOUD TAMPER UNLOCK SYNCHRONIZATION
        // =============================================================
        if (!sync.tamperLocked && meter.isTampered) {
          if (digitalRead(CASE_TAMPER_PIN) == LOW) {
            Serial.println(F("\n>>> [SECURITY] Cloud Admin cleared Tamper Lockout! Restoring Supply! <<<"));
            Sensors.clearTamper(meter);
            Buzzer.stopAlarm();
            setRelay(true);
            saveNVS();
            Display.clear();
          } else {
            Serial.println(F("\n[SECURITY] Cloud tamper cleared, but physical lid on D32 is still OPEN! Keeping contactor safe."));
          }
        }

        // =============================================================
        // REMOTE RELAY SYNCHRONIZATION & VOLTAGE CUTOFF TRIPS
        // =============================================================
        // Trip OFF if:
        // 1. Cloud requested supply OFF (!sync.mainSupplyConnected)
        // 2. Dynamic voltage cutoff tripped (sync.voltageCutoffTripped)
        if ((!sync.mainSupplyConnected || sync.voltageCutoffTripped) && meter.isRelayOn) {
          Serial.printf("\n>>> [CUTOFF / COMMAND] Tripping Contactor! (Voltage Trip: %s, Cloud Supply: %s) <<<\n",
                        sync.voltageCutoffTripped ? "YES" : "NO",
                        sync.mainSupplyConnected ? "CONNECTED" : "DISCONNECTED");
          setRelay(false);
          saveNVS();
          if (sync.voltageCutoffTripped) {
            Display.showPowerCutoff("VOLT CUTOFF TRIP");
          }
        }
        // Snap ON if:
        // Cloud requested ON, no voltage cutoff trip, currently OFF, and not tamper locked
        else if (sync.mainSupplyConnected && !sync.voltageCutoffTripped && !meter.isRelayOn && !sync.tamperLocked) {
          Serial.println(F("\n>>> [REMOTE COMMAND] Cloud requested Mains ON -> Snapping Contactor ON! <<<"));
          meter.isTampered = false;
          setRelay(true);
          saveNVS();
          Display.clear();
        }
      } else {
        Serial.printf("[CLOUD ERROR] Telemetry sync failed: %s\n", sync.errorMessage.c_str());
      }
    }
  }
}
