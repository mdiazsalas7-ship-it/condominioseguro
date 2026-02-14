import React, { useState, useEffect, useRef } from 'react';
// TUS PANTALLAS
import Login from './screens/Login';
import Register from './screens/Register';
import ResidentDashboard from './screens/ResidentDashboard';
import AdminDashboard from './screens/AdminDashboard';
import SecurityPanel from './screens/SecurityPanel';
import CaneyReservation from './screens/CaneyReservation'; 
import ReceiptHistoryAdmin from './screens/ReceiptHistoryAdmin'; // <--- NUEVO IMPORT
import UnitManagement from './screens/UnitManagement';
import CreateReceipt from './screens/CreateReceipt';
import RateHistory from './screens/RateHistory';
import MonthlyReport from './screens/MonthlyReport';
import ProfileEdit from './screens/ProfileEdit';
import Surveys from './screens/Surveys';
import Announcements from './screens/Announcements';
import ReceiptDetail from './screens/ReceiptDetail';
import Reportpayment from './screens/Reportpayment';
import AccessControl from './screens/AccessControl';
import FaultReport from './screens/FaultReport';
import Conciliation from './screens/Conciliation';

// FIREBASE
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

// ROLES
export enum UserRole {
  ADMIN = 'ADMIN',
  RESIDENT = 'RESIDENT',
  SECURITY = 'SECURITY'
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  unit?: string;
  photoURL?: string;
  phone?: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [screen, setScreen] = useState('login');
  
  // ESTADO PARA LA ALERTA VISUAL
  const [incomingVisit, setIncomingVisit] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. INICIAR SESIÓN Y CARGAR PERFIL
  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile({
              uid: user.uid,
              name: data.name,
              email: data.email,
              role: data.role as UserRole,
              unit: data.unit,
              phone: data.phone
            });
            setIsAuthenticated(true);
            setScreen('dashboard');
          }
        } catch (error) { console.error(error); }
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
        setScreen('login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. EL RADAR (ESCUCHA LA BASE DE DATOS)
  useEffect(() => {
    // Solo si soy residente escucho
    if (!userProfile || userProfile.role !== UserRole.RESIDENT) return;

    console.log("📡 Escuchando visitas para:", userProfile.name);

    // Consulta: Invitaciones creadas por mí que estén 'EN SITIO'
    const q = query(
      collection(db, 'access_invitations'), 
      where('author', '==', userProfile.uid),
      where('status', '==', 'EN SITIO')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // Si hay un cambio (Alguien entró)
        if (change.type === 'added' || change.type === 'modified') {
           const data = change.doc.data();
           
           // ACTIVAR ALARMA VISUAL
           setIncomingVisit(data);
           
           // INTENTAR REPRODUCIR SONIDO
           if (audioRef.current) {
             audioRef.current.play().catch(e => console.log("Click en pantalla para activar sonido"));
           }
           
           // INTENTAR VIBRAR
           if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
        }
      });
    });
    return () => unsubscribe();
  }, [userProfile]);

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    setUserProfile(null);
    setScreen('login');
  };

  // Renderizado de Pantallas
  const renderScreen = () => {
    if (!isAuthenticated) {
      if (screen === 'register') return <Register onNavigateToLogin={() => setScreen('login')} />;
      return <Login onNavigateToRegister={() => setScreen('register')} />;
    }
    const role = userProfile?.role || UserRole.RESIDENT;

    switch (screen) {
      case 'dashboard':
        if (role === UserRole.ADMIN) return <AdminDashboard setScreen={setScreen} profile={userProfile} onLogout={handleLogout} />;
        if (role === UserRole.SECURITY) return <SecurityPanel setScreen={setScreen} onLogout={handleLogout} />;
        return <ResidentDashboard setScreen={setScreen} profile={userProfile} onLogout={handleLogout} />;
      
      // NUEVA PANTALLA DE RESERVA
      case 'caney-reservation': 
        return <CaneyReservation setScreen={setScreen} userProfile={userProfile} />;

      // NUEVA PANTALLA DE HISTORIAL (ADMIN)
      case 'receipt-history-admin': 
        return <ReceiptHistoryAdmin setScreen={setScreen} />;

      case 'profile-edit': return <ProfileEdit setScreen={setScreen} profile={userProfile} onLogout={handleLogout} />;
      case 'announcements': return <Announcements setScreen={setScreen} role={role} />;
      case 'rate-history': return <RateHistory setScreen={setScreen} />;
      case 'surveys': return <Surveys setScreen={setScreen} role={role} />;
      case 'receipt-detail': return <ReceiptDetail setScreen={setScreen} />;
      case 'report-payment': return <Reportpayment setScreen={setScreen} />;
      case 'access-control': return <AccessControl setScreen={setScreen} />;
      case 'fault-report': return <FaultReport setScreen={setScreen} />;
      case 'unit-management': return <UnitManagement setScreen={setScreen} />;
      case 'create-receipt': return <CreateReceipt setScreen={setScreen} />;
      case 'financial-report': return <MonthlyReport setScreen={setScreen} />;
      case 'conciliation': return <Conciliation setScreen={setScreen} />;
      default: return <ResidentDashboard setScreen={setScreen} profile={userProfile} onLogout={handleLogout} />;
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 max-w-md mx-auto relative shadow-2xl flex flex-col overflow-hidden">
      
      {/* SONIDO DE ALARMA (OCULTO) */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* --- PANTALLAZO DE ALERTA (MODAL) --- */}
      {incomingVisit && (
        <div className="fixed inset-0 z-[9999] bg-red-600/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-pulse">
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center">
            <div className="size-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-5xl text-red-600">notifications_active</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">¡VISITA EN PUERTA!</h1>
            <div className="bg-slate-100 p-4 rounded-xl mb-6">
              <p className="text-lg font-bold text-slate-800">{incomingVisit.name}</p>
              <p className="text-sm text-slate-500 uppercase font-bold">{incomingVisit.type}</p>
            </div>
            <button 
              onClick={() => {
                setIncomingVisit(null); // Cerrar alerta
                if (audioRef.current) {
                  audioRef.current.pause(); // Parar sonido
                  audioRef.current.currentTime = 0;
                }
              }}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-lg shadow-lg active:scale-95"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {renderScreen()}
      </div>

      {isAuthenticated && userProfile?.role !== UserRole.SECURITY && (
        <nav className="sticky bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-2 pt-2">
           <div className="flex justify-around items-center h-12">
            <button onClick={() => setScreen('dashboard')} className={`flex flex-col items-center flex-1 ${screen === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className="material-symbols-outlined text-2xl">grid_view</span>
              <span className="text-[9px] font-bold uppercase mt-1">Inicio</span>
            </button>
            <button onClick={() => setScreen('announcements')} className={`flex flex-col items-center flex-1 ${screen === 'announcements' ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className="material-symbols-outlined text-2xl">campaign</span>
              <span className="text-[9px] font-bold uppercase mt-1">Avisos</span>
            </button>
            <button onClick={() => setScreen('profile-edit')} className={`flex flex-col items-center flex-1 ${screen === 'profile-edit' ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className="material-symbols-outlined text-2xl">person</span>
              <span className="text-[9px] font-bold uppercase mt-1">Perfil</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;