import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface Props {
  setScreen: (s: string) => void;
}

const AccessControl: React.FC<Props> = ({ setScreen }) => {
  const [type, setType] = useState<'Visitante' | 'Delivery'>('Visitante');
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [deliveryCompany, setDeliveryCompany] = useState(''); // <--- NUEVO ESTADO
  
  const [loading, setLoading] = useState(false);
  const [invitationId, setInvitationId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name || !idNumber) {
      alert("Por favor completa Nombre y Cédula");
      return;
    }
    
    // Validación extra para delivery
    if (type === 'Delivery' && !deliveryCompany) {
      alert("Por favor indica la empresa de delivery");
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'access_invitations'), {
        type,
        name,
        idNumber,
        vehiclePlate: plate || 'N/A',
        vehicleModel: model || 'N/A',
        deliveryCompany: type === 'Delivery' ? deliveryCompany : null, // <--- GUARDAMOS LA EMPRESA
        unit: 'Mi Apartamento',
        status: 'PENDIENTE',
        author: auth.currentUser?.uid || 'anon',
        createdAt: new Date().toISOString(),
      });

      setInvitationId(docRef.id);

    } catch (error) {
      console.error("Error creando invitación:", error);
      alert("Hubo un error creando el pase.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!invitationId) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${invitationId}`;
    
    // Mensaje personalizado si es Delivery
    let text = `Hola *${name}*, acceso autorizado a *Condominio Seguro*.\n\nTipo: ${type}`;
    if (type === 'Delivery') text += `\nEmpresa: *${deliveryCompany}*`;
    text += `\nCédula: ${idNumber}\n\n*Muestra este QR en vigilancia:*\n${qrUrl}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const resetForm = () => {
    setName(''); setIdNumber(''); setPlate(''); setModel(''); setDeliveryCompany('');
    setInvitationId(null);
  };

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => setScreen('dashboard')} className="text-blue-600 dark:text-blue-400 flex size-10 items-center justify-center rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Generar Invitación</h2>
          <p className="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold">Condominio Seguro</p>
        </div>
        <div className="size-10"></div>
      </header>

      <main className="p-4 space-y-6">
        <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          
          {invitationId ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Pase Generado
              </div>

              <div className="w-56 aspect-square bg-white p-3 rounded-2xl border-4 border-slate-100 dark:border-slate-700 mb-6 shadow-xl">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${invitationId}`} 
                  alt="QR Acceso" 
                  className="w-full h-full mix-blend-multiply dark:mix-blend-normal"
                />
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{name}</h3>
              <p className="text-slate-400 text-sm font-medium mb-1">CI: {idNumber}</p>
              {type === 'Delivery' && (
                <p className="text-xs font-black uppercase bg-orange-100 text-orange-600 px-2 py-1 rounded-lg">Delivery: {deliveryCompany}</p>
              )}

              <button 
                onClick={handleShareWhatsApp}
                className="w-full flex items-center justify-center gap-2 h-14 bg-[#25D366] hover:bg-[#1da851] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-green-500/20 active:scale-95 transition-all mb-3 mt-4"
              >
                <span className="material-symbols-outlined">share</span>
                Enviar por WhatsApp
              </button>

              <button onClick={resetForm} className="text-slate-400 text-xs font-bold uppercase hover:text-slate-600 dark:hover:text-slate-200 p-2">
                Generar Nuevo Pase
              </button>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1">
                <button 
                  onClick={() => setType('Visitante')}
                  className={`flex-1 h-full rounded-lg text-xs font-black uppercase transition-all ${type === 'Visitante' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-400'}`}
                >Visitante</button>
                <button 
                  onClick={() => setType('Delivery')}
                  className={`flex-1 h-full rounded-lg text-xs font-black uppercase transition-all ${type === 'Delivery' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-400'}`}
                >Delivery</button>
              </div>

              <div className="space-y-4">
                {/* CAMPO DE EMPRESA SOLO SI ES DELIVERY */}
                {type === 'Delivery' && (
                  <div className="space-y-1 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-1">Empresa de Delivery</label>
                    <input value={deliveryCompany} onChange={e => setDeliveryCompany(e.target.value)} className="w-full bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30 rounded-xl h-12 px-4 text-sm font-bold text-slate-900 dark:text-white" placeholder="Ej. Yummy, PedidosYa, Particular" />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre {type === 'Delivery' ? 'del Motorizado' : 'del Invitado'}</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" placeholder="Nombre Completo" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Documento de Identidad</label>
                  <input type="number" value={idNumber} onChange={e => setIdNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" placeholder="Solo números" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Placa Vehículo</label>
                    <input value={plate} onChange={e => setPlate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 text-center text-slate-900 dark:text-white" placeholder="ABC-123" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Modelo / Color</label>
                    <input value={model} onChange={e => setModel(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 text-center text-slate-900 dark:text-white" placeholder="Ej. Bera Azul" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? 'Generando...' : (
                    <>
                      <span className="material-symbols-outlined">qr_code_2</span>
                      Generar Pase {type === 'Delivery' ? 'Delivery' : 'Visita'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default AccessControl;