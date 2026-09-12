#include "buzzer.h"

BuzzerManager Buzzer;

void BuzzerManager::begin() {
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  _alarmActive = false;
  _lastAlarmBurst = 0;
}

void BuzzerManager::emitSilence(uint16_t durationMs) {
  digitalWrite(BUZZER_PIN, LOW);
  delay(durationMs);
}

void BuzzerManager::emitTone(uint16_t freqHz, uint16_t durationMs) {
  if (freqHz == 0 || durationMs == 0) {
    emitSilence(durationMs);
    return;
  }

  // Generate pure square wave (compatible with passive piezos and active buzzers)
  unsigned long halfPeriod = 1000000UL / (freqHz * 2);
  unsigned long cycles = ((unsigned long)freqHz * durationMs) / 1000UL;

  for (unsigned long i = 0; i < cycles; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delayMicroseconds(halfPeriod);
    digitalWrite(BUZZER_PIN, LOW);
    delayMicroseconds(halfPeriod);
  }

  // Ensure pin returns to 0V
  digitalWrite(BUZZER_PIN, LOW);
}

void BuzzerManager::play(BuzzerTone tone) {
  switch (tone) {
    // 1. Ascending Boot Chime (Cheerful "Power Up" sequence)
    case BuzzerTone::BOOT_CHIME:
      emitTone(2000, 70);
      emitSilence(25);
      emitTone(2600, 110);
      break;

    // 2. Wi-Fi Connected (Melodic 3-note confirmation)
    case BuzzerTone::WIFI_CONNECTED:
      emitTone(2093, 60); // C7
      emitSilence(20);
      emitTone(2637, 60); // E7
      emitSilence(20);
      emitTone(3136, 120); // G7
      break;

    // 3. Contactor Snaps ON (Sharp crisp single confirmation pip)
    case BuzzerTone::RELAY_ON:
      emitTone(2800, 45);
      break;

    // 4. Contactor Snaps OFF (Descending double pip)
    case BuzzerTone::RELAY_OFF:
      emitTone(2500, 40);
      emitSilence(30);
      emitTone(1800, 60);
      break;

    // 5. Tamper Alarm Burst (Rapid 3-beep cadence: Beep-Beep-BEEP!)
    case BuzzerTone::TAMPER_ALARM:
      emitTone(2700, 70);
      emitSilence(35);
      emitTone(2700, 70);
      emitSilence(35);
      emitTone(2700, 120);
      break;

    // 6. Overvoltage Alarm (Hazard hi-lo warning)
    case BuzzerTone::OVERVOLTAGE_ALARM:
      emitTone(3200, 100);
      emitSilence(40);
      emitTone(2000, 140);
      break;

    // 7. Prepaid Balance Depleted (Two warning pips)
    case BuzzerTone::ZERO_BALANCE:
      emitTone(2200, 80);
      emitSilence(60);
      emitTone(2200, 80);
      break;

    // 8. Quick subtle status click
    case BuzzerTone::SHORT_PIP:
      emitTone(2500, 30);
      break;
  }
}

void BuzzerManager::startAlarm(BuzzerTone alarmType) {
  _alarmActive = true;
  _activeAlarm = alarmType;
  _lastAlarmBurst = 0; // Trigger immediately on first loop
}

void BuzzerManager::stopAlarm() {
  _alarmActive = false;
  digitalWrite(BUZZER_PIN, LOW);
}

void BuzzerManager::update() {
  if (!_alarmActive) return;

  unsigned long now = millis();
  // Repeat alarm burst every 2.2 seconds (meaningful, urgent, non-droning)
  if (now - _lastAlarmBurst >= 2200) {
    _lastAlarmBurst = now;
    play(_activeAlarm);
  }
}
