# Voltrix Smart Energy Meter ⚡

> **Next-Generation IoT Whole-House Electricity Sub-Meter, Anti-Tamper Protection, and Cloud Energy Sharing Platform.**

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![ESP32-S3](https://img.shields.io/badge/Hardware-ESP32--S3_Dual--Core-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com/)

---

## 📸 System Overview

<div align="center">
  <img src="docs/images/hardware_prototype_v3.jpg" alt="Voltrix Hardware Prototype v3.0" width="85%" style="border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.3); margin-bottom: 20px;" />
</div>

<p align="center">
  <em>Figure 1: Voltrix IoT Hardware Prototype v3.0 — Dual-CT Anti-Bypass, 40A Latching Contactor, HLK-PM01 Power Supply, 18650 Battery, and Tamper Interlock.</em>
</p>

---

## 📱 Mobile App UI Showcase (Apple HIG & Tesla Energy Design)

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="docs/images/voltrix_app_dark.png" alt="Voltrix Dark Theme" width="380px" style="border-radius: 16px;" />
        <br /><strong>Voltrix Dark Theme (Live Topology Flow)</strong>
      </td>
      <td align="center">
        <img src="docs/images/voltrix_app_light.png" alt="Voltrix Light Theme" width="380px" style="border-radius: 16px;" />
        <br /><strong>Voltrix Light Theme (High Contrast)</strong>
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="docs/images/token_success.png" alt="Prepaid Token Recharge" width="380px" style="border-radius: 16px;" />
        <br /><strong>Instant STS 20-Digit Token Generation</strong>
      </td>
      <td align="center">
        <img src="docs/images/wallet_history.png" alt="Smart Auto-Recharge" width="380px" style="border-radius: 16px;" />
        <br /><strong>Energy Wallet & Smart Auto-Recharge Rules</strong>
      </td>
    </tr>
  </table>
</div>

---

## 🌟 Key Capabilities & Features

### 1. 🔀 Live Power Distribution Topology (`EnergyFlowDiagram.tsx`)
- Visual real-time diagram inspired by Tesla Energy:
  - **Utility Grid Feed (230V · 50.0Hz · Grid Synced)**
  - ➔ **Smart Contactor Gateway**
  - ➔ **Home Load (2.45 kW)** / **Backup Battery (82%)** / **Cloud Peer Sharing (420W to Neighbour)**
- Dynamic animated SVG dashed lines showing active electrical flow direction.
- Instant transition to **Islanded Battery Mode** during power blackouts.

### 2. 🛡️ Field-Proof Anti-Tamper & Anti-Bypass Protection
- **Dual-CT Differential Bypass Detection**: Measures Phase current ($I_{\text{Live}}$) and Neutral current ($I_{\text{Neutral}}$). If $|I_{\text{Live}} - I_{\text{Neutral}}| > 300\text{ mA}$, the meter detects a jumper bypass or earth return and trips the contactor instantly.
- **Physical Case Lid Interlock**: Enclosure microswitch wakes the ESP32 on battery power and triggers a permanent lock if the lid is opened.
- **Autonomous Zero-Balance Enforcement**: The ESP32 decrements units locally in RAM. If Wi-Fi is intentionally cut to freeze the cloud, the meter continues counting down and trips power automatically at `0.00 kWh`.
- **40A Magnetic Latching Contactor**: Eliminates contact welding from heavy 1.5HP AC compressor inrush arcs.

### 3. 💳 Apple Wallet Style Prepaid Electricity Account
- **Balance Card**: Live tracking of **`₦14,490`** / **`96.6 kWh remaining`** with dynamic energy runway estimation (**`≈ 12 days left`**).
- **One-Touch Recharge**: Instant preset chips (`₦2,000`, `₦5,000`, `₦10,000`, `₦20,000`), Apple Pay / Card / Bank Transfer checkout.
- **20-Digit STS Token Generator**: Auto-generates standard utility tokens and auto-syncs them to the meter over the cloud.
- **Smart Auto-Recharge Rules**: Configurable low-balance trigger (e.g. auto-recharge ₦5,000 when balance falls below ₦2,000).

### 4. 🌐 Cloud-Synchronized Energy Sharing
- **Meter A ➔ Cloud Backend ➔ Meter B**: Share electricity credits or live power allocation with family or neighbours.
- **Safety Limits**: Configure Power Cap (`250W`, `500W`, `1000W`), Energy Cap (`0.5`, `1.0`, `2.0 kWh`), and Max Duration.
- **Auto-Termination**: Session closes automatically when the energy cap is reached or if either meter drops offline.

### 5. 🔌 Whole-House Remote Supply Disconnect
- **3-Second Press-and-Hold**: Safety-protected contactor control allowing homeowners or estate facility managers to remotely isolate the entire house electrical supply.

---

## 🛠️ Hardware Bill of Materials (BOM)

| Sub-System | Component | Specification |
| :--- | :--- | :--- |
| **Microcontroller** | **ESP32-S3-WROOM-1** | Dual-Core 240MHz, 8MB Flash, 8MB PSRAM, Hardware Crypto |
| **Energy Sensor** | **PZEM-004T v3.0** | High-precision V, I, P, PF, Hz measurement via UART |
| **Bypass CTs** | **2x 100A Split-Core CT** | Dual-CT sensing on Phase and Neutral |
| **Contactor Switch** | **40A / 63A Magnetic Latching Relay** | 230V AC Coil, 100A inrush rating, zero coil heating |
| **Power Supply** | **HLK-PM01 (5V 3W)** | Isolated AC-DC stepdown (85V – 265V AC input) |
| **Battery Backup** | **TP4056 BMS + 18650 Li-Ion** | 24-hour backup power during grid blackouts |
| **Surge Protection** | **14D471K MOV + 10A Ceramic Fuse** | Clamps 4kV lightning and 415V NEPA transformer surges |
| **Tamper Switch** | **SPST Plunger Microswitch** | Detects enclosure lid removal |

> 📖 **Complete Firmware Guide**: Check [ESP32_FIRMWARE_GUIDE.md](ESP32_FIRMWARE_GUIDE.md) for full C++ Arduino code, FreeRTOS dual-core task pinning, and flash wear-leveling algorithms.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ & npm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/King-Austin/Smart_Energy_Meter.git
cd meter_project

# Install dependencies
npm install
```

### 3. Run Local Development Server
```bash
npm run dev
```
- **Web App**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Live Ingestion Endpoint**: `http://localhost:5173/api`

### 4. Production Build
```bash
npm run build
```

---

## 📡 Live REST API Reference

The Vite server includes built-in API middleware for testing live hardware ingestion from ESP32 microcontrollers or curl:

### 1. Ingest Telemetry from ESP32 Hardware
```bash
curl -X POST http://localhost:5173/api/meters/MTR-8A24-19F2/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "voltage": 232.4,
    "current": 10.7,
    "active_power": 2.45,
    "power_factor": 0.96,
    "frequency": 50.0,
    "grid_status": "online",
    "battery_percentage": 82
  }'
```

### 2. Fund Energy Wallet & Generate Token
```bash
curl -X POST http://localhost:5173/api/wallet/fund \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "method": "apple_pay"
  }'
```

### 3. Fetch Live Whole-House Telemetry
```bash
curl -s http://localhost:5173/api/meters/MTR-8A24-19F2/live
```

---

## 📂 Project Structure

```
meter_project/
├── docs/
│   └── images/                     # Architecture & CAD diagrams
├── src/
│   ├── components/
│   │   ├── home/                   # EnergyFlowDiagram, CurrentPowerCard, LiveElectricalCard
│   │   ├── wallet/                 # WalletCard, FundWalletModal
│   │   ├── layout/                 # AppShell, Header, BottomNavigation, SimulationDrawer
│   │   └── notifications/          # NotificationDrawer
│   ├── context/
│   │   └── MeterContext.tsx        # Real-time state machine & telemetry simulation engine
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Live Power Flow & Primary Metrics
│   │   ├── EnergyScreen.tsx        # Consumption curves & projected bills
│   │   ├── WalletScreen.tsx        # Prepaid balance & auto-recharge rules
│   │   ├── ShareScreen.tsx         # Cloud peer energy sharing lifecycle
│   │   ├── DeviceDetailsScreen.tsx # Diagnostics & 3s hold contactor disconnect
│   │   └── SettingsScreen.tsx      # API endpoint configuration & ping test
│   ├── services/
│   │   ├── api.ts                  # REST API Client
│   │   ├── apiServer.ts            # Built-in REST server middleware
│   │   └── mockData.ts             # Default Nigerian utility dataset
│   ├── types/
│   │   └── meter.ts                # TypeScript domain models
│   ├── App.tsx
│   ├── index.css                   # Tailwind v4 tokens & Apple Home styling
│   └── main.tsx
├── ESP32_FIRMWARE_GUIDE.md         # Production hardware, anti-tamper & C++ firmware guide
├── package.json
└── vite.config.ts                  # Vite + React + Tailwind + API server plugin
```

---

## 📄 License
This project is licensed under the MIT License.
