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

// 5. Hardware GPIO Pin Assignments (Aligned with Voltrix Meter PCB Layout)
#define RELAY_PIN               13    // Main Power Contactor Relay on D13
#define RELAY_ACTIVE_LEVEL      HIGH  // HIGH (3.3V) = Relay ON (Contactor closed, bulb ON)
#define RELAY_INACTIVE_LEVEL    LOW   // LOW (0.0V) = Relay OFF (Contactor open, bulb OFF)

#define CASE_TAMPER_PIN         32    // SS-5GL Lid Microswitch on D32 (INPUT_PULLUP: HIGH = Lid Opened)
#define BUZZER_PIN              25    // Audible Alarm Buzzer on D25 (Active HIGH)

// 3x Status LEDs on "LED OUTPUTS" Header
#define LED_PULSE_PIN           26    // LED 1: Energy Pulse / Telemetry Active on D26
#define LED_STATUS_PIN          27    // LED 2: System / Wi-Fi Status on D27
#define LED_ALARM_PIN           14    // LED 3: Tamper / Contactor Cutoff Alarm on D14

// PZEM-004T v3.0 UART Configuration (Hardware Serial2)
#define PZEM_RX_PIN             16    // ESP32 RX2 (D16) <- PZEM TXD
#define PZEM_TX_PIN             17    // ESP32 TX2 (D17) -> PZEM RXD

// I2C 1602 / 2004 LCD Display Configuration
#define LCD_SDA_PIN             21    // ESP32 D21 -> LCD SDA
#define LCD_SCL_PIN             22    // ESP32 D22 -> LCD SCL
#define LCD_I2C_ADDR            0x27  // Default PCF8574 address (0x27 or 0x3F)
#define LCD_COLS                16
#define LCD_ROWS                2

// 6. Sensor Modes & Protective Cutoff Limits
#define ENABLE_PHYSICAL_PZEM    true  // Read real Voltage, Current, Power, Energy from PZEM-004T
#define ENABLE_PHYSICAL_TAMPER  true  // Enable SS-5GL microswitch lid tamper monitoring on D33
#define OVERVOLTAGE_LIMIT       250.0f // Safety trip threshold: trips relay if mains > 250V
#define UNDERVOLTAGE_LIMIT      175.0f // Brownout warning threshold
#define MAX_OFFLINE_RECORDS     64     // Circular RAM buffer for offline telemetry storage



