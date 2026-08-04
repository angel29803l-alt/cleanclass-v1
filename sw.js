const CACHE_NAME = 'cleanclass-v2';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });

// Notificación del sistema cuando app está cerrada
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(self.registration.showNotification(data.title || '🧹 ¡Hora del Aseo!', {
    body: data.body || 'Es hora de limpiar el salón',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'aseo',
    data
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/?goto=evidence'));
});

// Notificación programada localmente
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { time, title, body } = e.data;
    const now = new Date();
    const [h, m] = time.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target - now;

    setTimeout(() => {
      self.registration.showNotification(title || '🧹 ¡Hora del Aseo!', {
        body: body || 'Es hora de limpiar el salón',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'aseo'
      });
    }, delay);
  }
});
