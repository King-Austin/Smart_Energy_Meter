#include "sensors.h"
#include "config.h"

SensorManager Sensors;

void SensorManager::begin() {
  pinMode(VOLTAGE_SENSOR_PIN, INPUT);
  pinMode(CASE_TAMPER_PIN, INPUT_PULLUP);
  pinMode(HALL_MAGNET_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
}

float SensorManager::readTrueRMSVoltage(uint16_t sampleCycles) {
  const uint16_t SAMPLES = 400; // 400 samples across 100ms (5 full 20ms cycles at 50Hz)
  uint16_t rawSamples[SAMPLES];
  uint32_t sumRaw = 0;
  uint16_t minRaw = 4095;
  uint16_t maxRaw = 0;

  // Pass 1: Acquire samples at 250 microsecond intervals (4 kHz sampling rate)
  unsigned long nextSampleMicros = micros();
  for (uint16_t i = 0; i < SAMPLES; i++) {
    while ((long)(micros() - nextSampleMicros) < 0) {
      // Precise sampling timing loop
    }
    nextSampleMicros += 250;
    rawSamples[i] = analogRead(VOLTAGE_SENSOR_PIN);
    sumRaw += rawSamples[i];
    if (rawSamples[i] < minRaw) minRaw = rawSamples[i];
    if (rawSamples[i] > maxRaw) maxRaw = rawSamples[i];
  }

  // Calculate dynamic DC midpoint bias
  float dcBiasRaw = (float)sumRaw / (float)SAMPLES;
  lastDcBias = dcBiasRaw * (3.3f / 4095.0f);

  // Pass 2: Calculate Root Mean Square of pure AC component
  double sumSq = 0.0;
  for (uint16_t i = 0; i < SAMPLES; i++) {
    float vAc = ((float)rawSamples[i] - dcBiasRaw) * (3.3f / 4095.0f);
    sumSq += (double)(vAc * vAc);
  }

  float vRmsPin = sqrt(sumSq / (double)SAMPLES);

  // Convert sensor pin RMS to mains AC RMS using calibrated multiplier
  float vMainsRms = vRmsPin * VOLTAGE_CALIBRATION;

  // Real-time hardware diagnostic output to Serial
  Serial.printf("[ZMPT101B D35] ADC Min:%d Max:%d | Bias:%.2fV | P-P:%.2fV | Pin RMS:%.4fV -> Mains:%.1fV\n",
                minRaw, maxRaw, lastDcBias,
                (float)(maxRaw - minRaw) * (3.3f / 4095.0f),
                vRmsPin, vMainsRms);

  // Noise floor suppression: clamp below 10V
  if (vMainsRms < 10.0f) {
    vMainsRms = 0.0f;
  }

  return vMainsRms;
}

void SensorManager::readSensors(SensorReadings &readings, bool simulationMode) {
#if ENABLE_PHYSICAL_VOLTAGE
  // 100% Pure Physical Reading from ZMPT101B on GPIO 35 (no fallback)
  readings.voltage = readTrueRMSVoltage(5);
#else
  if (simulationMode) {
    float vNoise = ((float)random(-25, 25)) / 10.0f;
    simVoltage = constrain(231.0f + vNoise, 220.0f, 245.0f);
    readings.voltage = simVoltage;
  } else {
    readings.voltage = 230.0f;
  }
#endif

#if ENABLE_SIMULATED_CURRENT
  // Only generate current if explicitly enabled
  if (readings.voltage > 10.0f) {
    float iNoise = ((float)random(-8, 8)) / 10.0f;
    simCurrent = constrain(6.8f + iNoise, 2.5f, 15.0f);
    readings.liveCurrent = simCurrent;
    readings.neutralCurrent = simCurrent;
    readings.powerFactor = 0.96f;
    readings.frequency = 50.0f + ((float)random(-1, 2)) / 10.0f;
  } else {
    readings.liveCurrent = 0.0f;
    readings.neutralCurrent = 0.0f;
    readings.powerFactor = 1.0f;
    readings.frequency = 0.0f;
  }
#else
  // When CT current sensor is NOT connected, current is strictly 0.00 A
  readings.liveCurrent = 0.0f;
  readings.neutralCurrent = 0.0f;
  readings.powerFactor = 1.0f;
  readings.frequency = (readings.voltage > 10.0f) ? 50.0f : 0.0f;
#endif

  // Active Power (kW) = (V * I * PF) / 1000 -> strictly 0.00kW if current is 0.00A
  readings.activePower = (readings.voltage * readings.liveCurrent * readings.powerFactor) / 1000.0f;
  readings.apparentPower = (readings.voltage * readings.liveCurrent) / 1000.0f;
  readings.reactivePower = sqrt(max(0.0f, sq(readings.apparentPower) - sq(readings.activePower)));
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
