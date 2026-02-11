
import React from 'react';
import { UserProfile } from '../types';

interface Props {
  setScreen: (s: string) => void;
  profile: UserProfile | null;
  onLogout?: () => void;
}

const ResidentDashboard: React.FC<Props> = ({ setScreen, profile, onLogout }) => {
  const balanceUSD = 0.00;
  const rate = 36.50;
  const balanceVES = balanceUSD * rate;

  const contactJuntaWhatsApp = () => {
    const phone = "584120000000"; // Número de la junta configurado
    const message = encodeURIComponent(`Hola Junta de Condominio, soy ${profile?.name} del Apto ${profile?.apt}. Necesito comunicarme con ustedes.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="flex flex-col min-h-full pb-20">
      <header className="flex items-center p-4 pb-2 justify-between">
        <button 
          onClick={() => setScreen('profile-edit')}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden transition-transform active:scale-95"
        >
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="Perfil" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">person</span>
          )}
        </button>
        <div className="flex-1 px-3">
          <h1 className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-none">Hola, {profile?.name?.split(' ')[0]}</h1>
          <h2 className="text-lg font-bold leading-tight tracking-tight">
            {profile?.unit ? `Apto. ${profile.apt} - Torre ${profile.unit}` : 'Configurando cuenta...'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={contactJuntaWhatsApp}
            className="flex size-10 items-center justify-center rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-sm active:scale-90"
            title="Contactar Junta via WhatsApp"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6" alt="WA" />
          </button>
          <button 
            onClick={onLogout}
            className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Account Status Card */}
        <div 
          onClick={() => setScreen('receipt-detail')}
          className="cursor-pointer flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50 transition-all hover:ring-2 hover:ring-primary/20"
        >
          <div className="flex justify-between items-start">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Estado de Cuenta</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${balanceUSD <= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
              {balanceUSD <= 0 ? 'Al día' : 'Pendiente'}
            </span>
          </div>
          <div className="mt-1">
            <p className="text-xs text-slate-400 font-medium uppercase mb-1">Saldo por Pagar</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-extrabold leading-tight tracking-tight">${balanceUSD.toFixed(2)}</p>
              <p className="text-lg font-medium text-slate-400">USD</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
            <p className="text-primary font-bold text-lg">Bs. {balanceVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-widest mb-4 opacity-70">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'announcements', label: 'Anuncios', sub: 'Asambleas y notas', icon: 'campaign', color: 'bg-amber-500/10 text-amber-500' },
              { id: 'surveys', label: 'Encuestas', sub: 'Votaciones activas', icon: 'poll', color: 'bg-primary/10 text-primary' },
              { id: 'report-payment', label: 'Reportar Pago', sub: 'Registrar transf.', icon: 'payments', color: 'bg-emerald-500/10 text-emerald-500' },
              { id: 'access-control', label: 'Generar QR', sub: 'Acceso invitados', icon: 'qr_code_2', color: 'bg-purple-500/10 text-purple-500' }
            ].map(action => (
              <button 
                key={action.id}
                onClick={() => setScreen(action.id)}
                className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-4 transition-all active:bg-slate-100 dark:active:bg-slate-800 hover:border-primary/40 group"
              >
                <div className={`flex size-10 items-center justify-center rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined">{action.icon}</span>
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-bold leading-tight">{action.label}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1">{action.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Floating WhatsApp Contact */}
        <div className="py-2">
          <button 
            onClick={contactJuntaWhatsApp}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-16 bg-[#25D366] text-white gap-3 shadow-lg shadow-green-500/20 active:scale-95 transition-transform group"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-8 h-8 group-hover:rotate-12 transition-transform" alt="WA" />
            <span className="text-lg font-black tracking-tighter uppercase">Contactar Junta</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default ResidentDashboard;