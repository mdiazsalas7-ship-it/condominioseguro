import React, { useState, useEffect } from 'react';
import { AccessInvitation } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface Props {
  setScreen: (s: string) => void;
  onLogout?: () => void;
}

const SecurityPanel: React.FC<Props> = ({ setScreen, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'control' | 'morosidad'>('control');
  const [invitations, setInvitations] = useState<AccessInvitation[]>([]);
  const [scannedVisitor, setScannedVisitor] = useState<AccessInvitation | null>(null);
  
  // Estado para búsqueda manual
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualSearchCedula, setManualSearchCedula] = useState('');

  // 1. Escuchar invitaciones activas (PENDIENTE o EN SITIO) de Firebase
  useEffect(() => {
    const q = query(
      collection(db, 'access_invitations'),
      where('status', 'in', ['PENDIENTE', 'EN SITIO'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccessInvitation[];
      
      // Ordenar: Primero los que están EN SITIO, luego los PENDIENTES
      docs.sort((a, b) => (a.status === 'EN SITIO' ? -1 : 1));
      
      setInvitations(docs);
    });

    return () => unsubscribe();
  }, []);

  // 2. Simular Escaneo de QR (El QR contiene el ID del documento)
  const handleScan = () => {
    const qrCodeContent = prompt("SIMULADOR CÁMARA:\nIntroduce el código del QR (ID de la invitación):");
    if (!qrCodeContent) return;

    const found = invitations.find(inv => inv.id === qrCodeContent);
    if (found) {
      setScannedVisitor(found);
    } else {
      alert("❌ Invitación no encontrada o expirada.");
    }
  };

  // 3. Buscar manualmente por Cédula
  const handleManualSearch = () => {
    const found = invitations.find(inv => inv.idNumber.includes(manualSearchCedula));
    if (found) {
      setScannedVisitor(found);
      setIsManualEntry(false);
      setManualSearchCedula('');
    } else {
      alert("❌ No se encontró ninguna invitación activa para esa cédula.");
    }
  };

  // 4. Procesar Entrada o Salida en Firebase
  const processAccess = async (visitor: AccessInvitation, action: 'ENTRAR' | 'SALIR') => {
    if (!confirm(`¿Confirmar ${action} de ${visitor.name}?`)) return;

    try {
      const docRef = doc(db, 'access_invitations', visitor.id);
      
      if (action === 'ENTRAR') {
        await updateDoc(docRef, {
          status: 'EN SITIO',
          entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else {
        await updateDoc(docRef, {
          status: 'SALIDA', // Esto hará que desaparezca de la lista por el filtro del query
          exitTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
      setScannedVisitor(null);
    } catch (error) {
      console.error("Error actualizando acceso:", error);
      alert("Error de conexión");
    }
  };

  // Datos mock para morosidad (esto se conectaría a otra colección luego)
  const morosos = [
    { unit: '102-A', resident: 'Pedro Gomez', debt: '$150.00', status: 'Restringido' },
    { unit: '304-B', resident: 'Ana Rivas', debt: '$45.00', status: 'Pendiente' },
    { unit: '501-A', resident: 'Jose Ferrer', debt: '$320.00', status: 'Crítico' },
  ];

  return (
    <div className="flex flex-col min-h-full pb-24 bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined">security</span>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter uppercase leading-none">Garita de Control</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Seguridad Condominio</p>
            </div>
          </div>
          <button onClick={onLogout} className="size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-red-500/20 transition-colors">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl">
          <button onClick={() => setActiveTab('control')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'control' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/60'}`}>Accesos</button>
          <button onClick={() => setActiveTab('morosidad')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'morosidad' ? 'bg-red-600 text-white shadow-lg' : 'text-white/60'}`}>Morosidad</button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {activeTab === 'control' ? (
          <>
            {/* ESCÁNER O BÚSQUEDA */}
            <section className="space-y-4">
              {!scannedVisitor && !isManualEntry ? (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleScan} className="flex flex-col items-center justify-center aspect-square bg-slate-900 rounded-3xl border-2 border-slate-800 shadow-xl group active:scale-95 transition-all hover:border-blue-500">
                    <span className="material-symbols-outlined text-4xl mb-2 text-white group-hover:text-blue-400">qr_code_scanner</span>
                    <p className="text-[10px] text-white font-black uppercase tracking-widest">Escanear QR</p>
                  </button>
                  <button onClick={() => setIsManualEntry(true)} className="flex flex-col items-center justify-center aspect-square bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm group active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-slate-400 text-4xl mb-2 group-hover:text-blue-600 transition-colors">search</span>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Buscar Cédula</p>
                  </button>
                </div>
              ) : isManualEntry ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-blue-600 shadow-2xl space-y-4 animate-in zoom-in-95">
                  <h3 className="text-sm font-black uppercase tracking-widest text-blue-600">Búsqueda Manual</h3>
                  <div className="space-y-3">
                    <input 
                      value={manualSearchCedula} 
                      onChange={e => setManualSearchCedula(e.target.value)} 
                      placeholder="Ingrese Cédula..." 
                      type="number"
                      className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold" 
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setIsManualEntry(false)} className="flex-1 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl font-bold text-xs uppercase text-slate-500">Cancelar</button>
                    <button onClick={handleManualSearch} className="flex-[2] h-12 bg-blue-600 text-white rounded-xl font-black text-xs uppercase">Buscar</button>
                  </div>
                </div>
              ) : (
                /* MODAL DE VISITANTE ESCANEADO */
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-emerald-500 shadow-2xl space-y-4 animate-in slide-in-from-bottom-5">
                   <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-3xl ${scannedVisitor.status === 'EN SITIO' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {scannedVisitor.status === 'EN SITIO' ? 'logout' : 'verified'}
                      </span>
                      <div>
                        <h2 className="text-lg font-black leading-none text-slate-900 dark:text-white">{scannedVisitor.name}</h2>
                        
                        {/* AQUI MOSTRAMOS EL TIPO Y LA EMPRESA SI APLICA */}
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{scannedVisitor.type}</span>
                          {scannedVisitor.type === 'Delivery' && scannedVisitor.deliveryCompany && (
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-100 px-1 rounded">{scannedVisitor.deliveryCompany}</span>
                          )}
                        </div>
                      </div>
                   </div>
                   
                   <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-2">
                      <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="text-xs text-slate-400 font-bold">Estado Actual</span>
                        <span className={`text-xs font-black px-2 rounded ${scannedVisitor.status === 'EN SITIO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{scannedVisitor.status}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300"><span className="text-slate-400 w-16 inline-block">Destino:</span> {scannedVisitor.unit}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300"><span className="text-slate-400 w-16 inline-block">Cédula:</span> {scannedVisitor.idNumber}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300"><span className="text-slate-400 w-16 inline-block">Placa:</span> {scannedVisitor.vehiclePlate}</p>
                   </div>

                   <div className="flex gap-2">
                      <button onClick={() => setScannedVisitor(null)} className="flex-1 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-xs uppercase text-slate-500 dark:text-slate-300">Cerrar</button>
                      
                      {scannedVisitor.status === 'PENDIENTE' ? (
                        <button onClick={() => processAccess(scannedVisitor, 'ENTRAR')} className="flex-[2] h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-emerald-500/20">
                          Autorizar Entrada
                        </button>
                      ) : (
                        <button onClick={() => processAccess(scannedVisitor, 'SALIR')} className="flex-[2] h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase shadow-lg">
                          Registrar Salida
                        </button>
                      )}
                   </div>
                </div>
              )}
            </section>

            {/* LISTA EN TIEMPO REAL */}
            <section className="space-y-4">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Actividad Reciente</h2>
              
              {invitations.length === 0 && (
                <div className="text-center py-10 opacity-50">
                  <span className="material-symbols-outlined text-4xl text-slate-300">history_toggle_off</span>
                  <p className="text-xs font-bold text-slate-400 mt-2">Sin actividad pendiente</p>
                </div>
              )}

              <div className="space-y-2">
                {invitations.map((visitor) => (
                  <div key={visitor.id} className={`p-4 rounded-2xl border flex justify-between items-center shadow-sm transition-all ${
                    visitor.status === 'EN SITIO' 
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-xl flex items-center justify-center text-white ${
                        visitor.type === 'Delivery' ? 'bg-orange-400' : 'bg-blue-400'
                      }`}>
                        <span className="material-symbols-outlined text-lg">
                          {visitor.type === 'Delivery' ? 'two_wheeler' : 'person'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{visitor.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{visitor.unit}</p>
                          
                          {/* AQUI TAMBIEN MOSTRAMOS LA EMPRESA */}
                          {visitor.type === 'Delivery' && visitor.deliveryCompany && (
                            <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-1 rounded uppercase">{visitor.deliveryCompany}</span>
                          )}
                          
                          {visitor.status === 'EN SITIO' && <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>}
                        </div>
                      </div>
                    </div>
                    
                    {visitor.status === 'EN SITIO' ? (
                      <button onClick={() => processAccess(visitor, 'SALIR')} className="bg-slate-900 dark:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                        Salida
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-500 uppercase bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">Pendiente</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* TAB DE MOROSIDAD (MOCK) */
          <section className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-5 rounded-[28px] flex items-center gap-4">
               <span className="material-symbols-outlined text-red-500 text-4xl">warning</span>
               <div>
                 <h3 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Atención Vigilante</h3>
                 <p className="text-[10px] font-bold text-red-400 dark:text-red-300 leading-relaxed mt-1">Verificar unidades en lista antes de permitir accesos.</p>
               </div>
            </div>

            <div className="space-y-3">
              {morosos.map((m, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-red-500 border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                   <div>
                      <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{m.unit}</p>
                      <p className="text-xs font-bold text-slate-500">{m.resident}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-red-500">{m.debt}</p>
                      <p className="text-[9px] font-black uppercase text-red-300 mt-1">{m.status}</p>
                   </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default SecurityPanel;