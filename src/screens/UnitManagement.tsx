
import React, { useState } from 'react';
import { UnitStatus } from '../types';

interface Props {
  setScreen: (s: string) => void;
}

const UnitManagement: React.FC<Props> = ({ setScreen }) => {
  const [selectedUnit, setSelectedUnit] = useState<UnitStatus | null>(null);
  
  const [units] = useState<UnitStatus[]>([
    { id: '1', number: '101', tower: 'A', owner: 'Juan Pérez', monthsOwed: 0, lastPaymentDate: '2023-11-05', status: 'Solvente' },
    { id: '2', number: '102', tower: 'A', owner: 'María López', monthsOwed: 5, lastPaymentDate: '2023-06-15', status: 'Insolvente' },
    { id: '3', number: '201', tower: 'A', owner: 'Carlos Sosa', monthsOwed: 2, lastPaymentDate: '2023-09-20', status: 'Pendiente' },
    { id: '4', number: '202', tower: 'A', owner: 'Ana Rivas', monthsOwed: 6, lastPaymentDate: '2023-05-10', status: 'Insolvente' },
    { id: '5', number: '305', tower: 'B', owner: 'Pedro Castillo', monthsOwed: 1, lastPaymentDate: '2023-10-10', status: 'Pendiente' },
  ]);

  return (
    <div className="flex flex-col min-h-full pb-20 bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h2 className="text-lg font-black tracking-tight">Estado de Unidades</h2>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {!selectedUnit ? (
          <>
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-rose-500">info</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 leading-relaxed">
                Aviso: Las unidades con más de 4 meses de insolvencia están marcadas para restricción automática de servicios.
              </p>
            </div>

            <div className="relative mb-6">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input placeholder="Buscar por apto o nombre..." className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl h-12 pl-12 pr-4 text-sm font-bold shadow-sm" />
            </div>

            <div className="space-y-3">
              {units.map((unit) => (
                <div 
                  key={unit.id} 
                  onClick={() => setSelectedUnit(unit)}
                  className={`bg-white dark:bg-slate-800 p-4 rounded-2xl border flex justify-between items-center cursor-pointer transition-all active:scale-98 ${unit.monthsOwed >= 4 ? 'border-rose-500 shadow-lg shadow-rose-500/10' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-12 rounded-xl flex flex-col items-center justify-center text-white ${unit.monthsOwed >= 4 ? 'bg-rose-500' : 'bg-slate-900'}`}>
                      <span className="text-[9px] font-black uppercase tracking-tighter leading-none">Apto</span>
                      <span className="text-lg font-black leading-none mt-1">{unit.number}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black">{unit.owner}</p>
                      <p className={`text-[10px] font-bold uppercase ${unit.monthsOwed >= 4 ? 'text-rose-500' : 'text-slate-500'}`}>
                        {unit.monthsOwed} meses de deuda
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {unit.monthsOwed >= 4 && (
                      <span className="material-symbols-outlined text-rose-500 animate-pulse">report</span>
                    )}
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Detalle de Unidad */
          <div className="animate-in fade-in slide-in-from-bottom-5 space-y-6">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter">Unidad {selectedUnit.number}</h3>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">{selectedUnit.owner}</p>
                  </div>
                  <button onClick={() => setSelectedUnit(null)} className="size-10 bg-white/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined">close</span>
                  </button>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl">
                     <p className="text-[9px] font-black uppercase text-white/40">Solvencia</p>
                     <p className={`text-sm font-black mt-1 ${selectedUnit.monthsOwed >= 4 ? 'text-rose-500' : 'text-emerald-500'}`}>
                       {selectedUnit.monthsOwed >= 4 ? 'Insolvente' : 'En Regla'}
                     </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl">
                     <p className="text-[9px] font-black uppercase text-white/40">Meses Pendientes</p>
                     <p className="text-sm font-black mt-1">{selectedUnit.monthsOwed} meses</p>
                  </div>
               </div>
            </div>

            <section className="space-y-4">
               <h3 className="text-sm font-black uppercase tracking-widest px-1">Auditoría de Mensualidades</h3>
               <div className="space-y-2">
                  {['Noviembre', 'Octubre', 'Septiembre', 'Agosto', 'Julio', 'Junio'].map((monthName, i) => {
                    const isOwed = i < selectedUnit.monthsOwed;
                    return (
                      <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                         <div className="flex items-center gap-3">
                            <div className={`size-8 rounded-full flex items-center justify-center ${isOwed ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                              <span className="material-symbols-outlined text-lg">
                                {isOwed ? 'event_busy' : 'check_circle'}
                              </span>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">{monthName} 2023</span>
                         </div>
                         <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${isOwed ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                           {isOwed ? 'Pendiente' : 'Pagado'}
                         </span>
                      </div>
                    )
                  })}
               </div>
            </section>
            
            <button className="w-full bg-primary text-white font-black h-14 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">mail</span>
              Enviar Recordatorio de Pago
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default UnitManagement;