
import React, { useState } from 'react';
import { UserRole } from '../types';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface Props {
  onNavigateToLogin: () => void;
}

const Register: React.FC<Props> = ({ onNavigateToLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.RESIDENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [apt, setApt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        email: email.trim(),
        role,
        unit: role === UserRole.RESIDENT ? unit.trim() : null,
        apt: role === UserRole.RESIDENT ? apt.trim() : null,
        createdAt: new Date().toISOString(),
        photoURL: null
      });
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else {
        setError('Error al crear la cuenta. Revisa los datos.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark p-6">
      <header className="mb-8 pt-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onNavigateToLogin} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <img src="https://i.postimg.cc/G2dCR0gq/image.png" alt="Logo" className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Crear Cuenta</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Únete a tu comunidad residencial</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        {error && (
          <div className="bg-danger/10 border border-danger/20 p-3 rounded-xl text-danger text-xs font-bold text-center animate-shake">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Tipo de Usuario</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { r: UserRole.RESIDENT, label: 'Residente', icon: 'home' },
              { r: UserRole.SECURITY, label: 'Seguridad', icon: 'shield' },
              { r: UserRole.ADMIN, label: 'Admin', icon: 'admin_panel_settings' }
            ].map(item => (
              <button 
                key={item.r}
                type="button"
                onClick={() => setRole(item.r)}
                className={`h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${role === item.r ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Nombre Completo</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl h-14 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" placeholder="Juan Pérez" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Correo Electrónico</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl h-14 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" placeholder="juan@correo.com" />
          </div>

          {role === UserRole.RESIDENT && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Torre</label>
                <input required type="text" value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl h-14 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" placeholder="A" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Apto</label>
                <input required type="text" value={apt} onChange={e => setApt(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl h-14 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" placeholder="102" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Contraseña</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl h-14 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" placeholder="••••••••" />
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black h-14 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Crear mi cuenta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;