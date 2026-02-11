
import React from 'react';

interface Props {
  setScreen: (s: string) => void;
}

const RateHistory: React.FC<Props> = ({ setScreen }) => {
  return (
    <div className="flex flex-col min-h-full pb-12">
      <header className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => setScreen('dashboard')} className="text-primary flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight flex-1 text-center pr-10 tracking-tight">Historial de Tasas</h2>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <div className="flex flex-col gap-2 rounded-2xl p-6 bg-white dark:bg-[#1c2632] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tasa Actual BCV</p>
              <p className="text-slate-900 dark:text-white tracking-tight text-4xl font-extrabold leading-tight mt-1">Bs. 36.50</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +0.2%
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">schedule</span>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Última actualización: Hoy, 09:15 AM</p>
          </div>
        </div>

        <div className="flex gap-2 py-2 overflow-x-auto hide-scrollbar">
          <button className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold shrink-0">30 Días</button>
          <button className="bg-slate-200 dark:bg-slate-800 text-slate-500 px-4 py-1.5 rounded-full text-xs font-bold shrink-0">15 Días</button>
          <button className="bg-slate-200 dark:bg-slate-800 text-slate-500 px-4 py-1.5 rounded-full text-xs font-bold shrink-0">7 Días</button>
        </div>

        <section className="bg-white dark:bg-[#1c2632] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-widest">Fluctuación</p>
            <div className="flex items-center gap-1">
              <span className="text-emerald-500 text-xs font-bold">+4.5%</span>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">este mes</p>
            </div>
          </div>
          <div className="h-40 w-full relative">
            {/* SVG Chart placeholder as per Screen 11 */}
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 150">
              <path d="M0,100 Q50,20 100,80 T200,40 T300,120 T400,60 L400,150 L0,150 Z" fill="url(#grad)" />
              <path d="M0,100 Q50,20 100,80 T200,40 T300,120 T400,60" fill="none" stroke="#137fec" strokeWidth="3" strokeLinecap="round" />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#137fec', stopOpacity:0.3}} />
                  <stop offset="100%" style={{stopColor:'#137fec', stopOpacity:0}} />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-3">
            {['01 NOV', '08 NOV', '15 NOV', '22 NOV', '30 NOV'].map(date => (
              <span key={date} className="text-slate-400 text-[9px] font-bold tracking-widest">{date}</span>
            ))}
          </div>
        </section>

        <section className="pb-12">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-lg font-bold">Detalle por Fecha</h3>
            <button className="text-primary text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filtrar
            </button>
          </div>
          <div className="space-y-2">
            {[
              { date: '30 Nov, 2023', day: 'Viernes', val: '36.50', diff: '+0.05', type: 'up' },
              { date: '29 Nov, 2023', day: 'Jueves', val: '36.45', diff: '-0.02', type: 'down' },
              { date: '28 Nov, 2023', day: 'Miércoles', val: '36.47', diff: '0.00', type: 'equal' }
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-4 bg-white dark:bg-[#1c2632]/40 px-4 h-16 justify-between rounded-xl border border-transparent hover:border-slate-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-10">
                    <span className="material-symbols-outlined">calendar_today</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-slate-900 dark:text-white text-sm font-bold leading-none">{row.date}</p>
                    <p className="text-slate-400 text-[10px] mt-1">{row.day}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold leading-none">{row.val}</p>
                  <p className={`text-[10px] font-bold mt-1 ${row.type === 'up' ? 'text-emerald-500' : row.type === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
                    {row.diff}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-4 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 rounded-full mt-6">
            Ver más registros
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        </section>
      </main>

      <footer className="p-8 text-center border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-background-dark">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
          <p className="text-slate-500 text-[10px] leading-relaxed max-w-xs font-medium uppercase tracking-widest">
            Datos sincronizados con el <span className="text-primary font-extrabold underline">BCV</span>. Información oficial para cálculos de condominio.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RateHistory;