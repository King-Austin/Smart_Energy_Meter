#pragma once
#include <Arduino.h>
#include "config.h"

enum class BuzzerTone {
  BOOT_CHIME,         // Cheerful ascending startup sound
  WIFI_CONNECTED,     // Melodic 2-tone success chime
  RELAY_ON,           // Sharp, crisp contactor-on confirmation
  RELAY_OFF,          // Descending disconnect chirp
  TAMPER_ALARM,       // Urgent 3-beep warning burst (intermittent)
  OVERVOLTAGE_ALARM,  // Alternating 2-tone hazard siren
  ZERO_BALANCE,       // Double warning beep
  SHORT_PIP           // 30ms subtle touch/status pip
};

class BuzzerManager {
public:
  void begin();
  void play(BuzzerTone tone);
  
  // Non-blocking alarm management (emits meaningful periodic bursts, not continuous drones)
  void startAlarm(BuzzerTone alarmType);
  void stopAlarm();
  void update(); // Call in loop() to maintain alarm rhythmic cadence without blocking
  bool isAlarmActive() const { return _alarmActive; }

private:
  bool _alarmActive = false;
  BuzzerTone _activeAlarm = BuzzerTone::TAMPER_ALARM;
  unsigned long _lastAlarmBurst = 0;

  void emitTone(uint16_t freqHz, uint16_t durationMs);
  void emitSilence(uint16_t durationMs);
};

extern BuzzerManager Buzzer;
