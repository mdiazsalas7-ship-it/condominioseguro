
import React from 'react';

interface Props {
  setScreen: (s: string) => void;
}

const FaultReport: React.FC<Props> = ({ setScreen }) => {
  return (
    <div className="flex flex-col min-h-full pb-32">
      <header className="sticky top-0 z-50 bg-white dark:bg-[#1c2631] border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-16">
          <button onClick={() => setScreen('dashboard')} className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100 text-gray-800 dark:text-white">
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <h1 className="text-[#111418] dark:text-white text-lg font-bold tracking-tight">Reportar Falla</h1>
          <div className="size-10"></div>
        </div>
      </header>

      <main className="p-4 space-y-8">
        <section>
          <h2 className="text-[#111418] dark:text-white text-xs font-bold uppercase tracking-widest mb-4 opacity-70">¿Qué falló?</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {[
              { label: 'Ascensores', icon: 'elevator', active: true },
              { label: 'Electricidad', icon: 'bolt', active: false },
              { label: 'Agua', icon: 'water_drop', active: false },
              { label: 'Áreas Verdes', icon: 'park', active: false }
            ].map((cat, i) => (
              <button 
                key={i}
                className={`flex flex-col items-center justify-center min-w-[84px] aspect-square rounded-2xl transition-all shadow-sm ${cat.active ? 'bg-primary text-white shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700'}`}
              >
                <span className="material-symbols-outlined mb-1 text-2xl">{cat.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Ubicación</label>
            <div className="relative">
              <select className="w-full h-14 bg-white dark:bg-[#1c2631] border border-gray-200 dark:border-gray-800 rounded-xl px-4 text-base focus:ring-2 focus:ring-primary appearance-none">
                <option value="">Seleccionar ubicación</option>
                <option value="torre-a">Torre A</option>
                <option value="torre-b">Torre B - Planta Baja</option>
                <option value="estacionamiento">Estacionamiento E1</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Detalles de la avería</label>
            <textarea 
              className="w-full bg-white dark:bg-[#1c2631] border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-base placeholder-gray-400 focus:ring-2 focus:ring-primary resize-none" 
              placeholder="Describe el problema con el mayor detalle posible..." 
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Evidencia (Opcional)</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center h-32 bg-primary/5 border-2 border-dashed border-primary rounded-2xl text-primary transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                <span className="text-[10px] font-bold uppercase">Tomar Foto</span>
              </button>
              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                   <span className="material-symbols-outlined text-slate-400 text-4xl">image</span>
                </div>
                <button className="absolute top-2 right-2 size-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/80 dark:bg-[#101922]/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-40">
        <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-2xl text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
          Enviar Reporte
        </button>
        <p className="text-center text-[10px] text-gray-500 mt-4 uppercase font-bold tracking-[0.2em] opacity-70">
          Tu reporte será enviado a la administración
        </p>
      </div>
    </div>
  );
};

export default FaultReport;