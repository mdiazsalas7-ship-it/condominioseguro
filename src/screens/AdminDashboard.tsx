
import React from 'react';
import { UserProfile } from '../types';

interface Props {
  setScreen: (s: string) => void;
  profile: UserProfile | null;
  onLogout?: () => void;
}

const AdminDashboard: React.FC<Props> = ({ setScreen, profile, onLogout }) => {
  return (
    <div className="flex flex-col min-h-full pb-24">
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex flex-col">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Administrador</p>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Panel Condominio</h1>
        </div>
        <button onClick={() => setScreen('profile-edit')} className="size-11 rounded-full border-2 border-primary overflow-hidden">
          {profile?.photoURL ? <img src={profile.photoURL} alt="Admin" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined p-2">person</span>}
        </button>
      </header>

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setScreen('financial-report')} className="flex flex-col gap-4 rounded-3xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-800 transition-all active:scale-95 shadow-sm">
            <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">analytics</span>
            </div>
            <h2 className="text-sm font-black uppercase">Reporte Mes</h2>
          </button>

          <button onClick={() => setScreen('unit-management')} className="flex flex-col gap-4 rounded-3xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-800 transition-all active:scale-95 shadow-sm">
            <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">home_work</span>
            </div>
            <h2 className="text-sm font-black uppercase">Unidades</h2>
          </button>
        </div>

        <div onClick={() => setScreen('unit-management')} className="cursor-pointer bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Resumen de Cartera</p>
            <p className="text-3xl font-black mt-1">$4,250.32</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">8 Unidades Morosas</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl opacity-5">account_balance</span>
        </div>

        <button onClick={() => setScreen('create-receipt')} className="w-full flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800">
           <div className="flex items-center gap-4">
              <div className="size-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined">add_notes</span>
              </div>
              <span className="text-sm font-black uppercase">Armar Nuevo Recibo</span>
           </div>
           <span className="material-symbols-outlined text-slate-300">chevron_right</span>
        </button>
      </main>
    </div>
  );
};

export default AdminDashboard;