// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// --- ⚠️ COPIA AQUÍ TUS MISMAS CREDENCIALES DE src/firebase.ts ---
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

// ESTO ES LO QUE FUNCIONA CUANDO LA APP ESTÁ CERRADA
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Notificación en segundo plano recibida:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png', // Asegúrate que el icono esté en public
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});