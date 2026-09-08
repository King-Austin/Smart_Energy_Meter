#include "sensors.h"
#include "config.h"

SensorManager Sensors;

void SensorManager::begin() {
  pinMode(CASE_TAMPER_PIN, INPUT_PULLUP);
  pinMode(HALL_MAGNET_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
}

void SensorManager::readSensors(SensorReadings &readings, bool simulationMode) {
  if (simulationMode) {
    // Generate realistic fluctuating AC grid values for testing & visualization
    // Simulates natural residential load variation
    float vNoise = ((float)random(-25, 25)) / 10.0f; // +/- 2.5V fluctuation
    float iNoise = ((float)random(-8, 8)) / 10.0f;   // +/- 0.8A fluctuation
    
    simVoltage = constrain(231.0f + vNoise, 220.0f, 245.0f);
    simCurrent = constrain(6.8f + iNoise, 2.5f, 15.0f);

    readings.voltage = simVoltage;
    readings.liveCurrent = simCurrent;
    readings.neutralCurrent = simCurrent; // Legitimate balanced flow
    readings.powerFactor = 0.96f;
    readings.frequency = 50.0f + ((float)random(-1, 2)) / 10.0f;
    
    // Active power P (kW) = (V * I * PF) / 1000
    readings.activePower = (readings.voltage * readings.liveCurrent * readings.powerFactor) / 1000.0f;
    readings.apparentPower = (readings.voltage * readings.liveCurrent) / 1000.0f;
    readings.reactivePower = sqrt(sq(readings.apparentPower) - sq(readings.activePower));
  } else {
    // In physical mode, read from PZEM-004T / ADE7758 energy ICs
    // Fallback default safe readings if physical sensor is not yet wired
    readings.voltage = 230.0f;
    readings.liveCurrent = 5.0f;
    readings.neutralCurrent = 5.0f;
    readings.powerFactor = 0.95f;
    readings.frequency = 50.0f;
    readings.activePower = (230.0f * 5.0f * 0.95f) / 1000.0f;
    readings.apparentPower = 1.15f;
    readings.reactivePower = 0.35f;
  }
}

bool SensorManager::checkTamperConditions(MeterState &state, const SensorReadings &readings) {
  // 1. Check enclosure lid microswitch (HIGH = cover removed / switch uncompressed)
  if (digitalRead(CASE_TAMPER_PIN) == HIGH) {
    triggerTamper(state, TamperType::CASE_LID_OPENED);
    return true;
  }

  // 2. Check strong external magnetic field (A3144 Hall sensor goes LOW on magnetic field)
  if (digitalRead(HALL_MAGNET_PIN) == LOW) {
    triggerTamper(state, TamperType::MAGNETIC_FIELD);
    return true;
  }

  // 3. Dual-CT differential bypass check (|Live - Neutral| > 350mA)
  if (fabs(readings.liveCurrent - readings.neutralCurrent) > 0.35f) {
    triggerTamper(state, TamperType::PHASE_NEUTRAL_BYPASS);
    return true;
  }

  return false;
}

void SensorManager::triggerTamper(MeterState &state, TamperType type) {
  state.isTampered = true;
  state.tamperReason = type;
  digitalWrite(BUZZER_PIN, HIGH); // Sound alarm buzzer
}

void SensorManager::clearTamper(MeterState &state) {
  state.isTampered = false;
  state.tamperReason = TamperType::NONE;
  digitalWrite(BUZZER_PIN, LOW);
}
