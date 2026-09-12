#include "display.h"
#include <Wire.h>

MeterDisplay Display;

// Control bitmasks for PCF8574 I2C backpack
#define LCD_RS        0x01
#define LCD_RW        0x02
#define LCD_EN        0x04
#define LCD_BL        0x08

void MeterDisplay::begin() {
  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  delay(50);

  if (!detectI2CAddress()) {
    Serial.println(F("[LCD I2C] Warning: No I2C LCD backpack detected at 0x27 or 0x3F."));
    _lcdFound = false;
    return;
  }

  Serial.printf("[LCD I2C] PCF8574 LCD initialized successfully at 0x%02X!\n", _i2cAddr);
  _lcdFound = true;

  // HD44780 4-bit initialization sequence
  delay(50);
  sendNibble(0x03, 0);
  delay(5);
  sendNibble(0x03, 0);
  delayMicroseconds(150);
  sendNibble(0x03, 0);
  delayMicroseconds(150);
  sendNibble(0x02, 0); // Activate 4-bit mode

  writeCommand(0x28); // 4-bit mode, 2 lines, 5x8 font
  delayMicroseconds(50);
  writeCommand(0x0C); // Display ON, cursor OFF, blink OFF
  delayMicroseconds(50);
  clear();
  writeCommand(0x06); // Entry mode: increment cursor, no display shift
  delayMicroseconds(50);
}

bool MeterDisplay::detectI2CAddress() {
  // Test configured address first
  Wire.beginTransmission(_i2cAddr);
  if (Wire.endTransmission() == 0) return true;

  // Check alternative standard address (0x3F)
  Wire.beginTransmission(0x3F);
  if (Wire.endTransmission() == 0) {
    _i2cAddr = 0x3F;
    return true;
  }

  // Scan entire range 0x20 to 0x27 and 0x38 to 0x3F
  for (uint8_t addr = 0x20; addr <= 0x3F; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      _i2cAddr = addr;
      return true;
    }
  }

  return false;
}

void MeterDisplay::pulseEnable(uint8_t data) {
  Wire.beginTransmission(_i2cAddr);
  Wire.write(data | LCD_EN | _backlightVal);
  Wire.endTransmission();
  delayMicroseconds(2);

  Wire.beginTransmission(_i2cAddr);
  Wire.write((data & ~LCD_EN) | _backlightVal);
  Wire.endTransmission();
  delayMicroseconds(50);
}

void MeterDisplay::sendNibble(uint8_t nibble, uint8_t mode) {
  uint8_t data = ((nibble << 4) & 0xF0) | (mode ? LCD_RS : 0);
  Wire.beginTransmission(_i2cAddr);
  Wire.write(data | _backlightVal);
  Wire.endTransmission();
  pulseEnable(data);
}

void MeterDisplay::sendByte(uint8_t data, uint8_t mode) {
  sendNibble((data >> 4) & 0x0F, mode);
  sendNibble(data & 0x0F, mode);
}

void MeterDisplay::writeCommand(uint8_t cmd) {
  if (!_lcdFound) return;
  sendByte(cmd, 0);
}

void MeterDisplay::writeData(uint8_t data) {
  if (!_lcdFound) return;
  sendByte(data, 1);
}

void MeterDisplay::clear() {
  if (!_lcdFound) return;
  writeCommand(0x01);
  delay(2);
  memset(_prevLine0, 0, sizeof(_prevLine0));
  memset(_prevLine1, 0, sizeof(_prevLine1));
}

void MeterDisplay::setBacklight(bool enable) {
  _backlightVal = enable ? LCD_BL : 0x00;
  if (!_lcdFound) return;
  Wire.beginTransmission(_i2cAddr);
  Wire.write(_backlightVal);
  Wire.endTransmission();
}

void MeterDisplay::printLine(uint8_t row, const char *text) {
  if (!_lcdFound) return;

  char formatted[17];
  snprintf(formatted, sizeof(formatted), "%-16.16s", text);

  // Skip rewrite if content has not changed (prevents flicker)
  if (row == 0 && strcmp(_prevLine0, formatted) == 0) return;
  if (row == 1 && strcmp(_prevLine1, formatted) == 0) return;

  if (row == 0) {
    strncpy(_prevLine0, formatted, sizeof(_prevLine0));
    writeCommand(0x80); // First row DDRAM address
  } else {
    strncpy(_prevLine1, formatted, sizeof(_prevLine1));
    writeCommand(0xC0); // Second row DDRAM address
  }

  for (uint8_t i = 0; i < 16 && formatted[i] != '\0'; i++) {
    writeData((uint8_t)formatted[i]);
  }
}

// -----------------------------------------------------------------
// Visual User Interface Screens
// -----------------------------------------------------------------

void MeterDisplay::showBoot(const char *meterId) {
  if (!_lcdFound) return;
  clear();
  printLine(0, "VOLTRIX METER");
  char buf[17];
  snprintf(buf, sizeof(buf), "ID: %s", meterId);
  printLine(1, buf);
}

void MeterDisplay::showWiFiConnecting(const char *ssid) {
  if (!_lcdFound) return;
  printLine(0, "CONNECTING WIFI");
  char buf[17];
  snprintf(buf, sizeof(buf), "SSID: %s", ssid);
  printLine(1, buf);
}

void MeterDisplay::showWiFiConnected(const char *ipStr) {
  if (!_lcdFound) return;
  printLine(0, "WIFI CONNECTED");
  char buf[17];
  snprintf(buf, sizeof(buf), "IP:%s", ipStr);
  printLine(1, buf);
}

void MeterDisplay::updateLiveTelemetry(const SensorReadings &readings, const MeterState &state, bool wifiOk, int offlineQueued) {
  if (!_lcdFound) return;

  // If AC mains is cut / switch opened / PZEM unpowered on backup battery:
  if (readings.voltage < 10.0f) {
    printLine(0, "* DISCONNECTED *");
    char line1[17];
    snprintf(line1, sizeof(line1), "0.0V BATT     0W");
    printLine(1, line1);
    return;
  }

  // Cycle between 2 screens every 3 seconds for comprehensive information
  unsigned long now = millis();
  if (now - _lastPageFlip >= 3000) {
    _lastPageFlip = now;
    _currentPage = (_currentPage + 1) % 2;
  }

  char line0[17];
  char line1[17];

  if (_currentPage == 0) {
    // Page 0: Live AC Measurements (Voltage, Current, Power in Watts, Units Remaining)
    snprintf(line0, sizeof(line0), "%5.1fV %5.2fA", readings.voltage, readings.liveCurrent);
    float powerWatts = readings.activePower * 1000.0f;
    if (powerWatts < 100.0f) {
      snprintf(line1, sizeof(line1), "%5.1fW  %5.1fkWh", powerWatts, state.remainingKwh);
    } else {
      snprintf(line1, sizeof(line1), "%5.0fW  %5.1fkWh", powerWatts, state.remainingKwh);
    }
  } else {
    // Page 1: Power Quality & Network Status
    snprintf(line0, sizeof(line0), "PF:%.2f  %4.1fHz", readings.powerFactor, readings.frequency);
    if (wifiOk) {
      snprintf(line1, sizeof(line1), "RLY:%s  WF:ONLINE", state.isRelayOn ? "ON " : "OFF");
    } else {
      snprintf(line1, sizeof(line1), "RLY:%s Q:%-2d NO-WF", state.isRelayOn ? "ON " : "OFF", offlineQueued);
    }
  }

  printLine(0, line0);
  printLine(1, line1);
}

void MeterDisplay::showTamperAlert(const char *reason) {
  if (!_lcdFound) return;
  printLine(0, "TAMPER DETECTED ");
  printLine(1, reason != nullptr ? reason : "CONTACT ADMIN   ");
}

void MeterDisplay::showPowerCutoff(const char *reason) {
  if (!_lcdFound) return;
  printLine(0, "* POWER CUTOFF *");
  printLine(1, reason);
}

void MeterDisplay::showOvervoltageAlert(float voltage) {
  if (!_lcdFound) return;
  printLine(0, "! OVERVOLTAGE !");
  char buf[17];
  snprintf(buf, sizeof(buf), "CUTOFF: %.1fV", voltage);
  printLine(1, buf);
}
