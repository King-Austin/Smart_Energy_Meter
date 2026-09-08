#include "supabase_client.h"
#include <WiFi.h>
#include "config.h"

SupabaseClient Supabase;

void SupabaseClient::begin() {
  secureClient.setInsecure(); // Bypass CA verification for test/prototype phase
}

SupabaseSyncResult SupabaseClient::sendTelemetry(const char *meterId, const SensorReadings &readings, const MeterState &state) {
  SupabaseSyncResult result = { false, 0, true, 0.0f, "" };

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
  doc["p_is_tampered"] = state.isTampered;
  doc["p_is_relay_on"] = state.isRelayOn;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  result.httpCode = httpCode;

  if (httpCode >= 200 && httpCode < 300) {
    String response = http.getString();
    StaticJsonDocument<256> resDoc;
    DeserializationError error = deserializeJson(resDoc, response);

    if (!error) {
      result.success = true;
      result.mainSupplyConnected = resDoc["main_supply_connected"] | true;
      result.prepaidUnitsKwh = resDoc["prepaid_units_kwh"] | 0.0f;
    } else {
      result.errorMessage = "Failed to parse JSON response";
    }
  } else {
    result.errorMessage = "HTTP error: " + String(httpCode) + " -> " + http.getString();
  }

  http.end();
  return result;
}
