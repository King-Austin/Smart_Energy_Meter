#pragma once

#include <Arduino.h>
#include <WebServer.h>
#include <Update.h>
#include <ArduinoOTA.h>
#include <ESPmDNS.h>
#include "meter_state.h"

// Circular buffer size for storing terminal logs in RAM
#define LOG_BUFFER_SIZE 8192

class WirelessTerminalManager {
public:
  void begin(uint16_t port = 80);
  void handle();
  
  // Terminal logging methods (writes to both Serial and wireless web buffer)
  void print(const String &msg);
  void print(const char *msg);
  void println(const String &msg);
  void println(const char *msg);
  void printf(const char *format, ...);

  // Update current telemetry for the web dashboard header
  void updateTelemetry(const SensorReadings &readings, const MeterState &state, bool wifiOnline);

  // Reference to check if OTA update is currently in progress
  bool isUpdating() const { return _isUpdating; }

private:
  WebServer _server{80};
  char _logBuffer[LOG_BUFFER_SIZE];
  size_t _head = 0;
  bool _wrapped = false;
  bool _isUpdating = false;

  // Cached state for web display
  float _cachedVoltage = 0.0f;
  float _cachedCurrent = 0.0f;
  float _cachedPower = 0.0f;
  float _cachedRemainingKwh = 0.0f;
  bool _cachedRelayOn = true;
  bool _cachedTamper = false;
  bool _cachedWifi = false;

  void appendLog(const char *text);
  void setupWebRoutes();
  void setupArduinoOTA();
  String getIndexHtml();
  String getUpdateHtml();
};

extern WirelessTerminalManager WTerminal;
