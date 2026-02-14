import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

interface Props {
  setScreen: (s: string) => void;
  profile: UserProfile | null;
  onLogout?: () => void;
}

// --- COMPONENTE DE TASA (ROBOT AUTOMÁTICO EURO BCV) ---
const RateConfiguration = () => {
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Sincronizando...');

  // 1. ESCUCHA ACTIVA (Muestra el dato de Firebase en tiempo real)
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "global"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.exchangeRate) {
                setCurrentRate(data.exchangeRate);
                setLastUpdate(data.updatedAt);
                setStatusText('Sincronizado');
            }
        }
    });
    return () => unsubscribe();
  }, []);

  // 2. EL ROBOT (Consulta API y actualiza Firebase)
  useEffect(() => {
    const fetchEuroRate = async () => {
        setLoading(true);
        console.log("🤖 Robot: Buscando Tasa Euro BCV...");
        
        try {
            // A. Consumir API (Endpoint de EURO filtrado por BCV)
            const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/euro?page=bcv');
            
            if (response.ok) {
                const data = await response.json();
                
                // B. Extraer Tasa
                // Cuando pides page=bcv, la API devuelve el monitor bajo la clave "bcv"
                const euroPrice = data.monitors?.bcv?.price;

                // C. Validar
                if (typeof euroPrice === 'number' && euroPrice > 0) {
                    console.log("✅ Tasa encontrada:", euroPrice);
                    
                    // D. Guardar en Firebase (settings/global)
                    await setDoc(doc(db, "settings", "global"), { 
                        exchangeRate: euroPrice,
                        updatedAt: serverTimestamp(),
                        updatedBy: 'Admin Robot'
                    }, { merge: true });
                    
                } else {
                    console.warn("⚠️ API respondió, pero no se encontró el precio (monitors.bcv.price).");
                    setStatusText("Error API (Formato)");
                }
            } else {
                console.error("❌ Error HTTP:", response.status);
                setStatusText(`Error HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error("❌ Error de conexión:", error);
            setStatusText("Sin Conexión");
        } finally {
            setLoading(false);
        }
    };

    fetchEuroRate();
  }, []); // Se ejecuta una sola vez al montar el componente

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className={`size-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center ${loading ? 'animate-pulse' : ''}`}>
             <span className="material-symbols-outlined">currency_exchange</span>
           </div>
           <div>
             <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs">Tasa Euro BCV (Auto)</h3>
             <div className="flex items-center gap-2">
                <p className="text-2xl font-black text-indigo-600">
                    {currentRate ? `Bs. ${currentRate}` : <span className="text-xs text-slate-400">{statusText}</span>}
                </p>
                {loading && <span className="material-symbols-outlined text-xs animate-spin text-slate-400">sync</span>}
             </div>
             {lastUpdate && <p className="text-[10px] text-slate-400 font-bold">Act: {new Date(lastUpdate.seconds * 1000).toLocaleTimeString()}</p>}
           </div>
        </div>
        
        <div className="text-right">
             <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${currentRate ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500'}`}>
                {currentRate ? 'En Línea' : 'Buscando...'}
             </span>
        </div>
      </div>
    </div>
  );
};

// --- PANTALLA PRINCIPAL ADMIN ---
const AdminDashboard: React.FC<Props> = ({ setScreen, profile, onLogout }) => {
  return (
    <div className="flex flex-col min-h-full pb-24">
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex flex-col">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Administrador</p>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Panel Condominio</h1>
        </div>
        <button onClick={() => setScreen('profile-edit')} className="size-11 rounded-full border-2 border-primary overflow-hidden">
          {profile?.photoURL ? <img src={profile.photoURL} alt="Admin" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined p-2">person</span>}
        </button>
      </header>

      <main className="p-6 space-y-6">
        
        {/* ROBOT DE TASA INTEGRADO */}
        <RateConfiguration />

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setScreen('financial-report')} className="flex flex-col gap-4 rounded-3xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-800 transition-all active:scale-95 shadow-sm">
            <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">analytics</span>
            </div>
            <h2 className="text-sm font-black uppercase">Reporte Mes</h2>
          </button>

          <button onClick={() => setScreen('unit-management')} className="flex flex-col gap-4 rounded-3xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-800 transition-all active:scale-95 shadow-sm">
            <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">home_work</span>
            </div>
            <h2 className="text-sm font-black uppercase">Unidades</h2>
          </button>
        </div>

        {/* Resumen Cartera */}
        <div onClick={() => setScreen('unit-management')} className="cursor-pointer bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Resumen de Cartera</p>
            <p className="text-3xl font-black mt-1">$4,250.32</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">8 Unidades Morosas</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl opacity-5">account_balance</span>
        </div>

        <div className="space-y-4">
          <button onClick={() => setScreen('create-receipt')} className="w-full flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all active:scale-95">
             <div className="flex items-center gap-4">
                <div className="size-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">add_notes</span>
                </div>
                <span className="text-sm font-black uppercase">Armar Nuevo Recibo</span>
             </div>
             <span className="material-symbols-outlined text-slate-300">chevron_right</span>
          </button>

          <button onClick={() => setScreen('receipt-history-admin')} className="w-full flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all active:scale-95">
             <div className="flex items-center gap-4">
                <div className="size-10 bg-cyan-500/10 text-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">history_edu</span>
                </div>
                <span className="text-sm font-black uppercase">Historial Recibos</span>
             </div>
             <span className="material-symbols-outlined text-slate-300">chevron_right</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;