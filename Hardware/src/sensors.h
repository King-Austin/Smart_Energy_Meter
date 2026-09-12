#pragma once
#include <Arduino.h>
#include "config.h"
#include "meter_state.h"

class SensorManager {
public:
  void begin();
  void readSensors(SensorReadings &readings);
  bool readPZEM(SensorReadings &readings);
  bool checkTamperConditions(MeterState &state, const SensorReadings &readings);
  void triggerTamper(MeterState &state, TamperType type);
  void clearTamper(MeterState &state);
  bool isPzemOnline() const { return pzemResponding; }

private:
  bool pzemResponding = false;
  unsigned long lastPzemAttempt = 0;

  uint16_t calculateCRC16(const uint8_t *data, uint16_t length);
};

extern SensorManager Sensors;
