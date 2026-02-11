
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface Props {
  onNavigateToRegister: () => void;
  onDemoLogin?: (role: 'ADMIN' | 'RESIDENT' | 'SECURITY') => void;
}

const Login: React.FC<Props> = ({ onNavigateToRegister, onDemoLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('El correo o la contraseña son incorrectos.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Error de conexión. Verifica tu internet.');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark p-6 justify-center">
      <div className="mb-10 text-center">
        <div className="inline-flex size-20 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-xl shadow-primary/10 mb-4 overflow-hidden border border-slate-100 dark:border-slate-700">
          <img src="https://i.postimg.cc/G2dCR0gq/image.png" alt="Condominio Seguro" className="w-full h-full object-cover p-2" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Condominio Seguro</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-xs uppercase tracking-widest">Gestión Inteligente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/10 border border-danger/20 p-3 rounded-xl text-danger text-xs font-bold text-center animate-shake">
            {error}
          </div>
        )}
        
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Correo Electrónico</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
            <input 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl h-12 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary transition-all text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contraseña</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
            <input 
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl h-12 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary transition-all text-sm"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-black h-12 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
          {!loading && <span className="material-symbols-outlined text-xl">login</span>}
        </button>
      </form>

      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acceso Rápido (Demo)</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { role: 'RESIDENT', label: 'Residente', icon: 'person' },
            { role: 'ADMIN', label: 'Admin', icon: 'admin_panel_settings' },
            { role: 'SECURITY', label: 'Vigilante', icon: 'security' }
          ].map((item) => (
            <button 
              key={item.role}
              onClick={() => onDemoLogin?.(item.role as any)}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 active:bg-primary/5 active:border-primary/30 transition-all group"
            >
              <span className="material-symbols-outlined text-slate-400 group-active:text-primary">{item.icon}</span>
              <span className="text-[9px] font-black uppercase text-slate-500">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="text-center mt-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            ¿No tienes una cuenta?{' '}
            <button 
              onClick={onNavigateToRegister}
              className="text-primary font-bold hover:underline"
            >
              Regístrate
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;