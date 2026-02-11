import React, { useState, useEffect } from 'react';
// IMPORTACIONES (Nombres corregidos para que coincidan con tus archivos reales)
import Login from './screens/Login';
import Register from './screens/Register';
import ResidentDashboard from './screens/ResidentDashboard';
import AdminDashboard from './screens/AdminDashboard';
import SecurityPanel from './screens/SecurityPanel';
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

// Si tienes firebase configurado:
// --- MODIFICACIÓN 1: AGREGAMOS LAS FUNCIONES DE NOTIFICACIÓN AL IMPORT ---
import { auth, db, requestNotificationPermission, onForegroundMessage } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Definición de Roles y Tipos
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
  apt?: string;
  photoURL?: string;
  phone?: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [screen, setScreen] = useState<string>('login');

  useEffect(() => {
    // Verificamos si auth existe para evitar crash si no hay firebase
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // --- MODIFICACIÓN 2: ACTIVAMOS NOTIFICACIONES AL DETECTAR USUARIO ---
        requestNotificationPermission(user.uid);
        onForegroundMessage();
        // -------------------------------------------------------------------

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
              apt: data.apt,
              phone: data.phone,
              photoURL: data.photoURL
            });
          }
          setIsAuthenticated(true);
          setScreen('dashboard');
        } catch (error) {
          console.error("Error cargando perfil:", error);
        }
      } else {
        if (!userProfile?.uid.startsWith('demo-')) {
          setIsAuthenticated(false);
          setUserProfile(null);
          setScreen('login');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      if (auth?.currentUser) await signOut(auth);
    } catch (e) {
      console.log("Salida local");
    } finally {
      setIsAuthenticated(false);
      setUserProfile(null);
      setScreen('login');
    }
  };

  const handleDemoLogin = (role: 'ADMIN' | 'RESIDENT' | 'SECURITY') => {
    const roleMapping = { 
      ADMIN: UserRole.ADMIN, 
      RESIDENT: UserRole.RESIDENT, 
      SECURITY: UserRole.SECURITY 
    };
    
    setUserProfile({
      uid: `demo-${role.toLowerCase()}`,
      name: role === 'ADMIN' ? 'Carlos Admin' : role === 'SECURITY' ? 'Oficial Martinez' : 'Vecino Juan',
      email: `${role.toLowerCase()}@demo.com`,
      role: roleMapping[role],
      unit: role === 'RESIDENT' ? 'Torre A' : undefined,
      apt: role === 'RESIDENT' ? '102' : undefined,
      photoURL: undefined
    });
    
    setIsAuthenticated(true);
    setScreen('dashboard');
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50">Cargando...</div>;

  const renderScreen = () => {
    if (!isAuthenticated) {
      if (screen === 'register') return <Register onNavigateToLogin={() => setScreen('login')} />;
      return <Login onNavigateToRegister={() => setScreen('register')} onDemoLogin={handleDemoLogin} />;
    }

    const role = userProfile?.role || UserRole.RESIDENT;

    switch (screen) {
      case 'dashboard':
        if (role === UserRole.ADMIN) return <AdminDashboard setScreen={setScreen} profile={userProfile} onLogout={handleLogout} />;
        if (role === UserRole.SECURITY) return <SecurityPanel setScreen={setScreen} onLogout={handleLogout} />;
        return <ResidentDashboard setScreen={setScreen} profile={userProfile} onLogout={handleLogout} />;

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col">
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