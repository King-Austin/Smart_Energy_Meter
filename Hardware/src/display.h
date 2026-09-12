#pragma once
#include <Arduino.h>
#include "meter_state.h"
#include "config.h"

class MeterDisplay {
public:
  void begin();
  bool isConnected() const { return _lcdFound; }

  // Startup visual flows
  void showBoot(const char *meterId);
  void showWiFiConnecting(const char *ssid);
  void showWiFiConnected(const char *ipStr);

  // Live cyclical dashboard views
  void updateLiveTelemetry(const SensorReadings &readings, const MeterState &state, bool wifiOk, int offlineQueued = 0);

  // Critical alerts & safety trips
  void showTamperAlert(const char *reason = "CONTACT ADMIN   ");
  void showPowerCutoff(const char *reason);
  void showOvervoltageAlert(float voltage);

  // Raw display primitives
  void printLine(uint8_t row, const char *text);
  void clear();
  void setBacklight(bool enable);

private:
  uint8_t _i2cAddr = LCD_I2C_ADDR;
  bool _lcdFound = false;
  uint8_t _backlightVal = 0x08; // 0x08 = ON, 0x00 = OFF
  unsigned long _lastPageFlip = 0;
  uint8_t _currentPage = 0;
  char _prevLine0[21] = {0};
  char _prevLine1[21] = {0};

  void sendNibble(uint8_t nibble, uint8_t mode);
  void sendByte(uint8_t data, uint8_t mode);
  void writeCommand(uint8_t cmd);
  void writeData(uint8_t data);
  void pulseEnable(uint8_t data);
  bool detectI2CAddress();
};

extern MeterDisplay Display;
