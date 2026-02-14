import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface Props {
  setScreen: (screen: string) => void;
}

const UnitManagement: React.FC<Props> = ({ setScreen }) => {
  const [units, setUnits] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL'); // ALL, MOROSOS
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [residentHistory, setResidentHistory] = useState<any[]>([]);

  // 1. CARGAR RESIDENTES
  useEffect(() => {
    const fetchUnits = async () => {
      // Traemos usuarios que sean residentes
      const q = query(collection(db, 'users'), where('role', '==', 'RESIDENT'));
      const snap = await getDocs(q);
      
      // Simulamos cálculo de deuda (En real, esto vendría de sus recibos pendientes)
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        debt: Math.random() > 0.7 ? 45.00 : 0 // 30% de probabilidad de ser moroso para el demo
      }));
      setUnits(data);
    };
    fetchUnits();
  }, []);

  // 2. VER DETALLE RESIDENTE (CARGAR HISTORIAL)
  const handleOpenResident = async (resident: any) => {
    setSelectedResident(resident);
    // Buscar recibos de este usuario (Simulación: buscamos recibos donde unit coincida)
    // En producción usarías 'userId'
    const qHistory = query(collection(db, 'receipts'), where('unit', '==', resident.unit || ''), orderBy('createdAt', 'desc'));
    const snap = await getDocs(qHistory);
    setResidentHistory(snap.docs.map(d => d.data()));
  };

  const filteredUnits = units.filter(u => filter === 'ALL' ? true : u.debt > 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 pb-20">
      
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setScreen('dashboard')} className="p-2 rounded-full bg-slate-800"><span className="material-symbols-outlined">arrow_back</span></button>
        <div>
          <h1 className="text-xl font-black uppercase text-blue-400">Gestión de Unidades</h1>
          <p className="text-xs text-slate-400">{units.length} Apartamentos Registrados</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Todos</button>
        <button onClick={() => setFilter('MOROSOS')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filter === 'MOROSOS' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Solo Morosos</button>
      </div>

      {/* LISTA DE UNIDADES */}
      <div className="grid grid-cols-2 gap-3">
        {filteredUnits.map(u => (
            <button 
                key={u.id} 
                onClick={() => handleOpenResident(u)}
                className={`p-4 rounded-2xl border text-left transition-all active:scale-95 ${u.debt > 0 ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-800 border-slate-700 hover:border-blue-500'}`}
            >
                <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-lg">{u.unit}</span>
                    {u.debt > 0 && <span className="material-symbols-outlined text-red-500 text-sm">warning</span>}
                </div>
                <p className="text-xs font-bold text-slate-300 truncate">{u.name}</p>
                <p className={`text-[10px] font-black uppercase mt-2 ${u.debt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {u.debt > 0 ? `Debe $${u.debt}` : 'Solvente'}
                </p>
            </button>
        ))}
      </div>

      {/* MODAL DETALLE DEL RESIDENTE */}
      {selectedResident && (
        <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center sm:p-4 z-50 animate-in slide-in-from-bottom-10">
            <div className="bg-slate-900 w-full max-w-md h-[85vh] sm:h-auto sm:rounded-3xl rounded-t-3xl border border-slate-700 flex flex-col overflow-hidden">
                
                {/* Header Modal */}
                <div className="p-6 bg-slate-800 border-b border-slate-700 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-white">Apto {selectedResident.unit}</h2>
                        <p className="text-sm text-slate-400 font-bold">{selectedResident.name}</p>
                        <p className="text-xs text-slate-500">{selectedResident.email}</p>
                    </div>
                    <button onClick={() => setSelectedResident(null)} className="p-2 bg-slate-700 rounded-full"><span className="material-symbols-outlined">close</span></button>
                </div>

                {/* Body Modal */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    
                    {/* Estado de Cuenta */}
                    <div className={`p-4 rounded-2xl border ${selectedResident.debt > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                        <p className="text-xs font-bold uppercase mb-1 opacity-70">Deuda Actual</p>
                        <p className={`text-3xl font-black ${selectedResident.debt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            ${selectedResident.debt.toFixed(2)}
                        </p>
                    </div>

                    {/* Historial */}
                    <div>
                        <h3 className="text-sm font-bold uppercase text-slate-500 mb-3">Historial de Recibos</h3>
                        <div className="space-y-2">
                            {residentHistory.length > 0 ? residentHistory.map((h, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700">
                                    <div>
                                        <p className="text-sm font-bold text-white">{h.period}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(h.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">${h.totalAmount}</p>
                                        <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${h.status === 'PAGADO' ? 'bg-green-500 text-white' : 'bg-amber-500 text-black'}`}>
                                            {h.status}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-xs text-slate-600 py-4">No hay historial disponible.</p>
                            )}
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-blue-600 py-3 rounded-xl font-bold uppercase text-xs shadow-lg">Enviar Aviso Cobro</button>
                        <button className="bg-slate-700 py-3 rounded-xl font-bold uppercase text-xs">Editar Datos</button>
                    </div>

                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default UnitManagement;