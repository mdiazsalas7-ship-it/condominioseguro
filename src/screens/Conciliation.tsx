
import React from 'react';

interface Props {
  setScreen: (s: string) => void;
}

const Conciliation: React.FC<Props> = ({ setScreen }) => {
  return (
    <div className="flex flex-col min-h-full pb-20">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setScreen('dashboard')} className="flex size-10 items-center justify-center rounded-full hover:bg-slate-200">
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h1 className="text-lg font-extrabold tracking-tight">Conciliación</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex size-10 items-center justify-center rounded-full"><span className="material-symbols-outlined">search</span></button>
            <button className="relative flex size-10 items-center justify-center rounded-full">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500"></span>
            </button>
          </div>
        </div>
        <div className="px-4">
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
            <button className="border-b-2 border-primary text-primary pb-3 pt-2 text-sm font-bold">Pendientes</button>
            <button className="border-b-2 border-transparent text-slate-500 pb-3 pt-2 text-sm font-bold">Aprobados</button>
            <button className="border-b-2 border-transparent text-slate-500 pb-3 pt-2 text-sm font-bold">Rechazados</button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Pendiente</p>
            <p className="text-lg font-extrabold mt-1">1.240,00 Bs.</p>
            <p className="text-xs text-primary font-bold tracking-tight">≈ $34.50 USD</p>
          </div>
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Reportes hoy</p>
            <p className="text-lg font-extrabold mt-1">12 Pagos</p>
            <p className="text-xs text-slate-400 font-medium">8 por conciliar</p>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
          <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/10 text-primary border border-primary/20 px-4">
            <span className="material-symbols-outlined text-lg leading-none">calendar_month</span>
            <p className="text-xs font-bold leading-none">Esta semana</p>
            <span className="material-symbols-outlined text-base">expand_more</span>
          </button>
          <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4">
            <p className="text-xs font-bold leading-none">Pago Móvil</p>
            <span className="material-symbols-outlined text-base">expand_more</span>
          </button>
        </div>

        <div className="space-y-4">
          {[
            { id: '1', unit: 'Apto 4B', resident: 'Carlos Pérez', bs: '450,00', usd: '12.50', ref: '9982', time: '12 OCT, 09:30 AM' },
            { id: '2', unit: 'Apto 12A', resident: 'María Elena', bs: '1.800,00', usd: '50.00', ref: 'ZE-881', time: '12 OCT, 11:15 AM' }
          ].map(pay => (
            <div key={pay.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                    <span className="material-symbols-outlined text-slate-400 text-3xl">image</span>
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white material-symbols-outlined opacity-0 group-hover:opacity-100">zoom_in</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-sm">{pay.unit} - {pay.resident}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-primary text-sm">account_balance_wallet</span>
                      <p className="text-[10px] text-slate-500">Ref: <span className="font-mono">{pay.ref}</span></p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">{pay.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold">{pay.bs} Bs.</p>
                  <p className="text-[10px] font-bold text-primary">${pay.usd}</p>
                </div>
              </div>
              <div className="flex gap-2 p-3 pt-0">
                <button className="flex-1 flex h-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:bg-red-500 active:text-white transition-colors">
                  Rechazar
                </button>
                <button className="flex-[1.5] flex h-10 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                  Aprobar Pago
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Conciliation;