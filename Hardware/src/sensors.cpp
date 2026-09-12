#include "sensors.h"
#include <HardwareSerial.h>
#include "config.h"
#include "buzzer.h"

SensorManager Sensors;

// Dedicated Hardware Serial 2 for PZEM-004T v3.0
static HardwareSerial pzemSerial(2);

void SensorManager::begin() {
  // 1. Initialize PZEM-004T UART interface (9600 Baud, 8N1)
  pzemSerial.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);
  Serial.printf("[PZEM UART] Listening on RX2 (GPIO %d) & TX2 (GPIO %d) @ 9600 baud\n",
                PZEM_RX_PIN, PZEM_TX_PIN);

  // 2. Hardware Tamper & Alarm Pins
  pinMode(CASE_TAMPER_PIN, INPUT_PULLUP);
  Buzzer.begin();

  pinMode(LED_ALARM_PIN, OUTPUT);
  digitalWrite(LED_ALARM_PIN, LOW);
}

uint16_t SensorManager::calculateCRC16(const uint8_t *data, uint16_t length) {
  uint16_t crc = 0xFFFF;
  for (uint16_t i = 0; i < length; i++) {
    crc ^= data[i];
    for (uint8_t j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc;
}

bool SensorManager::readPZEM(SensorReadings &readings) {
  // Flush any lingering bytes in buffer
  while (pzemSerial.available()) {
    pzemSerial.read();
  }

  // Modbus Read Command: Read 10 input registers from 0x0000
  // Try default 0x01 (CRC 0x70 0x0D) or broadcast 0xF8 (CRC 0x64 0x64)
  static const uint8_t requestMsg[] = {0x01, 0x04, 0x00, 0x00, 0x00, 0x0A, 0x70, 0x0D};
  pzemSerial.write(requestMsg, sizeof(requestMsg));
  pzemSerial.flush();

  // Wait for 25-byte response with 250ms timeout
  unsigned long startWait = millis();
  while (pzemSerial.available() < 25 && (millis() - startWait < 250)) {
    delay(5);
  }

  // If no response to 0x01, retry with broadcast 0xF8
  if (pzemSerial.available() < 25) {
    static const uint8_t broadcastMsg[] = {0xF8, 0x04, 0x00, 0x00, 0x00, 0x0A, 0x64, 0x64};
    while (pzemSerial.available()) pzemSerial.read();
    pzemSerial.write(broadcastMsg, sizeof(broadcastMsg));
    pzemSerial.flush();

    startWait = millis();
    while (pzemSerial.available() < 25 && (millis() - startWait < 250)) {
      delay(5);
    }
  }

  if (pzemSerial.available() < 25) {
    pzemResponding = false;
    return false;
  }

  uint8_t response[25];
  pzemSerial.readBytes(response, 25);

  // Validate Modbus header: Function=0x04, Bytes=0x14 (20 data bytes)
  if (response[1] != 0x04 || response[2] != 0x14) {
    pzemResponding = false;
    return false;
  }

  // Validate CRC16
  uint16_t receivedCRC = (response[24] << 8) | response[23];
  uint16_t computedCRC = calculateCRC16(response, 23);
  if (receivedCRC != computedCRC) {
    pzemResponding = false;
    return false;
  }

  // Parse measurements (registers are Big-Endian / Modbus standard)
  // 1. Voltage: 0.1V resolution
  uint16_t rawVoltage = ((uint16_t)response[3] << 8) | response[4];
  readings.voltage = rawVoltage / 10.0f;

  // 2. Current: 0.001A resolution (Low word @ Reg 1, High word @ Reg 2)
  uint32_t rawCurrent = ((uint32_t)response[7] << 24) |
                        ((uint32_t)response[8] << 16) |
                        ((uint32_t)response[5] << 8)  |
                        response[6];
  readings.liveCurrent = rawCurrent / 1000.0f;
  readings.neutralCurrent = readings.liveCurrent;

  // 3. Active Power: 0.1W resolution -> convert to kW
  uint32_t rawPower = ((uint32_t)response[11] << 24) |
                      ((uint32_t)response[12] << 16) |
                      ((uint32_t)response[9] << 8)   |
                      response[10];
  readings.activePower = (rawPower / 10.0f) / 1000.0f; // kW

  // 4. Frequency: 0.1Hz resolution
  uint16_t rawFreq = ((uint16_t)response[17] << 8) | response[18];
  readings.frequency = rawFreq / 10.0f;

  // 5. Power Factor: 0.01 resolution
  uint16_t rawPF = ((uint16_t)response[19] << 8) | response[20];
  readings.powerFactor = rawPF / 100.0f;

  // Calculate apparent and reactive powers
  readings.apparentPower = (readings.voltage * readings.liveCurrent) / 1000.0f;
  readings.reactivePower = sqrt(max(0.0f, sq(readings.apparentPower) - sq(readings.activePower)));

  pzemResponding = true;
  return true;
}

void SensorManager::readSensors(SensorReadings &readings) {
#if ENABLE_PHYSICAL_PZEM
  // Attempt physical hardware reading from PZEM-004T
  if (readPZEM(readings)) {
    return;
  }
#endif

  // ZERO MOCK DATA: When AC mains is cut, switch opened, or PZEM offline,
  // all values are strictly 0.0! NO SIMULATION!
  pzemResponding = false;
  readings.voltage = 0.0f;
  readings.liveCurrent = 0.0f;
  readings.neutralCurrent = 0.0f;
  readings.activePower = 0.0f;
  readings.apparentPower = 0.0f;
  readings.reactivePower = 0.0f;
  readings.powerFactor = 0.0f;
  readings.frequency = 0.0f;
}

bool SensorManager::checkTamperConditions(MeterState &state, const SensorReadings &readings) {
#if ENABLE_PHYSICAL_TAMPER
  // SS-5GL Enclosure Lid Microswitch on D33 (INPUT_PULLUP)
  // Switch is closed/depressed to GND when lid is secured (LOW)
  // When lid is removed/loosened, switch opens -> pin pulled HIGH -> Tamper Triggered
  if (digitalRead(CASE_TAMPER_PIN) == HIGH) {
    triggerTamper(state, TamperType::CASE_LID_OPENED);
    return true;
  }
#endif

  return false;
}

void SensorManager::triggerTamper(MeterState &state, TamperType type) {
  state.isTampered = true;
  state.tamperReason = type;
  Buzzer.startAlarm(BuzzerTone::TAMPER_ALARM); // Rhythmic 3-beep warning bursts
  digitalWrite(LED_ALARM_PIN, HIGH);           // Solid ALARM LED (D14)
}

void SensorManager::clearTamper(MeterState &state) {
  state.isTampered = false;
  state.tamperReason = TamperType::NONE;
  Buzzer.stopAlarm();
  digitalWrite(LED_ALARM_PIN, LOW);
}
