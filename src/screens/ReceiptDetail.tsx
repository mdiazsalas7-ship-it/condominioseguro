
import React, { useState } from 'react';

interface Props {
  setScreen: (s: string) => void;
}

const ReceiptDetail: React.FC<Props> = ({ setScreen }) => {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  return (
    <div className="flex flex-col min-h-full pb-32">
      {/* Modal de visualización de soporte */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col p-6 animate-in fade-in duration-200">
           <div className="flex justify-end mb-4">
              <button onClick={() => setSelectedDoc(null)} className="size-12 rounded-full bg-white/10 text-white flex items-center justify-center">
                 <span className="material-symbols-outlined">close</span>
              </button>
           </div>
           <div className="flex-1 flex items-center justify-center overflow-hidden">
              <img src={selectedDoc} alt="Soporte Digital" className="max-w-full max-h-full object-contain rounded-xl" />
           </div>
           <p className="text-center text-white/60 text-xs font-bold uppercase tracking-widest mt-6">Soporte Certificado por Administración</p>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center p-4 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setScreen('dashboard')} className="p-2 -ml-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full">
              <span className="material-symbols-outlined block">arrow_back_ios_new</span>
            </button>
            <h2 className="text-lg font-bold leading-tight tracking-tight">Recibo de Condominio</h2>
          </div>
          <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined block">share</span>
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
              <img src="https://i.postimg.cc/G2dCR0gq/image.png" alt="Condominio Logo" className="w-full h-full object-cover p-2" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-extrabold tracking-tight">Residencias El Parque</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Octubre 2023 • Unidad: Apto 4-B</p>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px]">info</span>
                Tasa: 36.50 Bs/USD
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-xl p-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total USD</p>
            <p className="text-primary tracking-tight text-3xl font-extrabold leading-none">$45.00</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total BS.</p>
            <p className="text-slate-900 dark:text-white tracking-tight text-2xl font-extrabold leading-none">1,642.50</p>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold tracking-tight">Gastos Comunes del Mes</h3>
            <span className="text-[10px] font-bold text-slate-500">Toca para ver soporte</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Vigilancia y Seguridad', sub: 'Servicio 24/7 mes completo', val: '$850.00', icon: 'shield_moon', hasDoc: true },
              { label: 'Mantenimiento y Limpieza', sub: 'Personal y productos', val: '$600.00', icon: 'cleaning_services', hasDoc: true },
              { label: 'Mantenimiento Ascensores', sub: 'Revisión mensual preventiva', val: '$400.00', icon: 'elevator', hasDoc: false },
              { label: 'Electricidad Áreas Comunes', sub: 'Factura Corpoelec', val: '$150.00', icon: 'bolt', hasDoc: true }
            ].map((exp, i) => (
              <button 
                key={i} 
                onClick={() => exp.hasDoc && setSelectedDoc('https://i.postimg.cc/G2dCR0gq/image.png')} // Simulado
                className="w-full flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 active:bg-slate-50 transition-all text-left group"
              >
                <div className="flex items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 size-10">
                  <span className="material-symbols-outlined text-xl">{exp.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{exp.label}</p>
                  <p className="text-slate-500 text-[10px] truncate">{exp.sub}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-sm">{exp.val}</p>
                  </div>
                  {exp.hasDoc && (
                    <span className="material-symbols-outlined text-emerald-500 text-base group-hover:scale-110 transition-transform">description</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-bold tracking-tight mb-3">Cálculo de la Unidad</h3>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Alícuota (1.5%)</span>
              <span className="font-bold">$36.75</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Cuota de Reserva</span>
              <span className="font-bold">$3.25</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Deuda Anterior</span>
              <span className="font-bold text-rose-500">$5.00</span>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <span className="font-bold text-sm">Total a Pagar</span>
              <div className="text-right">
                <span className="block font-extrabold text-xl text-primary">$45.00</span>
                <span className="block text-[10px] text-slate-500 uppercase tracking-tighter">Equiv. 1,642.50 Bs.</span>
              </div>
            </div>
          </div>
          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500 text-sm">verified</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Soportes digitales disponibles para revisión</p>
          </div>
        </section>
      </main>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex gap-3 z-40">
        <button className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined">picture_as_pdf</span>
          Bajar PDF
        </button>
        <button onClick={() => setScreen('report-payment')} className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 active:scale-95 transition-all">
          <span className="material-symbols-outlined">payments</span>
          Reportar Pago
        </button>
      </div>
    </div>
  );
};

export default ReceiptDetail;