import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface Props {
  setScreen: (s: string) => void;
}

const AccessControl: React.FC<Props> = ({ setScreen }) => {
  const [type, setType] = useState<'Visitante' | 'Delivery'>('Visitante');
  
  // Formulario
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [deliveryCompany, setDeliveryCompany] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [invitationId, setInvitationId] = useState<string | null>(null);

  const handleCreate = async () => {
    // 1. Validaciones
    if (!auth.currentUser) {
      alert("Error de sesión. Por favor inicia sesión nuevamente.");
      return;
    }

    if (!name.trim() || !idNumber.trim()) {
      alert("⚠️ Por favor completa Nombre y Cédula del visitante.");
      return;
    }
    
    if (type === 'Delivery' && !deliveryCompany.trim()) {
      alert("⚠️ Debes indicar la empresa de Delivery (Ej. Yummy, PedidosYa).");
      return;
    }

    setLoading(true);
    try {
      // 2. Guardar en Firebase
      const docRef = await addDoc(collection(db, 'access_invitations'), {
        type,
        name: name.trim(),
        idNumber: idNumber.trim(),
        vehiclePlate: plate.trim().toUpperCase() || 'N/A',
        vehicleModel: model.trim() || 'N/A',
        deliveryCompany: type === 'Delivery' ? deliveryCompany.trim() : null,
        
        // Datos de Control
        unit: 'Mi Apartamento', // TODO: En el futuro traer esto del perfil del usuario (userProfile.unit)
        status: 'PENDIENTE',
        author: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        
        // Inicializamos tiempos en null
        entryTime: null,
        exitTime: null
      });

      // 3. Mostrar QR
      setInvitationId(docRef.id);

    } catch (error) {
      console.error("Error creando invitación:", error);
      alert("Hubo un problema de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!invitationId) return;
    
    // Link directo a una API de QR para que sea fácil de abrir
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${invitationId}`;
    
    // Mensaje formateado para WhatsApp
    let text = `👋 Hola *${name}*,\n\nTe envío tu acceso autorizado a *Condominio Seguro*.\n\n`;
    text += `🔹 *Tipo:* ${type}\n`;
    if (type === 'Delivery') text += `🛵 *Empresa:* ${deliveryCompany}\n`;
    text += `🆔 *Cédula:* ${idNumber}\n\n`;
    text += `*Presenta este código QR en la garita:* 👇\n${qrUrl}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const resetForm = () => {
    setName(''); 
    setIdNumber(''); 
    setPlate(''); 
    setModel(''); 
    setDeliveryCompany('');
    setInvitationId(null);
    setType('Visitante');
  };

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-50 dark:bg-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => setScreen('dashboard')} className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white hover:bg-slate-200 transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">Nueva Invitación</h2>
          <p className="text-[10px] uppercase font-bold text-blue-600 tracking-widest">Control de Acceso</p>
        </div>
        <div className="size-10"></div>
      </header>

      <main className="p-4 space-y-6">
        
        {invitationId ? (
          /* --- VISTA DE ÉXITO (QR GENERADO) --- */
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center animate-in zoom-in duration-300">
            <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">verified</span>
              Pase Generado
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${invitationId}`} 
                alt="QR Acceso" 
                className="size-48 mix-blend-multiply"
              />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-1">{name}</h3>
            <p className="text-slate-400 text-sm font-bold mb-2">CI: {idNumber}</p>
            
            {type === 'Delivery' && (
              <span className="bg-orange-100 text-orange-600 text-[10px] font-black uppercase px-2 py-1 rounded mb-4">
                Delivery: {deliveryCompany}
              </span>
            )}

            <button onClick={handleShareWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1da851] text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 mt-4 transition-all active:scale-95">
              <span className="material-symbols-outlined text-lg">share</span>
              Enviar por WhatsApp
            </button>

            <button onClick={resetForm} className="mt-4 text-slate-400 text-xs font-bold uppercase hover:text-blue-600 transition-colors">
              Crear otro pase
            </button>
          </div>
        ) : (
          /* --- FORMULARIO DE REGISTRO --- */
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 animate-in slide-in-from-bottom-4">
            
            {/* Selector de Tipo */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <button onClick={() => setType('Visitante')} className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${type === 'Visitante' ? 'bg-white dark:bg-slate-800 shadow text-blue-600' : 'text-slate-400'}`}>Visitante</button>
              <button onClick={() => setType('Delivery')} className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${type === 'Delivery' ? 'bg-white dark:bg-slate-800 shadow text-orange-500' : 'text-slate-400'}`}>Delivery</button>
            </div>

            <div className="space-y-4">
              {type === 'Delivery' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-1">Empresa</label>
                  <input value={deliveryCompany} onChange={e => setDeliveryCompany(e.target.value)} className="w-full bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30 rounded-xl h-12 px-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-orange-300" placeholder="Ej. Yummy, PedidosYa" />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre Completo</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 dark:text-white" placeholder={type === 'Delivery' ? "Nombre del Motorizado" : "Nombre del Visitante"} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cédula de Identidad</label>
                <input type="number" value={idNumber} onChange={e => setIdNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 dark:text-white" placeholder="Solo números" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Placa (Opcional)</label>
                  <input value={plate} onChange={e => setPlate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold text-center uppercase text-slate-900 dark:text-white" placeholder="ABC-123" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Modelo/Color</label>
                  <input value={model} onChange={e => setModel(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold text-center text-slate-900 dark:text-white" placeholder="Aveo Azul" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleCreate}
              disabled={loading}
              className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 ${type === 'Delivery' ? 'bg-orange-500 shadow-orange-500/20 hover:bg-orange-600' : 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700'}`}
            >
              {loading ? (
                <span className="animate-pulse">Generando...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined">qr_code_2</span>
                  Generar Pase {type}
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AccessControl;