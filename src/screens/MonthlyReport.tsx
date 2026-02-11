
import React, { useState, useRef } from 'react';
import { ExpenseItem, IncomeItem } from '../types';

interface Props {
  setScreen: (s: string) => void;
}

const MonthlyReport: React.FC<Props> = ({ setScreen }) => {
  const [activeTab, setActiveTab] = useState<'ingresos' | 'egresos'>('ingresos');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [incomeList] = useState<IncomeItem[]>([
    { id: 'i1', source: 'Propiedad', description: 'Pago Apto 101 - J. Pérez', amount: 45.00, date: '2023-11-01', unit: '101' },
    { id: 'i2', source: 'Local', description: 'Alquiler Local #1 (Farmacia)', amount: 450.00, date: '2023-11-05' },
    { id: 'i3', source: 'Caney', description: 'Reserva Caney - Apto 302', amount: 25.00, date: '2023-11-08' },
    { id: 'i4', source: 'Local', description: 'Alquiler Local #4 (Mini Market)', amount: 320.00, date: '2023-11-10' },
    { id: 'i5', source: 'Propiedad', description: 'Pago Apto 205 - C. García', amount: 45.00, date: '2023-11-12', unit: '205' },
  ]);

  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([
    { id: 'e1', name: 'Reparación de Portón Eléctrico', amount: 120.00, invoicePhoto: 'https://i.postimg.cc/G2dCR0gq/image.png' },
    { id: 'e2', name: 'Compra de Bombillos Pasillo', amount: 45.50, invoicePhoto: 'https://i.postimg.cc/G2dCR0gq/image.png' }
  ]);

  const [newExpense, setNewExpense] = useState({ name: '', amount: '', photo: null as string | null });

  const handleAddExpense = () => {
    if (!newExpense.name || !newExpense.amount || !newExpense.photo) {
      alert("Por favor complete todos los datos y cargue el soporte fotográfico.");
      return;
    }
    const item: ExpenseItem = {
      id: Date.now().toString(),
      name: newExpense.name,
      amount: parseFloat(newExpense.amount),
      invoicePhoto: newExpense.photo
    };
    setExpensesList([item, ...expensesList]);
    setIsAddingExpense(false);
    setNewExpense({ name: '', amount: '', photo: null });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewExpense({ ...newExpense, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const totalIncome = incomeList.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expensesList.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col min-h-full pb-20 bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 bg-slate-900 text-white p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setScreen('dashboard')} className="size-10 flex items-center justify-center rounded-full bg-white/10">
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <h2 className="text-lg font-black tracking-tight">Caja Noviembre 2023</h2>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-white/40">Balance Neto</p>
            <p className="text-xl font-black text-emerald-400">${(totalIncome - totalExpenses).toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl">
          <button onClick={() => setActiveTab('ingresos')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'ingresos' ? 'bg-emerald-500 text-white shadow-lg' : 'text-white/40'}`}>Ingresos Totales</button>
          <button onClick={() => setActiveTab('egresos')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'egresos' ? 'bg-rose-500 text-white shadow-lg' : 'text-white/40'}`}>Egresos Totales</button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {activeTab === 'ingresos' ? (
          <section className="space-y-6 animate-in fade-in slide-in-from-left-4">
             {/* Resumen de Fuentes */}
             <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Aptos', val: incomeList.filter(i => i.source === 'Propiedad').reduce((a,c)=>a+c.amount,0), color: 'text-primary' },
                  { label: 'Locales', val: incomeList.filter(i => i.source === 'Local').reduce((a,c)=>a+c.amount,0), color: 'text-purple-500' },
                  { label: 'Caney', val: incomeList.filter(i => i.source === 'Caney').reduce((a,c)=>a+c.amount,0), color: 'text-amber-500' }
                ].map((cat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{cat.label}</p>
                    <p className={`text-sm font-black ${cat.color}`}>${cat.val.toFixed(0)}</p>
                  </div>
                ))}
             </div>

             <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Listado de Ingresos</h3>
                {incomeList.map(income => (
                  <div key={income.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                     <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${income.source === 'Local' ? 'bg-purple-500/10 text-purple-500' : income.source === 'Caney' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                           <span className="material-symbols-outlined">{income.source === 'Local' ? 'store' : income.source === 'Caney' ? 'deck' : 'person'}</span>
                        </div>
                        <div>
                           <p className="text-sm font-black leading-none truncate max-w-[180px]">{income.description}</p>
                           <p className="text-[9px] font-bold text-slate-500 uppercase mt-1.5">{income.date} • {income.source}</p>
                        </div>
                     </div>
                     <p className="text-sm font-black text-emerald-500">+${income.amount.toFixed(2)}</p>
                  </div>
                ))}
             </div>
          </section>
        ) : (
          <section className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {!isAddingExpense ? (
              <button 
                onClick={() => setIsAddingExpense(true)}
                className="w-full bg-slate-900 dark:bg-slate-800 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl"
              >
                <span className="material-symbols-outlined">add_photo_alternate</span>
                Registrar Nuevo Egreso
              </button>
            ) : (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-2 border-rose-500 shadow-2xl space-y-4 animate-in zoom-in-95">
                <h3 className="text-sm font-black uppercase tracking-widest text-rose-500">Nuevo Gasto Común</h3>
                <div className="space-y-3">
                  <input 
                    placeholder="Descripción (Ej: Bombillos)" 
                    value={newExpense.name} 
                    onChange={e => setNewExpense({...newExpense, name: e.target.value})}
                    className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl h-12 px-4 text-sm font-bold" 
                  />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input 
                      type="number" 
                      placeholder="Monto" 
                      value={newExpense.amount} 
                      onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                      className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl h-12 pl-8 pr-4 text-sm font-bold" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${newExpense.photo ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600' : 'border-slate-300 dark:border-slate-700 text-slate-400'}`}
                    >
                      {newExpense.photo ? (
                        <>
                          <span className="material-symbols-outlined text-3xl">check_circle</span>
                          <span className="text-[10px] font-black uppercase tracking-widest mt-1">Soporte Cargado</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                          <span className="text-[10px] font-black uppercase tracking-widest mt-1">Adjuntar Factura</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsAddingExpense(false)} className="flex-1 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl font-bold text-xs uppercase">Cerrar</button>
                  <button onClick={handleAddExpense} className="flex-[2] h-12 bg-rose-500 text-white rounded-xl font-black text-xs uppercase">Guardar Egreso</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Egresos del Mes</h3>
              {expensesList.map(ex => (
                <div key={ex.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm group">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative cursor-pointer">
                      <img src={ex.invoicePhoto} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-sm">zoom_in</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-black leading-none">{ex.name}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Factura verificada</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-rose-500">-${ex.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default MonthlyReport;