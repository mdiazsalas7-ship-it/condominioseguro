import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCgqeJEq40NtwIUzEcClVw9LOiq66F-up8",
  authDomain: "serviciosph-panama.firebaseapp.com",
  projectId: "serviciosph-panama",
  storageBucket: "serviciosph-panama.firebasestorage.app",
  messagingSenderId: "96060125590",
  appId: "1:96060125590:web:ad58104f3c1929ca646db7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

// --- FUNCIÓN PARA PEDIR PERMISO Y GUARDAR TOKEN ---
export const requestNotificationPermission = async (uid: string) => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // AQUÍ ESTÁ TU LLAVE VAPID YA PUESTA 👇
      const token = await getToken(messaging, {
        vapidKey: "BMpNWsSgUTL6FWN_LkQtVN8Nr7u_c27ZGJBGZVwdIBOGDk88Y39dVh1B_Scccehsi_N7g9I-zdS71yWIef4kByk"
      });

      if (token) {
        console.log("Token de notificación obtenido:", token);
        // Guardamos el token en la base de datos del usuario
        await updateDoc(doc(db, "users", uid), {
          fcmToken: token
        });
      }
    } else {
      console.log("Permiso de notificaciones denegado.");
    }
  } catch (error) {
    console.error("Error al configurar notificaciones:", error);
  }
};

// --- ESCUCHAR MENSAJES CON LA APP ABIERTA ---
export const onForegroundMessage = () => {
  return onMessage(messaging, (payload) => {
    // Cuando llega un mensaje y estás viendo la app
    console.log("Mensaje recibido en primer plano:", payload);
    alert(`🔔 ${payload.notification?.title}: ${payload.notification?.body}`);
  });
};