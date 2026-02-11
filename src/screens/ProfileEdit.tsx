
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface Props {
  setScreen: (s: string) => void;
  profile: UserProfile | null;
  onLogout?: () => Promise<void>;
}

const ProfileEdit: React.FC<Props> = ({ setScreen, profile, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(profile?.photoURL);
  const [phone, setPhone] = useState(profile?.phone || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        photoURL: preview || null,
        phone: phone.trim()
      });
      alert('¡Perfil actualizado con éxito!');
      setScreen('dashboard');
    } catch (error) {
      console.error(error);
      alert('Error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await signOut(auth);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-20 bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back_ios_new</span>
          </button>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Mi Perfil</h2>
        </div>
      </header>

      <main className="p-6 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="size-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-5xl text-slate-400">person</span>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 size-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-xl">photo_camera</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black">{profile?.name}</h3>
            <p className="text-slate-500 text-sm font-medium">{profile?.email}</p>
          </div>
        </div>

        <section className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="space-y-2 px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número de Teléfono</label>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl h-12 px-4 font-bold text-sm focus:ring-2 focus:ring-primary"
                placeholder="+58 412 0000000"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700 pt-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Torre / Unidad</span>
                <span className="font-bold text-sm">{profile?.unit || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apartamento</span>
                <span className="font-bold text-sm">{profile?.apt || 'N/A'}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-3">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
            {!loading && <span className="material-symbols-outlined">save</span>}
          </button>
          
          <button 
            onClick={handleLogoutClick}
            className="w-full h-14 bg-white dark:bg-slate-800 text-danger border border-danger/20 font-bold rounded-2xl flex items-center justify-center gap-2 active:bg-danger/5 transition-all"
          >
            Cerrar Sesión
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProfileEdit;