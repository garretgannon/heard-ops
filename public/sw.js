const CACHE = 'heardos-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Handle push events (future server-side Web Push)
self.addEventListener('push', e => {
  let data = { title: 'heardOS', body: 'You have a new notification.' };
  try { data = e.data?.json() || data; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://media.base44.com/images/public/69f0c74de6e9ba52961af58a/b1b52980c_HeardOS_app_icon_pulse_58.png',
      badge: 'https://media.base44.com/images/public/69f0c74de6e9ba52961af58a/b1b52980c_HeardOS_app_icon_pulse_58.png',
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
