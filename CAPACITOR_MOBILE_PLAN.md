# 📱 Capacitor Native Mobile App Conversion Blueprint

This guide provides the complete, step-by-step technical plan to wrap the **Voltrix Smart Energy Meter** React + Vite web dashboard into a native mobile application for **Android** (APK / Google Play AAB) and **iOS** (Apple App Store / TestFlight) using **Capacitor 6+**.

---

## 1. Architecture & Technology Stack

- **Core Framework**: React 19 + TypeScript + Vite
- **Native Runtime**: Ionic Capacitor (`@capacitor/core`, `@capacitor/cli`)
- **Native Platforms**:
  - Android: Gradle + Java / Kotlin (`@capacitor/android`)
  - iOS: CocoaPods / SwiftPM (`@capacitor/ios`)
- **Native Hardware Plugins**:
  - `@capacitor/status-bar`: Immersive dark / light status bar theme
  - `@capacitor/splash-screen`: Native launch screen with Voltrix branding
  - `@capacitor/network`: Real-time network listener (detects Wi-Fi disconnection on phone)
  - `@capacitor/haptics`: Physical vibration feedback on contactor toggle / alarm trips
  - `@capacitor/local-notifications`: Instant push alerts when overvoltage or tamper triggers

---

## 2. Step-by-Step Implementation Instructions

### Step 1: Install Capacitor Dependencies
Run in your project root terminal:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/status-bar @capacitor/splash-screen @capacitor/network @capacitor/haptics @capacitor/local-notifications
```

---

### Step 2: Initialize Capacitor Configuration
Run non-interactively:
```bash
npx cap init "Voltrix Smart Meter" "com.voltrix.smartmeter" --web-dir "dist"
```

This generates `capacitor.config.ts`. Configure it with deep link schemes and native status bar properties:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voltrix.smartmeter',
  appName: 'Voltrix Smart Meter',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true // Allows local HTTP communication with ESP32 (http://10.28.133.209 or http://voltrix-meter.local)
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0d14'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0d14',
      androidSplashResourceName: 'splash',
      showSpinner: true,
      spinnerColor: '#ff5b26'
    }
  }
};

export default config;
```

---

### Step 3: Build the Web Distribution Bundle
Before adding native platforms or syncing code, compile the production bundle:
```bash
npm run build
```
*(This produces the static files in `dist/` that Capacitor packages inside the mobile binary).*

---

### Step 4: Add Native Platforms (Android & iOS)

#### For Android (Windows / Mac / Linux):
```bash
npx cap add android
```
This generates the `android/` directory with a full Android Studio project.

#### For iOS (macOS only, requires Xcode):
```bash
npx cap add ios
```
This generates the `ios/` directory with an Xcode workspace (`App.xcworkspace`).

---

### Step 5: Android Permissions Configuration
Open `android/app/src/main/AndroidManifest.xml` and add the following permissions inside `<manifest>`:

```xml
<!-- Network & Wi-Fi Permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />

<!-- Haptics & Vibration Feedback -->
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Local Notifications for Safety Trips -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

To allow direct local Wi-Fi communication with the ESP32 without HTTPS certificate errors, ensure `android:usesCleartextTraffic="true"` is set inside `<application>`:
```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="true">
```

---

### Step 6: Sync Web Code to Native Projects
Whenever you make changes to React / CSS / TypeScript:
```bash
npm run build
npx cap sync
```

---

### Step 7: Running & Building Native Binaries

#### To Open in Android Studio:
```bash
npx cap open android
```
- In Android Studio:
  - Click **Run** (`Shift + F10`) to launch directly on your physical Android phone (via USB debugging or Wi-Fi pairing).
  - To generate a release APK: Click **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.

#### To Open in Xcode (Mac):
```bash
npx cap open ios
```
- Select your connected iPhone or Simulator and press `Cmd + R`.

---

## 3. Native App UX Optimizations Already Handled

1. **Safe Area Insets**:
   The CSS contains standard padding for mobile notches and gesture navigation bars:
   `padding-top: env(safe-area-inset-top)` and `padding-bottom: env(safe-area-inset-bottom)`.
2. **Mobile Touch Feedback**:
   Buttons include active scale down (`active:scale-95`), pull-to-refresh considerations, and swipe gestures.
3. **Dual Network Mode**:
   Can communicate via **Supabase Cloud** when on cellular/remote 4G/5G, and automatically fallback to **Local Wi-Fi** when connected to the meter's local network (`10.28.133.209`).

---

## 4. Build Status & Ready APK

✅ **Status**: Fully Compiled & Verified.
- **Built APK Path**: [`Voltrix-SmartMeter-debug.apk`](file:///c:/Users/kingaustin/Downloads/meter_project/Voltrix-SmartMeter-debug.apk) (4.4 MB)
- **Direct Gradle Output**: [`android/app/build/outputs/apk/debug/app-debug.apk`](file:///c:/Users/kingaustin/Downloads/meter_project/android/app/build/outputs/apk/debug/app-debug.apk)
- **To Install Directly on Phone**: Connect your phone via USB with USB debugging enabled, then run:
  ```powershell
  adb install -r Voltrix-SmartMeter-debug.apk
  ```
  Or transfer the `.apk` file directly to your phone via WhatsApp/Google Drive/USB cable and tap to install!

