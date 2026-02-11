
import React, { useState } from 'react';
import { UserRole, Survey } from '../types';

interface Props {
  setScreen: (s: string) => void;
  role: UserRole;
}

const Surveys: React.FC<Props> = ({ setScreen, role }) => {
  const [surveys, setSurveys] = useState<Survey[]>([
    {
      id: '1',
      question: '¿Qué color prefieres para pintar la fachada principal?',
      options: [
        { id: 'o1', text: 'Gris Grafito', votes: 45 },
        { id: 'o2', text: 'Azul Mediterráneo', votes: 12 },
        { id: 'o3', text: 'Beige Arena', votes: 31 }
      ],
      totalVotes: 88,
      expiresAt: '2024-12-20'
    }
  ]);

  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newSurvey, setNewSurvey] = useState({ question: '', options: ['', ''] });

  const handleVote = (surveyId: string, optionId: string) => {
    if (votedIds.has(surveyId)) return;
    setSurveys(prev => prev.map(s => {
      if (s.id === surveyId) {
        return {
          ...s,
          totalVotes: s.totalVotes + 1,
          options: s.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
        };
      }
      return s;
    }));
    setVotedIds(new Set(votedIds).add(surveyId));
  };

  const createSurvey = () => {
    if (!newSurvey.question || newSurvey.options.some(o => !o)) return;
    const s: Survey = {
      id: Date.now().toString(),
      question: newSurvey.question,
      options: newSurvey.options.map((o, i) => ({ id: `opt-${i}`, text: o, votes: 0 })),
      totalVotes: 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    setSurveys([s, ...surveys]);
    setIsCreating(false);
    setNewSurvey({ question: '', options: ['', ''] });
  };

  return (
    <div className="flex flex-col min-h-full pb-20">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back_ios_new</span>
          </button>
          <h2 className="text-lg font-black tracking-tight">Encuestas</h2>
        </div>
        {role === UserRole.ADMIN && !isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-primary text-white p-2 rounded-xl flex items-center gap-1 shadow-lg shadow-primary/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="text-[10px] font-black uppercase">Nueva</span>
          </button>
        )}
      </header>

      <main className="p-4 space-y-6">
        {isCreating ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-primary/30 shadow-2xl space-y-4 animate-in zoom-in-95">
             <h3 className="text-sm font-black uppercase tracking-widest text-primary">Nueva Encuesta</h3>
             <input 
              placeholder="¿Cuál es la pregunta?" 
              value={newSurvey.question}
              onChange={e => setNewSurvey({...newSurvey, question: e.target.value})}
              className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl h-12 px-4 font-bold text-sm focus:ring-2 focus:ring-primary"
            />
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Opciones</p>
              {newSurvey.options.map((opt, i) => (
                <input 
                  key={i}
                  placeholder={`Opción ${i + 1}`} 
                  value={opt}
                  onChange={e => {
                    const newOpts = [...newSurvey.options];
                    newOpts[i] = e.target.value;
                    setNewSurvey({...newSurvey, options: newOpts});
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl h-10 px-4 text-xs font-bold focus:ring-2 focus:ring-primary"
                />
              ))}
              <button 
                onClick={() => setNewSurvey({...newSurvey, options: [...newSurvey.options, '']})}
                className="text-primary text-[10px] font-black uppercase px-1 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span> Añadir Opción
              </button>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsCreating(false)} className="flex-1 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl font-bold text-xs">Cancelar</button>
              <button onClick={createSurvey} className="flex-[2] h-12 bg-primary text-white rounded-xl font-black uppercase text-xs">Crear Encuesta</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {surveys.map(survey => {
              const hasVoted = votedIds.has(survey.id);
              return (
                <div key={survey.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-black leading-tight max-w-[80%]">{survey.question}</h3>
                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">Activa</span>
                  </div>

                  <div className="space-y-3">
                    {survey.options.map(opt => {
                      const percentage = survey.totalVotes > 0 ? Math.round((opt.votes / survey.totalVotes) * 100) : 0;
                      return (
                        <button 
                          key={opt.id}
                          disabled={hasVoted}
                          onClick={() => handleVote(survey.id, opt.id)}
                          className={`relative w-full overflow-hidden rounded-2xl border transition-all h-14 ${hasVoted ? 'border-transparent bg-slate-50 dark:bg-slate-900/40 cursor-default' : 'border-slate-200 dark:border-slate-800 active:border-primary active:scale-[0.98]'}`}
                        >
                          {hasVoted && (
                            <div 
                              className="absolute top-0 left-0 h-full bg-primary/10 transition-all duration-1000 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          )}
                          <div className="relative z-10 px-4 flex justify-between items-center h-full">
                            <span className="text-xs font-bold">{opt.text}</span>
                            {hasVoted && (
                              <span className="text-[10px] font-black text-primary">{percentage}%</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <span className="material-symbols-outlined text-sm">how_to_reg</span>
                      {survey.totalVotes} Votos totales
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vence: {survey.expiresAt}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Surveys;