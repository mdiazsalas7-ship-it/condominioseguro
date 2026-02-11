/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// PEGA AQUÍ LA MISMA CONFIGURACIÓN QUE TIENES EN SRC/FIREBASE.TS
// (Pero sin "export const", solo el objeto plano)
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Esto maneja las notificaciones cuando la app está CERRADA
messaging.onBackgroundMessage((payload) => {
  console.log('Notificación en segundo plano:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // Icono que saldrá en la barra de notificaciones
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});