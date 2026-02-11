import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

interface Props {
  setScreen: (s: string) => void;
}

const CreateReceipt: React.FC<Props> = ({ setScreen }) => {
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase());
  
  // --- ESTADOS DE MONEDA Y TASA ---
  const [rate, setRate] = useState<number>(0); 
  const [fetchingRate, setFetchingRate] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD'); // Switch Global
  
  // --- VARIABLES FINANCIERAS ---
  const [totalUnits, setTotalUnits] = useState(100); 
  const [reserveFundPerc, setReserveFundPerc] = useState<number>(10); // % Fondo Reserva
  const [discountPerc, setDiscountPerc] = useState<number>(5); // % Pronto Pago
  const [discountDeadline, setDiscountDeadline] = useState<string>('');

  // --- GASTOS ---
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Inputs temporales
  const [desc, setDesc] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [expenseType, setExpenseType] = useState<'FIXED' | 'VARIABLE'>('FIXED');

  // 1. CARGAR TASA BCV AUTOMÁTICA
  useEffect(() => {
    const fetchBCV = async () => {
      setFetchingRate(true);
      try {
        const response = await axios.get('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/page?page=bcv');
        const price = response.data.monitors.usd.price;
        setRate(price);
      } catch (error) {
        console.error("Error API BCV", error);
        alert("No se pudo conectar con BCV. Ingresa la tasa manual.");
      } finally {
        setFetchingRate(false);
      }
    };
    fetchBCV();
  }, []);

  // --- HELPER: FORMATEAR MONEDA VISUAL ---
  const formatMoney = (amountInUSD: number) => {
    if (currency === 'USD') {
      return `$${amountInUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    } else {
      const val = rate > 0 ? amountInUSD * rate : 0;
      return `Bs. ${val.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
    }
  };

  // --- AGREGAR GASTO (INTELIGENTE) ---
  const addExpense = () => {
    if (!desc || !amountInput) return alert("Faltan datos");
    
    let val = parseFloat(amountInput);
    
    // Si el admin escribe en Bolívares, lo guardamos en Dólares internamente
    if (currency === 'VES') {
      if (rate <= 0) return alert("Define la Tasa BCV primero");
      val = val / rate;
    }

    const newExp: Expense = {
      id: Date.now().toString(),
      description: desc,
      amount: val, // Siempre guardamos USD base
      type: expenseType,
      status: 'PENDING', // Nace pendiente de pago
    };

    setExpenses([...expenses, newExp]);
    setDesc('');
    setAmountInput('');
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  // --- MOTOR DE CÁLCULO (Todo en USD Base) ---
  const fixedTotal = expenses.filter(e => e.type === 'FIXED').reduce((acc, c) => acc + c.amount, 0);
  const variableTotal = expenses.filter(e => e.type === 'VARIABLE').reduce((acc, c) => acc + c.amount, 0);
  
  // 1. Subtotal Gastos
  const subtotalExpenses = fixedTotal + variableTotal;
  
  // 2. Fondo de Reserva (Calculado sobre el subtotal)
  const reserveAmount = subtotalExpenses * (reserveFundPerc / 100);
  
  // 3. Total a Recaudar
  const grandTotal = subtotalExpenses + reserveAmount;
  
  // 4. Cuota Normal por Apartamento
  const quotaNormal = totalUnits > 0 ? grandTotal / totalUnits : 0;
  
  // 5. Cuota Pronto Pago (Descuento sobre la cuota normal)
  const discountAmount = quotaNormal * (discountPerc / 100);
  const quotaDiscounted = quotaNormal - discountAmount;

  // --- GUARDAR EN FIREBASE ---
  const handlePublish = async () => {
    if (rate <= 0) return alert("Falta Tasa BCV");
    if (subtotalExpenses === 0) return alert("No hay gastos");
    if (discountPerc > 0 && !discountDeadline) return alert("Falta fecha tope del descuento");

    if (!confirm(`¿Publicar Recibo?\n\nTotal: ${formatMoney(grandTotal)}\nCuota Apto: ${formatMoney(quotaNormal)}`)) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'monthly_receipts'), {
        month,
        year: new Date().getFullYear(),
        exchangeRate: rate,
        expenses,
        
        // Variables Configuración
        totalUnits,
        reserveFundPerc,
        earlyPaymentPercent: discountPerc,
        earlyPaymentDeadline: discountDeadline,

        // Totales Calculados (Snapshot en USD)
        subtotalExpenses,
        reserveFundAmount: reserveAmount,
        totalToCollect: grandTotal,
        quotaNormal,
        quotaWithDiscount: quotaDiscounted,

        status: 'OPEN',
        createdAt: new Date().toISOString()
      });
      alert("✅ Recibo Publicado");
      setScreen('dashboard');
    } catch (e) {
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  // --- PDF HÍBRIDO ---
  const generatePreviewPDF = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    doc.setFontSize(16); doc.text(`AVISO DE COBRO - ${month}`, 14, 20);
    doc.setFontSize(10); doc.text(`Tasa BCV: Bs. ${rate.toFixed(2)}`, 14, 28);

    doc.autoTable({
      startY: 35,
      head: [['Concepto', 'USD', 'Bolívares']],
      body: [
        ['Total Gastos', `$${subtotalExpenses.toFixed(2)}`, `Bs. ${(subtotalExpenses * rate).toLocaleString('es-VE', {minimumFractionDigits:2})}`],
        [`Fondo Reserva (${reserveFundPerc}%)`, `$${reserveAmount.toFixed(2)}`, `Bs. ${(reserveAmount * rate).toLocaleString('es-VE', {minimumFractionDigits:2})}`],
        ['TOTAL A RECAUDAR', `$${grandTotal.toFixed(2)}`, `Bs. ${(grandTotal * rate).toLocaleString('es-VE', {minimumFractionDigits:2})}`],
        ['', '', ''],
        ['CUOTA POR APTO', `$${quotaNormal.toFixed(2)}`, `Bs. ${(quotaNormal * rate).toLocaleString('es-VE', {minimumFractionDigits:2})}`],
        [`PRONTO PAGO (-${discountPerc}%)`, `$${quotaDiscounted.toFixed(2)}`, `Bs. ${(quotaDiscounted * rate).toLocaleString('es-VE', {minimumFractionDigits:2})}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Detalle Gastos
    const expensesData = expenses.map(e => [e.type, e.description, `$${e.amount.toFixed(2)}`, `Bs. ${(e.amount * rate).toLocaleString('es-VE', {minimumFractionDigits:2})}`]);
    doc.text("Detalle de Gastos:", 14, (doc as any).lastAutoTable.finalY + 10);
    doc.autoTable({
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Tipo', 'Descripción', 'USD', 'Bs']],
      body: expensesData,
    });

    doc.save(`Recibo_${month}.pdf`);
  };

  return (
    <div className="flex flex-col min-h-full pb-32 bg-slate-50 dark:bg-slate-900">
      
      {/* HEADER: SWITCH MONEDA + TASA */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setScreen('dashboard')} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-600 dark:text-white">arrow_back</span>
            </button>
            <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase">Recibo {month}</h1>
          </div>
          <button onClick={generatePreviewPDF} className="text-red-500 bg-red-50 p-2 rounded-lg"><span className="material-symbols-outlined">picture_as_pdf</span></button>
        </div>

        <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {/* SWITCH USD/BS */}
          <div className="flex bg-white dark:bg-slate-700 rounded-lg p-1 shadow-sm">
            <button onClick={() => setCurrency('USD')} className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${currency === 'USD' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>USD $</button>
            <button onClick={() => setCurrency('VES')} className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${currency === 'VES' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>BS.</button>
          </div>

          {/* TASA BCV */}
          <div className="flex flex-col items-end px-2">
            <div className="flex items-center gap-1">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Tasa BCV</label>
              {fetchingRate && <span className="size-2 bg-blue-500 rounded-full animate-ping"></span>}
            </div>
            <input 
              type="number" value={rate || ''} onChange={e => setRate(parseFloat(e.target.value))} placeholder="0.00" 
              className="bg-transparent border-none p-0 h-5 w-20 text-right font-black text-sm text-emerald-600 focus:ring-0"
            />
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        
        {/* 1. TARJETA RESUMEN FINANCIERO */}
        <div className={`rounded-3xl p-5 text-white shadow-xl transition-colors duration-300 ${currency === 'USD' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
          <div className="flex justify-between text-[10px] font-bold uppercase opacity-80 mb-1">
            <span>Gastos</span>
            <span>+ Reserva ({reserveFundPerc}%)</span>
          </div>
          <div className="flex justify-between text-lg font-black mb-4 border-b border-white/20 pb-4">
            <span>{formatMoney(subtotalExpenses)}</span>
            <span>{formatMoney(reserveAmount)}</span>
          </div>

          <div className="text-right mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Edificio</p>
            <p className="text-3xl font-black">{formatMoney(grandTotal)}</p>
          </div>

          <div className="bg-black/20 rounded-2xl p-3 flex justify-between items-center">
            <div>
              <p className="text-[9px] font-bold uppercase opacity-70">Cuota Normal</p>
              <p className="text-lg font-bold">{formatMoney(quotaNormal)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase text-yellow-300 flex items-center justify-end gap-1">
                Pronto Pago <span className="bg-white text-black px-1 rounded text-[8px]">-{discountPerc}%</span>
              </p>
              <p className="text-2xl font-black text-yellow-300">{formatMoney(quotaDiscounted)}</p>
            </div>
          </div>
        </div>

        {/* 2. CONFIGURACIÓN */}
        <section className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Parámetros</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] text-slate-500 block font-bold">Aptos</label>
              <input type="number" value={totalUnits} onChange={e => setTotalUnits(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg h-9 text-center text-sm font-bold" />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block font-bold">Reserva %</label>
              <input type="number" value={reserveFundPerc} onChange={e => setReserveFundPerc(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg h-9 text-center text-sm font-bold" />
            </div>
            <div>
              <label className="text-[9px] text-emerald-600 block font-bold">Desc. %</label>
              <input type="number" value={discountPerc} onChange={e => setDiscountPerc(Number(e.target.value))} className="w-full bg-emerald-50 dark:bg-emerald-900/10 border-none rounded-lg h-9 text-center text-sm font-bold text-emerald-600" />
            </div>
          </div>
          {discountPerc > 0 && (
            <div>
              <label className="text-[9px] text-emerald-600 block font-bold">Vencimiento Descuento</label>
              <input type="date" value={discountDeadline} onChange={e => setDiscountDeadline(e.target.value)} className="w-full bg-emerald-50 dark:bg-emerald-900/10 border-none rounded-lg h-9 px-3 text-xs font-bold uppercase text-emerald-700" />
            </div>
          )}
        </section>

        {/* 3. INPUT GASTOS (ADAPTABLE) */}
        <section className="space-y-3">
          <div className="flex gap-2">
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción" className="flex-[2] bg-white dark:bg-slate-800 border-none rounded-xl h-11 px-4 text-xs font-bold shadow-sm" />
            <div className="flex-1 relative">
              <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black ${currency === 'USD' ? 'text-blue-500' : 'text-emerald-500'}`}>{currency === 'USD' ? '$' : 'Bs'}</span>
              <input type="number" value={amountInput} onChange={e => setAmountInput(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-none rounded-xl h-11 pl-6 pr-2 text-right text-xs font-black shadow-sm" placeholder="0" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setExpenseType('FIXED'); addExpense() }} className="flex-1 bg-blue-600 text-white h-9 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all">Fijo</button>
            <button onClick={() => { setExpenseType('VARIABLE'); addExpense() }} className="flex-1 bg-orange-500 text-white h-9 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all">Variable</button>
          </div>
        </section>

        {/* 4. LISTA GASTOS */}
        <section className="space-y-4">
          {expenses.some(e => e.type === 'FIXED') && (
            <div>
              <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-widest px-1 mb-1">Fijos</h4>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {expenses.filter(e => e.type === 'FIXED').map(item => (
                  <div key={item.id} className="flex justify-between p-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-white">{item.description}</span>
                    <div className="flex gap-3">
                      <span className="font-black text-slate-900 dark:text-white">{formatMoney(item.amount)}</span>
                      <button onClick={() => removeExpense(item.id)} className="text-red-400 material-symbols-outlined text-sm">delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {expenses.some(e => e.type === 'VARIABLE') && (
            <div>
              <h4 className="text-[9px] font-black text-orange-600 uppercase tracking-widest px-1 mb-1">Variables</h4>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {expenses.filter(e => e.type === 'VARIABLE').map(item => (
                  <div key={item.id} className="flex justify-between p-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-white">{item.description}</span>
                    <div className="flex gap-3">
                      <span className="font-black text-slate-900 dark:text-white">{formatMoney(item.amount)}</span>
                      <button onClick={() => removeExpense(item.id)} className="text-red-400 material-symbols-outlined text-sm">delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <button onClick={handlePublish} disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 mt-4">
          {loading ? 'Generando...' : 'Publicar Recibo'}
        </button>

      </main>
    </div>
  );
};

export default CreateReceipt;