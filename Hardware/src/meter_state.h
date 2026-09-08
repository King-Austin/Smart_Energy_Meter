#pragma once
#include <Arduino.h>

enum class TamperType {
  NONE,
  CASE_LID_OPENED,
  MAGNETIC_FIELD,
  PHASE_NEUTRAL_BYPASS,
  REVERSE_CURRENT
};

struct SensorReadings {
  float voltage;          // Volts (V)
  float liveCurrent;      // Amperes (A)
  float neutralCurrent;   // Amperes (A)
  float activePower;      // Kilowatts (kW)
  float apparentPower;    // kVA
  float reactivePower;    // kVAR
  float powerFactor;      // 0.0 - 1.0
  float frequency;        // Hertz (Hz)
};

struct MeterState {
  char meterId[32];
  float remainingKwh;
  float totalLifetimeKwh;
  bool isRelayOn;
  bool isTampered;
  TamperType tamperReason;
  unsigned long lastSyncMillis;
  unsigned long lastEnergyCalcMillis;
};
