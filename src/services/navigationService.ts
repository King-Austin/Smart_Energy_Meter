import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { triggerHaptic } from './nativeService';

export type BackActionHandler = () => boolean | Promise<boolean>;

let isBackListenerRegistered = false;
let lastBackPressTime = 0;
const EXIT_DEBOUNCE_MS = 2000;

// Registered back handlers in priority order (higher priority runs first)
const backHandlers: { id: string; priority: number; handler: BackActionHandler }[] = [];

/**
 * Register a back action handler.
 * Handler should return true if it consumed the back event, or false if it did not.
 * Priority: Higher number = executed earlier.
 */
export function registerBackHandler(id: string, priority: number, handler: BackActionHandler) {
  // Remove existing with same id if any
  const existingIdx = backHandlers.findIndex(h => h.id === id);
  if (existingIdx !== -1) {
    backHandlers.splice(existingIdx, 1);
  }

  backHandlers.push({ id, priority, handler });
  // Sort descending by priority
  backHandlers.sort((a, b) => b.priority - a.priority);

  return () => {
    unregisterBackHandler(id);
  };
}

export function unregisterBackHandler(id: string) {
  const idx = backHandlers.findIndex(h => h.id === id);
  if (idx !== -1) {
    backHandlers.splice(idx, 1);
  }
}

/**
 * Show a sleek native-like toast when the user is at the root screen
 */
export function showExitToast(message: string = 'Press back again to exit Voltrix') {
  // Remove existing toast if present
  const existing = document.getElementById('voltrix-exit-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'voltrix-exit-toast';
  toast.className =
    'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-neutral-900/90 dark:bg-neutral-800/90 text-white text-xs font-semibold shadow-xl border border-white/10 backdrop-blur-md pointer-events-none transition-all duration-300 opacity-0 translate-y-2';
  toast.textContent = message;

  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 8px)';
    setTimeout(() => toast.remove(), 300);
  }, 1900);
}

/**
 * Initialize Capacitor Hardware Back Button Listener
 */
export function initCapacitorBackNavigation() {
  if (isBackListenerRegistered) return;
  isBackListenerRegistered = true;

  if (Capacitor.isNativePlatform()) {
    CapApp.addListener('backButton', async ({ canGoBack }) => {
      console.log('[Native] Hardware back button pressed.');

      // 1. Check registered custom handlers (modals, drawers, subviews)
      for (const item of backHandlers) {
        try {
          const handled = await item.handler();
          if (handled) {
            console.log(`[Native] Back event consumed by handler: ${item.id}`);
            triggerHaptic('light');
            return;
          }
        } catch (err) {
          console.error(`[Native] Error in back handler ${item.id}:`, err);
        }
      }

      // 2. Fallback to WebView browser history if available
      if (canGoBack && window.history.length > 1) {
        console.log('[Native] Navigating back via browser history');
        triggerHaptic('light');
        window.history.back();
        return;
      }

      // 3. Double-tap to exit debounce
      const now = Date.now();
      if (now - lastBackPressTime < EXIT_DEBOUNCE_MS) {
        console.log('[Native] Double back detected. Exiting app.');
        triggerHaptic('warning');
        CapApp.exitApp();
      } else {
        lastBackPressTime = now;
        triggerHaptic('light');
        showExitToast('Press back again to exit Voltrix');
      }
    });

    console.log('[Native] Capacitor Hardware Back Button navigation initialized.');
  } else {
    // Web fallback for browser back button
    window.addEventListener('popstate', async () => {
      for (const item of backHandlers) {
        try {
          const handled = await item.handler();
          if (handled) {
            return;
          }
        } catch (err) {
          console.error(`[Web] Error in back handler ${item.id}:`, err);
        }
      }
    });
  }
}
