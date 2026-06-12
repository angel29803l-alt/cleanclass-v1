importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA-rPAwb5Fv_Dl8rc6zum3UKFNj-x2KxCI",
  authDomain: "cleanclass-3577e.firebaseapp.com",
  projectId: "cleanclass-3577e",
  storageBucket: "cleanclass-3577e.firebasestorage.app",
  messagingSenderId: "922075322537",
  appId: "1:922075322537:web:d1717fdfe06899497471b8"
});

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || '🧹 CleanClass', {
    body: body || '¡Es hora del aseo!',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data
  });
});

// Al hacer clic en la notificación
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/?goto=evidence'));
});
