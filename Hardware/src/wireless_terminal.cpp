#include "wireless_terminal.h"
#include <WiFi.h>
#include "config.h"
#include "sensors.h"
#include "buzzer.h"

WirelessTerminalManager WTerminal;

// Callback hooks into main hardware controller
extern void setRelay(bool state);
extern void saveNVS();
extern MeterState meter;
extern SensorManager Sensors;
extern BuzzerManager Buzzer;

void WirelessTerminalManager::begin(uint16_t port) {
  memset(_logBuffer, 0, LOG_BUFFER_SIZE);
  _head = 0;
  _wrapped = false;

  // 1. Setup Web Server routes
  setupWebRoutes();
  _server.begin(port);

  // 2. Setup ArduinoOTA for Arduino IDE Network Port flashing
  setupArduinoOTA();

  this->println(F("[WTERMINAL] Wireless Web Terminal & OTA initialized on port 80"));
  this->printf("[WTERMINAL] Access terminal at: http://%s/ or http://voltrix-meter.local/\n",
               WiFi.localIP().toString().c_str());
  this->printf("[WTERMINAL] Access OTA Upload at: http://%s/update\n",
               WiFi.localIP().toString().c_str());
}

void WirelessTerminalManager::setupArduinoOTA() {
  ArduinoOTA.setHostname("voltrix-meter");
  ArduinoOTA.setPassword("voltrix1234"); // Safe default password

  ArduinoOTA.onStart([this]() {
    String type = (ArduinoOTA.getCommand() == U_FLASH) ? "sketch" : "filesystem";
    this->println("\n[OTA] Arduino IDE update starting (" + type + ")...");
    _isUpdating = true;
  });

  ArduinoOTA.onEnd([this]() {
    this->println("\n[OTA] Update successfully finished! Rebooting...");
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    // Keep watchdog happy during large block writes
    yield();
  });

  ArduinoOTA.onError([this](ota_error_t error) {
    this->printf("[OTA] Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) this->println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) this->println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) this->println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) this->println("Receive Failed");
    else if (error == OTA_END_ERROR) this->println("End Failed");
    _isUpdating = false;
  });

  ArduinoOTA.begin();
  MDNS.addService("http", "tcp", 80);
}

void WirelessTerminalManager::setupWebRoutes() {
  // 1. Root Terminal Page
  _server.on("/", HTTP_GET, [this]() {
    _server.send(200, "text/html", getIndexHtml());
  });

  // 2. Real-time Logs API Endpoint
  _server.on("/api/logs", HTTP_GET, [this]() {
    String logs;
    logs.reserve(LOG_BUFFER_SIZE + 64);
    if (_wrapped) {
      logs += String(_logBuffer + _head, LOG_BUFFER_SIZE - _head);
    }
    logs += String(_logBuffer, _head);
    _server.send(200, "text/plain", logs);
  });

  // 3. Clear Log Buffer Endpoint
  _server.on("/api/clear", HTTP_POST, [this]() {
    memset(_logBuffer, 0, LOG_BUFFER_SIZE);
    _head = 0;
    _wrapped = false;
    _server.send(200, "application/json", "{\"success\":true}");
  });

  // 4. Remote Hardware Actions Endpoint
  _server.on("/api/action", HTTP_POST, [this]() {
    String cmd = _server.arg("cmd");
    if (cmd == "toggle_relay") {
      setRelay(!meter.isRelayOn);
      saveNVS();
      this->printf("\n[WIRELESS COMMAND] Relay toggled to: %s\n", meter.isRelayOn ? "ON" : "OFF");
      _server.send(200, "application/json", "{\"success\":true,\"state\":" + String(meter.isRelayOn ? "true" : "false") + "}");
    } else if (cmd == "clear_tamper") {
      Sensors.clearTamper(meter);
      Buzzer.stopAlarm();
      setRelay(true);
      saveNVS();
      this->println(F("\n[WIRELESS COMMAND] Tamper lock cleared via Web Terminal! Contactor re-engaged."));
      _server.send(200, "application/json", "{\"success\":true}");
    } else if (cmd == "reboot") {
      this->println(F("\n[WIRELESS COMMAND] Reboot requested via Web Terminal. Restarting in 1s..."));
      _server.send(200, "application/json", "{\"success\":true,\"message\":\"Rebooting\"}");
      delay(800);
      ESP.restart();
    } else {
      _server.send(400, "application/json", "{\"error\":\"Unknown command\"}");
    }
  });

  // 5. Real-time Hardware Telemetry Status API
  _server.on("/api/status", HTTP_GET, [this]() {
    String json = "{";
    json += "\"voltage\":" + String(_cachedVoltage, 1) + ",";
    json += "\"current\":" + String(_cachedCurrent, 2) + ",";
    json += "\"power\":" + String(_cachedPower, 2) + ",";
    json += "\"remaining_kwh\":" + String(_cachedRemainingKwh, 1) + ",";
    json += "\"relay\":" + String(_cachedRelayOn ? "true" : "false") + ",";
    json += "\"tamper\":" + String(_cachedTamper ? "true" : "false") + ",";
    json += "\"wifi\":" + String(_cachedWifi ? "true" : "false");
    json += "}";
    _server.send(200, "application/json", json);
  });

  // 5. Web OTA Firmware Upload Page
  _server.on("/update", HTTP_GET, [this]() {
    _server.send(200, "text/html", getUpdateHtml());
  });

  // 6. Web OTA Upload Handler
  _server.on("/update", HTTP_POST, [this]() {
    _server.sendHeader("Connection", "close");
    if (Update.hasError()) {
      _server.send(500, "text/plain", "Update Failed: " + String(Update.errorString()));
    } else {
      _server.send(200, "text/html", "<h3>Update Complete! Rebooting ESP32...</h3><script>setTimeout(()=>window.location.href='/', 6000);</script>");
      delay(600);
      ESP.restart();
    }
  }, [this]() {
    HTTPUpload &upload = _server.upload();
    if (upload.status == UPLOAD_FILE_START) {
      this->printf("\n[WEB OTA] Starting firmware upload: %s\n", upload.filename.c_str());
      _isUpdating = true;
      if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
        this->println("[WEB OTA] Error: Update.begin failed");
        Update.printError(Serial);
      }
    } else if (upload.status == UPLOAD_FILE_WRITE) {
      if (Update.write(upload.buf, upload.currentSize) != upload.currentSize) {
        this->println("[WEB OTA] Error: Update.write failed");
        Update.printError(Serial);
      }
    } else if (upload.status == UPLOAD_FILE_END) {
      if (Update.end(true)) {
        this->printf("[WEB OTA] Upload successful! Total size: %u bytes\n", upload.totalSize);
      } else {
        this->println("[WEB OTA] Error: Update.end failed");
        Update.printError(Serial);
      }
      _isUpdating = false;
    }
  });
}

void WirelessTerminalManager::handle() {
  _server.handleClient();
  ArduinoOTA.handle();
}

void WirelessTerminalManager::appendLog(const char *text) {
  size_t len = strlen(text);
  for (size_t i = 0; i < len; i++) {
    _logBuffer[_head] = text[i];
    _head++;
    if (_head >= LOG_BUFFER_SIZE) {
      _head = 0;
      _wrapped = true;
    }
  }
}

void WirelessTerminalManager::print(const String &msg) {
  Serial.print(msg);
  appendLog(msg.c_str());
}

void WirelessTerminalManager::print(const char *msg) {
  Serial.print(msg);
  appendLog(msg);
}

void WirelessTerminalManager::println(const String &msg) {
  Serial.println(msg);
  appendLog(msg.c_str());
  appendLog("\n");
}

void WirelessTerminalManager::println(const char *msg) {
  Serial.println(msg);
  appendLog(msg);
  appendLog("\n");
}

void WirelessTerminalManager::printf(const char *format, ...) {
  char locBuf[256];
  va_list args;
  va_start(args, format);
  vsnprintf(locBuf, sizeof(locBuf), format, args);
  va_end(args);

  Serial.print(locBuf);
  appendLog(locBuf);
}

void WirelessTerminalManager::updateTelemetry(const SensorReadings &readings, const MeterState &state, bool wifiOnline) {
  _cachedVoltage = readings.voltage;
  _cachedCurrent = readings.liveCurrent;
  _cachedPower = readings.activePower;
  _cachedRemainingKwh = state.remainingKwh;
  _cachedRelayOn = state.isRelayOn;
  _cachedTamper = state.isTampered;
  _cachedWifi = wifiOnline;
}

String WirelessTerminalManager::getIndexHtml() {
  String html = F(
    "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
    "<title>Voltrix Smart Meter - Wireless Terminal</title>"
    "<style>"
    "* { box-sizing: border-box; margin: 0; padding: 0; }"
    "body { background: #0b1120; color: #f1f5f9; font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; padding: 16px; }"
    ".container { max-width: 960px; margin: 0 auto; }"
    ".header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #1e293b; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }"
    ".brand { font-size: 1.15rem; font-weight: 800; color: #ff5b26; display: flex; align-items: center; gap: 8px; }"
    ".pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }"
    ".pill { background: #1e293b; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; font-family: monospace; }"
    ".pill.ok { border-color: #10b981; color: #34d399; }"
    ".pill.warn { border-color: #ef4444; color: #f87171; }"
    ".actions { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }"
    "button { background: #1e293b; color: #f1f5f9; border: 1px solid #475569; padding: 8px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }"
    "button:hover { background: #334155; border-color: #ff5b26; }"
    "button.primary { background: #ff5b26; border-color: #ff5b26; color: #fff; }"
    "button.primary:hover { background: #e04a1a; }"
    "button.danger { background: #ef4444; border-color: #dc2626; color: #fff; }"
    ".terminal-card { background: #020617; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }"
    ".term-top { background: #0f172a; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; font-size: 0.78rem; font-weight: 600; color: #94a3b8; }"
    "#logBox { height: 480px; overflow-y: auto; padding: 14px; font-family: Consolas,Monaco,'Lucida Console',monospace; font-size: 0.82rem; line-height: 1.5; white-space: pre-wrap; word-break: break-all; color: #38bdf8; background: #020617; }"
    ".ota-link { color: #ff5b26; text-decoration: none; font-weight: 700; font-size: 0.82rem; margin-left: 8px; }"
    "</style></head><body>"
    "<div class='container'>"
    "<div class='header'>"
    "<div class='brand'>⚡ Voltrix Smart Meter - Wireless Live Console</div>"
    "<div><a href='/update' class='ota-link'>📦 Wireless OTA Firmware Update &rarr;</a></div>"
    "</div>"
    "<div class='pills'>"
    "<div class='pill'>IP: "
  );
  html += WiFi.localIP().toString();
  html += F("</div>"
    "<div class='pill' id='pMains'>AC Mains: Checking...</div>"
    "<div class='pill' id='pRelay'>Relay D13: Checking...</div>"
    "<div class='pill' id='pTamper'>Tamper D32: Checking...</div>"
    "<div class='pill' id='pHeap'>Free Heap: ");
  html += String(ESP.getFreeHeap() / 1024);
  html += F(" KB</div></div>"
    "<div class='actions'>"
    "<button onclick='runCmd(\"toggle_relay\")'>⚡ Toggle Relay (D13)</button>"
    "<button onclick='runCmd(\"clear_tamper\")'>🛡️ Clear Tamper Lock</button>"
    "<button onclick='clearLogs()'>🧹 Clear Console</button>"
    "<button class='danger' onclick='if(confirm(\"Reboot ESP32?\"))runCmd(\"reboot\")'>🔄 Reboot ESP32</button>"
    "</div>"
    "<div class='terminal-card'>"
    "<div class='term-top'>"
    "<span>Live Serial Output (115200 Baud Stream - Zero Mock Data)</span>"
    "<span><label><input type='checkbox' id='autoScroll' checked> Auto-scroll</label></span>"
    "</div>"
    "<div id='logBox'>Connecting to live stream...</div>"
    "</div>"
    "</div>"
    "<script>"
    "const box = document.getElementById('logBox');"
    "const scrollCheck = document.getElementById('autoScroll');"
    "let lastLen = 0;"
    "async function fetchLogs() {"
    "  try {"
    "    const res = await fetch('/api/logs');"
    "    if (res.ok) {"
    "      const text = await res.text();"
    "      if (text.length !== lastLen) {"
    "        box.textContent = text;"
    "        lastLen = text.length;"
    "        if (scrollCheck.checked) box.scrollTop = box.scrollHeight;"
    "      }"
    "    }"
    "  } catch (e) {}"
    "}"
    "async function updateStatus() {"
    "  try {"
    "    const res = await fetch('/api/status');"
    "    if (res.ok) {"
    "      const s = await res.json();"
    "      const pM = document.getElementById('pMains');"
    "      const pR = document.getElementById('pRelay');"
    "      const pT = document.getElementById('pTamper');"
    "      if (s.voltage < 10) {"
    "        pM.className = 'pill warn';"
    "        pM.textContent = 'AC Mains: DISCONNECTED (0.0V)';"
    "      } else {"
    "        pM.className = 'pill ok';"
    "        pM.textContent = 'AC Mains: ' + s.voltage.toFixed(1) + 'V · ' + s.current.toFixed(2) + 'A · ' + s.power.toFixed(2) + 'kW';"
    "      }"
    "      pR.className = s.relay ? 'pill ok' : 'pill warn';"
    "      pR.textContent = 'Relay D13: ' + (s.relay ? 'CLOSED (ON)' : 'OPEN (CUT)');"
    "      pT.className = !s.tamper ? 'pill ok' : 'pill warn';"
    "      pT.textContent = 'Tamper: ' + (!s.tamper ? 'SECURE' : 'BREACH');"
    "    }"
    "  } catch(e) {}"
    "}"
    "async function runCmd(cmd) {"
    "  try {"
    "    await fetch('/api/action?cmd=' + cmd, { method: 'POST' });"
    "    fetchLogs();"
    "    updateStatus();"
    "  } catch(e) { alert('Command failed: ' + e); }"
    "}"
    "async function clearLogs() {"
    "  try {"
    "    await fetch('/api/clear', { method: 'POST' });"
    "    box.textContent = '';"
    "    lastLen = 0;"
    "  } catch(e) {}"
    "}"
    "setInterval(fetchLogs, 800);"
    "setInterval(updateStatus, 1500);"
    "fetchLogs();"
    "updateStatus();"
    "</script></body></html>"
  );
  return html;
}

String WirelessTerminalManager::getUpdateHtml() {
  String html = F(
    "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
    "<title>Voltrix Smart Meter - Wireless OTA Update</title>"
    "<style>"
    "* { box-sizing: border-box; margin: 0; padding: 0; }"
    "body { background: #0b1120; color: #f1f5f9; font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; padding: 24px; }"
    ".card { max-width: 540px; margin: 40px auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }"
    "h2 { color: #ff5b26; font-size: 1.35rem; margin-bottom: 8px; font-weight: 800; }"
    "p { color: #94a3b8; font-size: 0.88rem; line-height: 1.5; margin-bottom: 20px; }"
    ".steps { background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; margin-bottom: 20px; font-size: 0.8rem; color: #cbd5e1; line-height: 1.6; }"
    ".steps ol { margin-left: 18px; }"
    "input[type=file] { width: 100%; padding: 12px; border: 2px dashed #334155; border-radius: 10px; background: #020617; color: #94a3b8; margin-bottom: 18px; cursor: pointer; }"
    "input[type=submit] { width: 100%; background: #ff5b26; border: none; padding: 12px; border-radius: 10px; color: #fff; font-size: 0.95rem; font-weight: 800; cursor: pointer; transition: background 0.2s; }"
    "input[type=submit]:hover { background: #e04a1a; }"
    "#progressBox { display: none; margin-top: 16px; }"
    "#progressBar { width: 0%; height: 10px; background: #10b981; border-radius: 5px; transition: width 0.2s; }"
    ".back-link { display: inline-block; margin-top: 18px; color: #38bdf8; text-decoration: none; font-size: 0.85rem; font-weight: 600; }"
    "</style></head><body>"
    "<div class='card'>"
    "<h2>📦 Wireless OTA Firmware Update</h2>"
    "<p>Flash new firmware to your ESP32 wirelessly over Wi-Fi without touching any cables.</p>"
    "<div class='steps'>"
    "<strong>How to get the .bin file from Arduino IDE:</strong>"
    "<ol>"
    "<li>In Arduino IDE, open <code>Hardware.ino</code>.</li>"
    "<li>Click <strong>Sketch &rarr; Export Compiled Binary</strong> (or press <code>Ctrl+Alt+S</code>).</li>"
    "<li>The <code>.bin</code> file will be in the <code>build/</code> or sketch folder.</li>"
    "<li>Select that <code>.bin</code> file below and click <strong>Flash Firmware Wirelessly</strong>.</li>"
    "</ol>"
    "</div>"
    "<form method='POST' action='/update' enctype='multipart/form-data' id='uploadForm'>"
    "<input type='file' name='update' accept='.bin' required id='fileInput'>"
    "<input type='submit' value='⚡ Flash Firmware Wirelessly' id='submitBtn'>"
    "</form>"
    "<div id='progressBox'>"
    "<p id='progressText'>Uploading firmware... please keep power connected.</p>"
    "<div style='background:#1e293b; border-radius:5px; height:10px; overflow:hidden; margin-top:6px;'>"
    "<div id='progressBar'></div>"
    "</div>"
    "</div>"
    "<a href='/' class='back-link'>&larr; Return to Wireless Console</a>"
    "</div>"
    "<script>"
    "const form = document.getElementById('uploadForm');"
    "const pBox = document.getElementById('progressBox');"
    "const pBar = document.getElementById('progressBar');"
    "const pText = document.getElementById('progressText');"
    "const sBtn = document.getElementById('submitBtn');"
    "form.onsubmit = function(e) {"
    "  e.preventDefault();"
    "  const file = document.getElementById('fileInput').files[0];"
    "  if (!file) return;"
    "  sBtn.disabled = true;"
    "  pBox.style.display = 'block';"
    "  const xhr = new XMLHttpRequest();"
    "  xhr.open('POST', '/update', true);"
    "  xhr.upload.onprogress = function(e) {"
    "    if (e.lengthComputable) {"
    "      const pct = Math.round((e.loaded / e.total) * 100);"
    "      pBar.style.width = pct + '%';"
    "      pText.textContent = 'Uploading firmware (' + pct + '%)... Please do not disconnect power.'; "
    "    }"
    "  };"
    "  xhr.onload = function() {"
    "    if (xhr.status === 200) {"
    "      pText.innerHTML = '<strong style=\"color:#34d399;\">✓ Flash Succeeded! Rebooting ESP32...</strong> Redirecting in 6s...';"
    "      setTimeout(() => window.location.href = '/', 6000);"
    "    } else {"
    "      pText.innerHTML = '<strong style=\"color:#f87171;\">✗ Upload Failed:</strong> ' + xhr.responseText;"
    "      sBtn.disabled = false;"
    "    }"
    "  };"
    "  xhr.onerror = function() {"
    "    pText.innerHTML = '<strong style=\"color:#f87171;\">✗ Network connection error during upload.</strong>';"
    "    sBtn.disabled = false;"
    "  };"
    "  const formData = new FormData();"
    "  formData.append('update', file);"
    "  xhr.send(formData);"
    "};"
    "</script></body></html>"
  );
  return html;
}
