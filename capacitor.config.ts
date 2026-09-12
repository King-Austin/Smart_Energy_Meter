import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voltrix.smartmeter',
  appName: 'Voltrix Smart Meter',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true // Allows local HTTP communication with ESP32 at http://10.28.133.209 or http://voltrix-meter.local
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0d14'
    },
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: '#0a0d14',
      showSpinner: true,
      spinnerColor: '#ff5b26'
    }
  }
};

export default config;
