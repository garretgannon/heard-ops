const CACHE = 'heardos-v1';
const APP_ICON = '/brand/heardos-app-icon-512.png';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Handle push events (future server-side Web Push)
self.addEventListener('push', e => {
  let data = { title: 'heardOS', body: 'You have a new notification.' };
  try { data = e.data?.json() || data; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: APP_ICON,
      badge: APP_ICON,
      tag: data.tag || 'heardos-alert',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const c of clients) {
        if (c.url.includes(self.location.origin)) {
          c.focus();
          c.postMessage({ type: 'NAVIGATE', url });
          return;
        }
      }
      self.clients.openWindow(self.location.origin + url);
    })
  );
});
