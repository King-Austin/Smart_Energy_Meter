#pragma once

// ================================================================
// VOLTRIX SMART ENERGY METER - HARDWARE CONFIGURATION
// ================================================================

// 1. Wi-Fi Credentials
#define WIFI_SSID           "testmode"
#define WIFI_PASS           "#kingaustin"

// 2. Supabase Cloud Configuration (Project: kmosslvdjdhrjgvitctr)
#define SUPABASE_URL        "https://kmosslvdjdhrjgvitctr.supabase.co"
#define SUPABASE_RPC_PATH   "/rest/v1/rpc/record_telemetry"
#define SUPABASE_KEY        "sb_publishable_kqmfZWv3kcKV5v4QMvlZkQ_x8ohW0Oj"

// 3. Meter Hardware Identity
#define DEFAULT_METER_ID    "MTR-8A24-19F2"

// 4. Monitoring & Telemetry Intervals
#define TELEMETRY_INTERVAL_MS   5000   // 5 Seconds interval for cloud sync
#define ENERGY_TICK_MS          1000   // 1 Second interval for local energy calculation
#define SERIAL_BAUD_RATE        115200 // Baud rate for Serial Monitor

// 5. Hardware GPIO Pin Assignments
#define RELAY_SET_PIN       23    // Contactor Pulse ON (50ms pulse)
#define RELAY_RESET_PIN     22    // Contactor Pulse OFF (50ms pulse)
#define CASE_TAMPER_PIN     14    // Lid Microswitch (Input Pull-up)
#define HALL_MAGNET_PIN     34    // A3144 Hall Effect Magnetic Sensor
#define BUZZER_PIN          19    // Audible Tamper & Status Buzzer
#define STATUS_LED_PIN      2     // Onboard Status LED

// 6. Simulation & Bench Testing
// Set to true only when physical microswitch and sensors are wired.
// Defaults to false so a bare ESP32 sends live simulated telemetry without floating-pin trips.
#define ENABLE_PHYSICAL_TAMPER_PINS false
