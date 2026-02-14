import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Asegúrate de tener esto configurado
import { collection, addDoc, query, where, onSnapshot, Timestamp } from 'firebase/firestore';

interface Props {
  setScreen: (s: string) => void;
  userProfile?: any;
}

interface Reservation {
  id: string;
  date: string; // Formato YYYY-MM-DD
  status: 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO';
  residentName: string;
  monto?: number;
}

const CaneyReservation: React.FC<Props> = ({ setScreen, userProfile }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para el formulario de reserva
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');
  
  const COSTO_ALQUILER = 20.00; // Costo fijo en Dólares

  // 1. CARGAR RESERVAS DEL MES (Simulación con Firebase real comentada)
  useEffect(() => {
    // AQUÍ IRÍA LA CONSULTA REAL A FIREBASE:
    /*
    const q = query(collection(db, 'caney_reservations'));
    const unsub = onSnapshot(q, (snap) => {
       const data = snap.docs.map(d => ({id: d.id, ...d.data()})) as Reservation[];
       setReservations(data);
    });
    return () => unsub();
    */

    // DATOS DE EJEMPLO PARA QUE VEAS CÓMO SE VE:
    setReservations([
      { id: '1', date: '2025-12-24', status: 'CONFIRMADO', residentName: 'Pedro Pérez' },
      { id: '2', date: '2025-12-31', status: 'PENDIENTE', residentName: 'Tu Vecino' },
    ]);
  }, []);

  // Lógica del Calendario
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${year}-${month}-${dayStr}`;

    // Verificar si está ocupado
    const existing = reservations.find(r => r.date === fullDate);
    
    if (existing) {
      if (existing.status === 'CONFIRMADO') return alert(`⛔ FECHA OCUPADA por ${existing.residentName}`);
      if (existing.status === 'PENDIENTE') return alert(`⚠️ FECHA EN PROCESO DE PAGO. Intenta más tarde.`);
    }

    // Verificar si es fecha pasada
    const today = new Date().toISOString().split('T')[0];
    if (fullDate < today) return alert("No puedes viajar al pasado 😅");

    setSelectedDate(fullDate);
    setShowPaymentForm(false);
  };

  const handleSubmitReservation = async () => {
    if (!motivo || !referenciaPago) return alert("Debes llenar todos los datos");
    
    setLoading(true);
    try {
        // AQUÍ SE GUARDA EN FIREBASE
        /*
        await addDoc(collection(db, 'caney_reservations'), {
            date: selectedDate,
            residentUid: userProfile.uid,
            residentName: userProfile.name,
            unit: userProfile.unit,
            motivo,
            referenciaPago,
            monto: COSTO_ALQUILER,
            status: 'PENDIENTE', // Pasa a revisión del administrador
            createdAt: serverTimestamp()
        });
        */
       
       // Simulación de éxito
       setTimeout(() => {
           alert("✅ Solicitud enviada con éxito. La Junta verificará tu pago.");
           setScreen('dashboard');
       }, 1500);

    } catch (error) {
        console.error(error);
        alert("Error al reservar");
    } finally {
        setLoading(false);
    }
  };

  // Renderizar días
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Espacios vacíos antes del día 1
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const fullDate = `${year}-${monthStr}-${dayStr}`;
      
      const reservation = reservations.find(r => r.date === fullDate);
      let bgColor = "bg-slate-800 hover:bg-slate-700"; // Libre
      let textColor = "text-white";

      if (reservation?.status === 'CONFIRMADO') {
          bgColor = "bg-red-600/80 cursor-not-allowed"; // Ocupado
          textColor = "text-slate-300";
      } else if (reservation?.status === 'PENDIENTE') {
          bgColor = "bg-yellow-600/80 cursor-not-allowed"; // En proceso
      }

      if (selectedDate === fullDate) {
          bgColor = "bg-blue-500 ring-2 ring-white"; // Seleccionado
      }

      days.push(
        <button 
            key={day} 
            onClick={() => handleDateClick(day)}
            className={`h-10 w-full rounded-lg flex items-center justify-center font-bold text-sm transition-all ${bgColor} ${textColor}`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white pb-20">
      {/* HEADER */}
      <header className="p-4 bg-slate-800 border-b border-slate-700 sticky top-0 z-50 flex items-center gap-4">
        <button onClick={() => setScreen('dashboard')} className="p-2 rounded-full hover:bg-slate-700">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
           <h1 className="text-lg font-black uppercase tracking-widest text-blue-400">Reserva de Caney</h1>
           <p className="text-xs text-slate-400 font-bold">Un espacio para todos</p>
        </div>
      </header>

      <main className="p-4 space-y-6">
        
        {/* NAVEGACIÓN MES */}
        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-700"><span className="material-symbols-outlined">chevron_left</span></button>
            <h2 className="text-xl font-black uppercase tracking-wide">
                {currentDate.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-700"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>

        {/* LEYENDA */}
        <div className="flex justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-800 rounded-full border border-slate-600"></div> Libre</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-600 rounded-full"></div> En Proceso</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-600 rounded-full"></div> Ocupado</div>
        </div>

        {/* CALENDARIO GRID */}
        <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 shadow-2xl">
            <div className="grid grid-cols-7 mb-2 text-center">
                {['D','L','M','M','J','V','S'].map(d => <span key={d} className="text-xs font-black text-slate-500">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {renderCalendarDays()}
            </div>
        </div>

        {/* ACCIÓN AL SELECCIONAR FECHA */}
        {selectedDate && !showPaymentForm && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 animate-in slide-in-from-bottom-10">
                <div className="max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Fecha Seleccionada</p>
                            <p className="text-xl font-black text-white">{selectedDate}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold uppercase">Costo</p>
                            <p className="text-xl font-black text-green-400">${COSTO_ALQUILER}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowPaymentForm(true)} className="w-full bg-blue-600 py-4 rounded-xl font-black uppercase shadow-lg shadow-blue-900/50 active:scale-95 transition-all">
                        Reservar Ahora
                    </button>
                </div>
            </div>
        )}

        {/* FORMULARIO DE PAGO (SOLO SI SELECCIONÓ FECHA) */}
        {selectedDate && showPaymentForm && (
            <div className="bg-slate-800 p-6 rounded-3xl border border-blue-500/30 animate-in zoom-in-95">
                <h3 className="text-lg font-black uppercase text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400">payments</span>
                    Confirmar Reserva
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase ml-2">Motivo del Evento</label>
                        <input 
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            placeholder="Ej. Cumpleaños de mi hijo"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-700">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-2">Datos para el Pago</p>
                        <p className="text-sm font-bold text-white">Pago Móvil / Zelle</p>
                        <p className="text-xs text-slate-400">0412-1234567 • J-123456789</p>
                        <p className="text-xs text-slate-400">Banco Mercantil</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase ml-2">Referencia de Pago</label>
                        <input 
                            value={referenciaPago}
                            onChange={e => setReferenciaPago(e.target.value)}
                            type="number"
                            placeholder="Últimos 4 dígitos"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <button 
                        onClick={handleSubmitReservation}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-black uppercase text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Enviando...' : 'Reportar Pago y Reservar'}
                    </button>
                    
                    <button onClick={() => setShowPaymentForm(false)} className="w-full py-2 text-xs font-bold text-slate-500 uppercase">Cancelar</button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default CaneyReservation;