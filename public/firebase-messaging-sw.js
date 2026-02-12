/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// PEGA AQUÍ LA MISMA CONFIGURACIÓN QUE TIENES EN SRC/FIREBASE.TS
// (Pero sin "export const", solo el objeto plano)
const firebaseConfig = {
    apiKey: "AIzaSyCgqeJEq40NtwIUzEcClVw9LOiq66F-up8",
    authDomain: "serviciosph-panama.firebaseapp.com",
    projectId: "serviciosph-panama",
    storageBucket: "serviciosph-panama.firebasestorage.app",
    messagingSenderId: "96060125590",
    appId: "1:96060125590:web:ad58104f3c1929ca646db7"
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