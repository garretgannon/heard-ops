import { useState, useEffect, useCallback } from 'react';
import { BRAND_ASSETS } from '@/lib/brandAssets';

const STORAGE_KEY = 'heardos-notif-prefs';

const DEFAULT_PREFS = {
  enabled: false,
  approvals: true,
  criticalAlerts: true,
  handoffs: true,
  overdueItems: true,
};

export function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [prefs, setPrefsState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const isSupported = typeof Notification !== 'undefined' && 'serviceWorker' in navigator;

  const savePrefs = useCallback((updated) => {
    const next = { ...prefs, ...updated };
    setPrefsState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [prefs]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') savePrefs({ enabled: true });
    return result;
  }, [isSupported, savePrefs]);

  const notify = useCallback((title, body, options = {}) => {
    if (!prefs.enabled || permission !== 'granted') return;
    const { tag, url = '/', category } = options;
    if (category && prefs[category] === false) return;

    const notif = new Notification(title, {
      body,
      icon: BRAND_ASSETS.appIcon,
      tag: tag || 'heardos',
      silent: false,
    });
    notif.onclick = () => {
      window.focus();
      if (url !== '/') window.history.pushState({}, '', url);
      notif.close();
    };
  }, [prefs, permission]);

  // Register service worker
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});

    // Listen for SW navigation messages
    const handler = e => {
      if (e.data?.type === 'NAVIGATE' && e.data.url) {
        window.history.pushState({}, '', e.data.url);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [isSupported]);

  return { permission, isSupported, prefs, savePrefs, requestPermission, notify };
}
