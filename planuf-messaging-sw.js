/* Planuf v48 messaging service worker.
   Handles Firebase Cloud Messaging background notifications once a Web Push VAPID key
   and Firebase Functions notification trigger are deployed. */
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD2BphkPc8Ho_7QPmOxtnRWVcMSfqLJf7o',
  authDomain: 'planufproductions-d1484.firebaseapp.com',
  projectId: 'planufproductions-d1484',
  storageBucket: 'planufproductions-d1484.firebasestorage.app',
  messagingSenderId: '1064640847372',
  appId: '1:1064640847372:web:291b833757f82b7f9e5829',
  measurementId: 'G-CV076XFFKE'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload && payload.data ? payload.data : {};
  const notification = payload && payload.notification ? payload.notification : {};
  const title = notification.title || data.title || 'New Planuf message';
  const options = {
    body: notification.body || data.body || 'You have received a new message.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: data.threadId ? 'planuf-message-' + data.threadId : 'planuf-message',
    data: {
      url: data.threadId ? './#/messages/' + encodeURIComponent(data.threadId) : './#/messages',
      threadId: data.threadId || ''
    }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification && event.notification.data && event.notification.data.url ? event.notification.data.url : './#/messages';
  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      if ('focus' in client) {
        client.navigate(targetUrl);
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
  })());
});
