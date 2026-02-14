import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, orderBy } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  setScreen: (screen: string) => void;
}

const MonthlyReport: React.FC<Props> = ({ setScreen }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [income, setIncome] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Para registrar nuevo gasto
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ desc: '', amount: '' });

  // 1. CARGAR DATA (Ingresos por Recibos Pagados y Gastos Registrados)
  const fetchData = async () => {
    setLoading(true);
    try {
      // A) INGRESOS: Buscar recibos PAGADOS del mes seleccionado
      // Nota: En un caso real, filtraríamos por fecha exacta. Aquí traigo todos para el demo.
      const qIncome = query(collection(db, 'receipts'), where('status', '==', 'PAGADO'));
      const snapIncome = await getDocs(qIncome);
      const incomeData = snapIncome.docs
        .map(d => ({...d.data(), type: 'INGRESO'}))
        .filter((d: any) => d.period === currentMonth); // Filtrado manual simple
      setIncome(incomeData);

      // B) EGRESOS: Buscar gastos registrados
      const qExpenses = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
      const snapExpenses = await getDocs(qExpenses);
      const expenseData = snapExpenses.docs
        .map(d => ({...d.data(), type: 'EGRESO'}))
        .filter((d: any) => d.date?.startsWith(currentMonth));
      setExpenses(expenseData);

    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [currentMonth]);

  // 2. CALCULAR TOTALES
  const totalIncome = income.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const balance = totalIncome - totalExpenses;

  // 3. REGISTRAR UN GASTO (Para que aparezca en el reporte)
  const handleAddExpense = async () => {
    if (!newExpense.desc || !newExpense.amount) return alert("Llena los datos");
    await addDoc(collection(db, 'expenses'), {
        description: newExpense.desc,
        amount: Number(newExpense.amount),
        date: currentMonth + '-15', // Fecha simulada en el mes
        createdAt: Timestamp.now()
    });
    setNewExpense({ desc: '', amount: '' });
    setShowExpenseForm(false);
    fetchData(); // Recargar
  };

  // 4. GENERAR PDF
  const printReport = () => {
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFillColor(30, 58, 138); doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text("BALANCE CONTABLE MENSUAL", 105, 12, { align: "center" });
    doc.setFontSize(12); doc.text(`Periodo: ${currentMonth}`, 105, 20, { align: "center" });

    // Resumen
    doc.setTextColor(0,0,0);
    doc.text(`INGRESOS TOTALES: $${totalIncome.toFixed(2)}`, 14, 40);
    doc.text(`EGRESOS TOTALES:   $${totalExpenses.toFixed(2)}`, 14, 46);
    doc.setFont("helvetica", "bold");
    doc.text(`BALANCE NETO:      $${balance.toFixed(2)}`, 14, 54);

    // Tabla Ingresos
    doc.text("DETALLE DE INGRESOS (Cobranza)", 14, 65);
    autoTable(doc, {
        startY: 68,
        head: [['Unidad', 'Concepto', 'Monto']],
        body: income.map(i => [i.unit, 'Pago Recibo', `$${i.totalAmount}`]),
        theme: 'grid', styles: { fontSize: 8 }
    });

    // Tabla Egresos
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text("DETALLE DE GASTOS OPERATIVOS", 14, finalY);
    autoTable(doc, {
        startY: finalY + 3,
        head: [['Descripción', 'Monto']],
        body: expenses.map(e => [e.description, `$${e.amount}`]),
        theme: 'striped', styles: { fontSize: 8 }, headStyles: { fillColor: [200, 0, 0] }
    });

    doc.save(`Balance_${currentMonth}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setScreen('dashboard')} className="p-2 rounded-full bg-slate-800"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-xl font-black uppercase text-blue-400">Finanzas</h1>
      </div>

      {/* SELECTOR MES */}
      <div className="bg-slate-800 p-4 rounded-xl flex items-center justify-between mb-6 border border-slate-700">
        <span className="font-bold text-sm text-slate-400">Mes a Consultar:</span>
        <input 
            type="month" 
            value={currentMonth} 
            onChange={e => setCurrentMonth(e.target.value)}
            className="bg-slate-900 text-white font-bold p-2 rounded-lg border border-slate-600"
        />
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/30 text-center">
            <p className="text-[10px] uppercase font-bold text-green-400">Ingresos</p>
            <p className="text-xl font-black text-white">${totalIncome}</p>
        </div>
        <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/30 text-center">
            <p className="text-[10px] uppercase font-bold text-red-400">Egresos</p>
            <p className="text-xl font-black text-white">${totalExpenses}</p>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-2xl border border-slate-600 text-center">
            <p className="text-[10px] uppercase font-bold text-blue-400">Balance</p>
            <p className={`text-xl font-black ${balance >= 0 ? 'text-blue-300' : 'text-red-400'}`}>${balance}</p>
        </div>
      </div>

      {/* LISTA DE MOVIMIENTOS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm uppercase">Movimientos del Mes</h3>
            <button onClick={() => setShowExpenseForm(true)} className="text-xs bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">add</span> Registrar Gasto
            </button>
        </div>

        {loading ? <p className="text-center text-slate-500">Calculando...</p> : (
            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                {/* COMBINAMOS Y ORDENAMOS PARA MOSTRAR TODO JUNTO */}
                {[...income, ...expenses].map((item, i) => (
                    <div key={i} className="flex justify-between p-4 border-b border-slate-700 last:border-0">
                        <div>
                            <p className="font-bold text-sm text-white">{item.type === 'INGRESO' ? `Pago Apto ${item.unit}` : item.description}</p>
                            <p className="text-[10px] text-slate-400 uppercase">{item.type}</p>
                        </div>
                        <span className={`font-black ${item.type === 'INGRESO' ? 'text-green-400' : 'text-red-400'}`}>
                            {item.type === 'INGRESO' ? '+' : '-'}${item.amount || item.totalAmount}
                        </span>
                    </div>
                ))}
                {[...income, ...expenses].length === 0 && <p className="p-4 text-center text-sm text-slate-500">Sin movimientos este mes.</p>}
            </div>
        )}
      </div>

      {/* BOTÓN IMPRIMIR */}
      <button onClick={printReport} className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold animate-bounce-slow">
        <span className="material-symbols-outlined">print</span>
        Imprimir PDF
      </button>

      {/* MODAL NUEVO GASTO */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700">
                <h3 className="text-lg font-black text-white mb-4">Registrar Egreso</h3>
                <input 
                    placeholder="Descripción (ej. Compra Bombillos)" 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 mb-3 text-white"
                    value={newExpense.desc}
                    onChange={e => setNewExpense({...newExpense, desc: e.target.value})}
                />
                <input 
                    type="number" 
                    placeholder="Monto ($)" 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 mb-4 text-white"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                />
                <div className="flex gap-2">
                    <button onClick={() => setShowExpenseForm(false)} className="flex-1 bg-slate-700 py-3 rounded-lg font-bold text-slate-300">Cancelar</button>
                    <button onClick={handleAddExpense} className="flex-1 bg-red-600 py-3 rounded-lg font-bold text-white">Guardar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyReport;