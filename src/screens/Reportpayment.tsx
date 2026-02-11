
import React, { useState } from 'react';

interface Props {
  setScreen: (s: string) => void;
}

const ReportPayment: React.FC<Props> = ({ setScreen }) => {
  const [method, setMethod] = useState('pago-movil');
  const rate = 36.50;

  return (
    <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back_ios_new</span>
          </button>
          <div>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Reportar Pago</h2>
            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">Condominio Seguro</p>
          </div>
        </div>
        <button className="text-primary text-sm font-semibold">Ayuda</button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
        {/* Exchange Rate Banner */}
        <div 
          onClick={() => setScreen('rate-history')}
          className="cursor-pointer flex flex-col gap-2 rounded-xl p-5 bg-primary/10 border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <p className="text-primary text-xs font-semibold uppercase tracking-wider">Tasa de Cambio Oficial</p>
            <span className="material-symbols-outlined text-primary text-sm">info</span>
          </div>
          <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-extrabold">1 USD = {rate} Bs.</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Actualizado hoy 9:00 AM • Tasa BCV</p>
        </div>

        {/* Payment Methods */}
        <section className="space-y-4">
          <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-widest">Método de Pago</h3>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {[
              { id: 'pago-movil', label: 'Pago Móvil', icon: 'smartphone' },
              { id: 'zelle', label: 'Zelle', icon: 'account_balance_wallet' },
              { id: 'efectivo', label: 'Efectivo', icon: 'payments' },
              { id: 'binance', label: 'Binance', icon: 'currency_bitcoin' },
              { id: 'transferencia', label: 'Transf.', icon: 'sync_alt' }
            ].map(m => (
              <button 
                key={m.id}
                onClick={() => setMethod(m.id)}
                className="flex flex-col items-center gap-2 shrink-0 group"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all ${method === m.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <span className="material-symbols-outlined text-2xl">{m.icon}</span>
                </div>
                <p className={`text-[10px] font-bold ${method === m.id ? 'text-primary' : 'text-slate-500'}`}>{m.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Form Fields */}
        <section className="space-y-6">
          <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-widest">Detalles de la Transacción</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-500 dark:text-slate-400 text-xs font-bold">Monto en USD</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-7 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary font-semibold" placeholder="0.00" type="number"/>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-500 dark:text-slate-400 text-xs font-bold">Monto en Bs</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Bs</span>
                <input className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-9 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary font-semibold" placeholder="0.00" type="number"/>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-500 dark:text-slate-400 text-xs font-bold">Número de Referencia</label>
            <input className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary font-semibold" placeholder="Últimos 6 dígitos" type="text"/>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Comprobante de Pago</label>
            <div className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer group">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
              </div>
              <p className="text-slate-900 dark:text-white text-sm font-bold">Subir Comprobante</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">PNG, JPG o PDF hasta 10MB</p>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-16 left-0 right-0 p-6 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent z-40">
        <button className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold py-4 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2">
          <span>Reportar Pago</span>
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
};

export default ReportPayment;