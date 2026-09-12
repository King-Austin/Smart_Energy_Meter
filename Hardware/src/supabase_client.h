#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "meter_state.h"

struct SupabaseSyncResult {
  bool success;
  int httpCode;
  bool mainSupplyConnected;
  bool tamperLocked;
  float prepaidUnitsKwh;
  float maxVoltageLimit;
  float minVoltageLimit;
  bool voltageCutoffTripped;
  String errorMessage;
};

class SupabaseClient {
public:
  void begin();
  SupabaseSyncResult sendTelemetry(const char *meterId, const SensorReadings &readings, const MeterState &state);
  bool uploadOfflineBatch(const char *meterId, const OfflineTelemetryRecord *records, size_t count);

private:
  WiFiClientSecure secureClient;
};

extern SupabaseClient Supabase;
