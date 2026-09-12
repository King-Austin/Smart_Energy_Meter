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
  float maxVoltageLimit = 240.0f; // Dynamic overvoltage safety cutoff
  float minVoltageLimit = 180.0f; // Dynamic brownout protection cutoff
  unsigned long lastSyncMillis;
  unsigned long lastEnergyCalcMillis;
};

struct OfflineTelemetryRecord {
  float voltage;
  float liveCurrent;
  float activePower;
  float powerFactor;
  float frequency;
  bool isTampered;
  bool isRelayOn;
  unsigned long timestampSeconds;
};
