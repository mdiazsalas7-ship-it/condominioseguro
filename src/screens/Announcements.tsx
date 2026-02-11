
import React, { useState } from 'react';
import { UserRole, Announcement } from '../types';

interface Props {
  setScreen: (s: string) => void;
  role: UserRole;
}

const Announcements: React.FC<Props> = ({ setScreen, role }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Asamblea Extraordinaria',
      content: 'Se convoca a todos los propietarios a la asamblea este sábado para discutir el presupuesto del nuevo año y la reparación de la bomba de agua.',
      date: 'Sáb, 15 Dic - 6:00 PM',
      type: 'Asamblea',
      author: 'Administración'
    },
    {
      id: '2',
      title: 'Mantenimiento de Ascensores',
      content: 'El ascensor de la Torre A estará fuera de servicio mañana desde las 9 AM hasta las 3 PM por mantenimiento preventivo.',
      date: 'Mañana, 09:00 AM',
      type: 'Comunicado',
      author: 'Mantenimiento'
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newAnn, setNewAnn] = useState<Partial<Announcement>>({ type: 'Comunicado' });

  const handleCreate = () => {
    if (!newAnn.title || !newAnn.content) return;
    const item: Announcement = {
      id: Date.now().toString(),
      title: newAnn.title,
      content: newAnn.content,
      date: new Date().toLocaleDateString(),
      type: (newAnn.type as any) || 'Comunicado',
      author: 'Administración'
    };
    setAnnouncements([item, ...announcements]);
    setIsCreating(false);
    setNewAnn({ type: 'Comunicado' });
  };

  return (
    <div className="flex flex-col min-h-full pb-20">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back_ios_new</span>
          </button>
          <h2 className="text-lg font-black tracking-tight">Anuncios</h2>
        </div>
        {role === UserRole.ADMIN && (
          <div className="flex gap-2">
            <button 
              onClick={() => setScreen('surveys')}
              className="bg-primary/10 text-primary p-2 px-3 rounded-xl flex items-center gap-1 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">poll</span>
              <span className="text-[10px] font-black uppercase">Votaciones</span>
            </button>
            {!isCreating && (
              <button 
                onClick={() => setIsCreating(true)}
                className="bg-primary text-white p-2 rounded-xl flex items-center gap-1 shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span className="text-[10px] font-black uppercase">Nuevo</span>
              </button>
            )}
          </div>
        )}
      </header>

      <main className="p-4 space-y-6">
        {isCreating ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-primary/30 shadow-2xl animate-in slide-in-from-bottom-4 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Crear Comunicado</h3>
            <div className="space-y-4">
              <input 
                placeholder="Título del anuncio" 
                value={newAnn.title || ''}
                onChange={e => setNewAnn({...newAnn, title: e.target.value})}
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl h-12 px-4 font-bold text-sm focus:ring-2 focus:ring-primary"
              />
              <textarea 
                placeholder="Contenido del mensaje..." 
                rows={4}
                value={newAnn.content || ''}
                onChange={e => setNewAnn({...newAnn, content: e.target.value})}
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-4 font-medium text-sm focus:ring-2 focus:ring-primary resize-none"
              />
              <select 
                value={newAnn.type}
                onChange={e => setNewAnn({...newAnn, type: e.target.value as any})}
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl h-12 px-4 font-bold text-sm focus:ring-2 focus:ring-primary appearance-none"
              >
                <option value="Comunicado">Comunicado General</option>
                <option value="Asamblea">Convocatoria Asamblea</option>
                <option value="Urgente">Aviso Urgente</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsCreating(false)} className="flex-1 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl font-bold text-xs">Cancelar</button>
              <button onClick={handleCreate} className="flex-[2] h-12 bg-primary text-white rounded-xl font-black uppercase text-xs">Publicar</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(ann => (
              <div key={ann.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border-l-4 shadow-sm border border-slate-200 dark:border-slate-800 ${ann.type === 'Asamblea' ? 'border-l-primary' : ann.type === 'Urgente' ? 'border-l-danger' : 'border-l-slate-400'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ann.type === 'Asamblea' ? 'bg-primary/10 text-primary' : ann.type === 'Urgente' ? 'bg-danger/10 text-danger' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>
                    {ann.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{ann.date}</span>
                </div>
                <h3 className="text-base font-black leading-tight mb-2">{ann.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{ann.content}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                  <p className="text-[10px] font-bold text-slate-400">Por: {ann.author}</p>
                  <button className="text-primary text-[10px] font-black uppercase tracking-widest">Leer completo</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Announcements;