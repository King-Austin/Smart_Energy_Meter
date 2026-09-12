#include "supabase_client.h"
#include <WiFi.h>
#include "config.h"

SupabaseClient Supabase;

void SupabaseClient::begin() {
  secureClient.setInsecure(); // Bypass CA verification for test/prototype phase
}

SupabaseSyncResult SupabaseClient::sendTelemetry(const char *meterId, const SensorReadings &readings, const MeterState &state) {
  SupabaseSyncResult result;
  result.success = false;
  result.httpCode = 0;
  result.mainSupplyConnected = true;
  result.tamperLocked = false;
  result.prepaidUnitsKwh = 0.0f;
  result.maxVoltageLimit = 240.0f;
  result.minVoltageLimit = 180.0f;
  result.voltageCutoffTripped = false;
  result.errorMessage = "";

  if (WiFi.status() != WL_CONNECTED) {
    result.errorMessage = "WiFi not connected";
    return result;
  }

  HTTPClient http;
  String url = String(SUPABASE_URL) + String(SUPABASE_RPC_PATH);
  
  if (!http.begin(secureClient, url)) {
    result.errorMessage = "Failed to begin HTTPS connection";
    return result;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  // Construct JSON RPC Payload
  StaticJsonDocument<384> doc;
  doc["p_meter_id"] = meterId;
  doc["p_voltage"] = serialized(String(readings.voltage, 2));
  doc["p_current"] = serialized(String(readings.liveCurrent, 2));
  doc["p_active_power"] = serialized(String(readings.activePower, 2));
  doc["p_power_factor"] = serialized(String(readings.powerFactor, 2));
  doc["p_frequency"] = serialized(String(readings.frequency, 1));
  doc["p_is_tampered"] = state.isTampered; // Latched tamper state
  doc["p_is_relay_on"] = state.isRelayOn;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  result.httpCode = httpCode;

  if (httpCode >= 200 && httpCode < 300) {
    String response = http.getString();
    StaticJsonDocument<384> resDoc;
    DeserializationError error = deserializeJson(resDoc, response);

    if (!error) {
      result.success = true;
      if (resDoc.containsKey("main_supply_connected")) {
        result.mainSupplyConnected = resDoc["main_supply_connected"].as<bool>();
      } else {
        result.mainSupplyConnected = true;
      }
      result.tamperLocked = resDoc["tamper_locked"] | false;
      result.prepaidUnitsKwh = resDoc["prepaid_units_kwh"] | 0.0f;
      result.maxVoltageLimit = resDoc["max_voltage_limit"] | 240.0f;
      result.minVoltageLimit = resDoc["min_voltage_limit"] | 180.0f;
      result.voltageCutoffTripped = resDoc["voltage_cutoff_tripped"] | false;
    } else {
      result.errorMessage = "Failed to parse JSON response";
    }
  } else {
    result.errorMessage = "HTTP error: " + String(httpCode) + " -> " + http.getString();
  }

  http.end();
  return result;
}

bool SupabaseClient::uploadOfflineBatch(const char *meterId, const OfflineTelemetryRecord *records, size_t count) {
  if (count == 0 || WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/telemetry_logs";

  if (!http.begin(secureClient, url)) {
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Prefer", "return=minimal");

  // Allocate dynamic buffer sized for batch (up to 64 records)
  DynamicJsonDocument doc(4096);
  JsonArray array = doc.to<JsonArray>();

  for (size_t i = 0; i < count; i++) {
    JsonObject obj = array.createNestedObject();
    obj["meter_id"] = meterId;
    obj["voltage"] = serialized(String(records[i].voltage, 2));
    obj["current"] = serialized(String(records[i].liveCurrent, 2));
    obj["active_power"] = serialized(String(records[i].activePower, 2));
    obj["power_factor"] = serialized(String(records[i].powerFactor, 2));
    obj["frequency"] = serialized(String(records[i].frequency, 1));
    obj["is_tampered"] = records[i].isTampered;
    obj["is_relay_on"] = records[i].isRelayOn;
  }

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  http.end();

  return (httpCode >= 200 && httpCode < 300);
}
