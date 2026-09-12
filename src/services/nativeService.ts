import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { initCapacitorBackNavigation } from './navigationService';

/**
 * Initialize native mobile features (Status Bar, Safe Areas, Notification Channels, Back Navigation)
 */
export async function initNativeMobileApp() {
  // Always initialize back navigation (has native Capacitor + web popstate listeners)
  initCapacitorBackNavigation();

  if (!Capacitor.isNativePlatform()) {
    console.log('[Native] Running in Web Browser mode.');
    return;
  }

  console.log('[Native] Running in Native Platform mode:', Capacitor.getPlatform());

  // 1. Configure Native Status Bar
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0d14' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn('[Native] StatusBar initialization notice:', err);
  }

  // 2. Request Notification Permissions & Create Alert Channel
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    // Register high-priority channel on Android
    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: 'voltrix_alerts',
        name: 'Voltrix Critical Alerts',
        description: 'Overvoltage trips, lid tamper breaches, and contactor cutoffs',
        importance: 5,
        visibility: 1,
        sound: 'alert.wav',
        vibration: true
      });
    }
  } catch (err) {
    console.warn('[Native] LocalNotifications initialization notice:', err);
  }
}

/**
 * Listen for native network changes (Wi-Fi / Cellular / Offline)
 */
export function listenToNetworkChanges(callback: (status: ConnectionStatus) => void) {
  if (Capacitor.isNativePlatform()) {
    Network.addListener('networkStatusChange', status => {
      console.log('[Native] Network status changed:', status);
      callback(status);
    });

    // Check initial status
    Network.getStatus().then(callback).catch(() => {});
  } else {
    // Fallback to browser online/offline events
    window.addEventListener('online', () => {
      callback({ connected: true, connectionType: 'wifi' });
    });
    window.addEventListener('offline', () => {
      callback({ connected: false, connectionType: 'none' });
    });
    callback({ connected: navigator.onLine, connectionType: navigator.onLine ? 'wifi' : 'none' });
  }
}

/**
 * Native Haptic Feedback on button clicks, contactor flips, and alarms
 */
export async function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  if (Capacitor.isNativePlatform()) {
    try {
      if (type === 'light') {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (type === 'medium') {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (type === 'heavy') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (type === 'success') {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (type === 'warning') {
        await Haptics.notification({ type: NotificationType.Warning });
      } else if (type === 'error') {
        await Haptics.notification({ type: NotificationType.Error });
      }
    } catch {
      // Haptics unavailable
    }
  } else if ('vibrate' in navigator) {
    // Web vibration fallback
    if (type === 'heavy' || type === 'error') {
      navigator.vibrate([100, 50, 100]);
    } else {
      navigator.vibrate(40);
    }
  }
}

/**
 * Send an immediate native push notification (e.g. for Overvoltage Cutoff or Tamper Breach)
 */
export async function sendNativeNotification(title: string, body: string, id: number = Date.now()) {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: id % 100000,
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'beep.wav',
            channelId: 'voltrix_alerts',
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (err) {
      console.warn('[Native] Error scheduling local notification:', err);
    }
  }
}
