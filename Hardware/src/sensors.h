#pragma once
#include <Arduino.h>
#include "config.h"
#include "meter_state.h"

class SensorManager {
public:
  void begin();
  void readSensors(SensorReadings &readings, bool simulationMode = false);
  bool checkTamperConditions(MeterState &state, const SensorReadings &readings);
  void triggerTamper(MeterState &state, TamperType type);
  void clearTamper(MeterState &state);

private:
  float simVoltage = 230.0f;
  float simCurrent = 5.2f;
};

extern SensorManager Sensors;
