import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

interface Props {
  setScreen: (s: string) => void;
}

const AccessControl: React.FC<Props> = ({ setScreen }) => {
  // Estados de Control
  const [loadingSolvency, setLoadingSolvency] = useState(true);
  const [isSolvent, setIsSolvent] = useState(false);
  const [monthsOwed, setMonthsOwed] = useState(0);
  
  // DATOS DEL INMUEBLE Y PROPIETARIO
  const [ownerName, setOwnerName] = useState('');
  const [fullAddress, setFullAddress] = useState('');

  // Estados del Formulario
  const [type, setType] = useState<'Visitante' | 'Delivery' | 'Taxi' | 'Mudanza'>('Visitante');
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [companyDetails, setCompanyDetails] = useState(''); 
  
  const [creating, setCreating] = useState(false);
  const [invitationId, setInvitationId] = useState<string | null>(null);

  // 1. CARGAR DATOS DEL PERFIL (CORREGIDO)
  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          
          // A. Validar Deuda
          const debt = data.monthsOwed || 0;
          setMonthsOwed(debt);
          setIsSolvent(debt < 3); // Regla de 3 meses

          // B. Obtener Nombre del Dueño (Clave para el vigilante)
          // Prioridad: El nombre en la BD > El nombre del Auth > 'Propietario'
          const realOwner = data.name || auth.currentUser.displayName || 'Propietario';
          setOwnerName(realOwner);

          // C. Obtener Dirección Exacta (CORREGIDO PARA TU DATA)
          // Según tu data: 'unit' es la Torre, 'apt' es el Apartamento
          const torreVal = data.unit || data.torre || data.tower || '??';
          const aptoVal = data.apt || data.apto || '??';
          
          setFullAddress(`Torre ${torreVal} - Apto ${aptoVal}`);
        } else {
          // Si no existe el perfil en BD, bloqueamos por seguridad
          setIsSolvent(false);
          setFullAddress("Sin Asignar");
        }
        
      } catch (error) {
        console.error("Error cargando perfil", error);
        setIsSolvent(false);
      } finally {
        setLoadingSolvency(false);
      }
    };

    fetchUserData();
  }, []);

  const handleCreate = async () => {
    if (!auth.currentUser) return alert("Error de sesión");
    if (!name || !idNumber) return alert("⚠️ Faltan datos del visitante (Nombre y Cédula)");
    if (type !== 'Visitante' && !companyDetails) return alert("⚠️ Falta detalle de empresa/línea");

    setCreating(true);
    try {
      // Guardamos la invitación con los datos corregidos
      const docRef = await addDoc(collection(db, 'access_invitations'), {
        type,
        name: name.toUpperCase(), // Guardar en mayúsculas para mejor lectura
        idNumber,
        vehiclePlate: plate.toUpperCase() || 'N/A',
        vehicleModel: model || 'N/A',
        deliveryCompany: companyDetails || null,
        
        // DATOS CLAVES QUE VERÁ EL VIGILANTE
        unit: fullAddress, // Ej: "Torre 2 - Apto 3-5"
        ownerName: ownerName, // Ej: "Brahulyz Brito"
        
        status: 'PENDIENTE',
        author: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        
        entryTime: null,
        exitTime: null,
        archived: false
      });

      setInvitationId(docRef.id);

    } catch (e) {
      console.error(e);
      alert("Error al generar el pase. Intente de nuevo.");
    } finally {
      setCreating(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!invitationId) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${invitationId}`;
    
    // MENSAJE FORMATEADO
    let text = `👋 *AUTORIZACIÓN DE ACCESO*\n`;
    text += `🏢 *Destino:* ${fullAddress}\n`;
    text += `👤 *Autoriza:* ${ownerName}\n\n`;
    text += `👤 *Visitante:* ${name}\n`;
    text += `🆔 *CI:* ${idNumber}\n`;
    text += `📌 *Motivo:* ${type.toUpperCase()}\n`;
    
    if (type !== 'Visitante') {
      text += `ℹ️ *Detalle:* ${companyDetails}\n`;
    }
    
    text += `\n*Mostrar este QR en Garita:* 👇\n${qrUrl}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const resetForm = () => {
    setName(''); setIdNumber(''); setPlate(''); setModel(''); setCompanyDetails('');
    setInvitationId(null); setType('Visitante');
  };

  // --- UI: PANTALLA DE CARGA ---
  if (loadingSolvency) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <span className="material-symbols-outlined animate-spin text-4xl text-blue-600">sync</span>
      </div>
    );
  }

  // --- UI: BLOQUEO POR MOROSIDAD ---
  if (!isSolvent) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-8 items-center justify-center text-center">
        <div className="size-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl text-red-500">gavel</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase">Acceso Restringido</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6 max-w-xs">
          La unidad <strong>{fullAddress}</strong> presenta una deuda pendiente de <strong>{monthsOwed} meses</strong>.
        </p>
        <button onClick={() => setScreen('dashboard')} className="text-slate-400 font-bold uppercase text-xs hover:text-slate-600">
          Volver al Inicio
        </button>
      </div>
    );
  }

  // --- UI: GENERADOR DE PASES ---
  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => setScreen('dashboard')} className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white hover:bg-slate-200 transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">Nuevo Acceso</h2>
          <p className="text-[10px] uppercase font-bold text-blue-600 tracking-widest">{fullAddress}</p>
        </div>
        <div className="size-10"></div>
      </header>

      <main className="p-4 space-y-6">
        
        {invitationId ? (
          /* PANTALLA DE ÉXITO */
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center animate-in zoom-in duration-300">
            <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">verified</span> Pase Activo
            </div>
            
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${invitationId}`} alt="QR" className="size-48 mix-blend-multiply" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center">{name}</h3>
            <p className="text-slate-400 text-sm font-bold mb-4">CI: {idNumber}</p>
            
            <div className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl mb-4 space-y-2 border border-slate-100 dark:border-slate-700">
               <div className="flex justify-between text-xs">
                 <span className="text-slate-400 font-bold">Destino:</span> 
                 <span className="font-black text-slate-800 dark:text-white">{fullAddress}</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-slate-400 font-bold">Autoriza:</span> 
                 <span className="font-black text-slate-800 dark:text-white">{ownerName}</span>
               </div>
            </div>
            
            <button onClick={handleShareWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1da851] text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
              <span className="material-symbols-outlined text-lg">share</span> Compartir QR
            </button>
            <button onClick={resetForm} className="mt-4 text-xs font-bold text-slate-400 uppercase hover:text-blue-600">
              Generar Nuevo Pase
            </button>
          </div>
        ) : (
          /* FORMULARIO */
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 animate-in slide-in-from-bottom-4">
            
            <div className="grid grid-cols-2 gap-2">
              {['Visitante', 'Delivery', 'Taxi', 'Mudanza'].map((t) => (
                <button 
                  key={t} 
                  onClick={() => setType(t as any)} 
                  className={`py-3 rounded-xl text-xs font-black uppercase flex flex-col items-center gap-1 transition-all ${type === t ? 'bg-blue-600 text-white shadow-lg transform scale-105' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {t === 'Visitante' ? 'person' : t === 'Delivery' ? 'two_wheeler' : t === 'Taxi' ? 'local_taxi' : 'local_shipping'}
                  </span>
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {type !== 'Visitante' && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest px-1 text-blue-600">
                    {type === 'Mudanza' ? 'Empresa de Mudanza' : type === 'Taxi' ? 'Línea de Taxi / App' : 'Empresa Delivery'}
                  </label>
                  <input value={companyDetails} onChange={e => setCompanyDetails(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 dark:text-white" placeholder="Ej. Yummy / Línea El Centro" />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-slate-400">Nombre Completo</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-slate-400">Cédula</label>
                <input type="number" value={idNumber} onChange={e => setIdNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 dark:text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest px-1 text-slate-400">Placa (Opcional)</label>
                  <input value={plate} onChange={e => setPlate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold text-center uppercase" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest px-1 text-slate-400">Modelo</label>
                  <input value={model} onChange={e => setModel(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold text-center" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleCreate}
              disabled={creating}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {creating ? 'Generando...' : 'Generar Pase'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AccessControl;