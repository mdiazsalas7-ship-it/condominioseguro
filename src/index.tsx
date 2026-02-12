import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- 🔔 REGISTRO DEL SERVICE WORKER (Para notificaciones en 2do plano) ---
if ('serviceWorker' in navigator) {
  // Esperamos a que la página cargue completamente para no bloquear el inicio
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado con éxito:', registration.scope);
      })
      .catch((err) => {
        console.log('❌ Fallo al registrar Service Worker:', err);
      });
  });
}
// -----------------------------------------------------------------------

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);