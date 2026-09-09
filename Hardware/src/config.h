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

#define TELEMETRY_INTERVAL_MS   2000   // 2 Seconds interval for fast, responsive cloud relay synchronization
#define ENERGY_TICK_MS          1000   // 1 Second interval for local energy calculation
#define SERIAL_BAUD_RATE        115200 // Baud rate for Serial Monitor

// 5. Hardware GPIO Pin Assignments
#define RELAY_PIN               27    // Main Power Contactor Relay on pin D27
#define RELAY_ACTIVE_LEVEL      LOW   // Active LOW: LOW (0.0V) = Relay ON (Power connected)
#define RELAY_INACTIVE_LEVEL    HIGH  // HIGH (3.3V) = Relay OFF (Power cut)

#define VOLTAGE_SENSOR_PIN      35    // ZMPT101B AC Voltage Sensor on pin D35 (ADC1 Channel 7)
#define CASE_TAMPER_PIN         14    // Lid Microswitch (Input Pull-up)
#define HALL_MAGNET_PIN         34    // A3144 Hall Effect Magnetic Sensor
#define BUZZER_PIN              19    // Audible Tamper & Status Buzzer
#define STATUS_LED_PIN          2     // Onboard Status LED

// 6. Sensor Modes & Protective Cutoff Limits
#define ENABLE_PHYSICAL_VOLTAGE true  // Enable True RMS sampling from ZMPT101B on D35
#define VOLTAGE_CALIBRATION     295.0f // Multiplier to scale ADC RMS to mains AC RMS (fine-tune with DMM)
#define VOLTAGE_NOISE_FLOOR     10.0f // Noise floor (clamp below 10V when unplugged)
#define OVERVOLTAGE_LIMIT       250.0f // Safety trip threshold: trips relay if mains > 250V
#define UNDERVOLTAGE_LIMIT      175.0f // Brownout warning threshold
#define ENABLE_PHYSICAL_TAMPER_PINS false // Set true when tamper microswitch & Hall sensor are wired
#define ENABLE_SIMULATED_CURRENT false // Set false: Current is strictly 0.00A until CT sensor is connected


