import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  setScreen: (screen: string) => void;
}

// Interfaz que coincide con cómo guardas los recibos
interface Receipt {
  id: string;
  unit: string; // Número de apto
  period: string; // Ej: "2025-10"
  totalAmount: number;
  status: 'PENDIENTE' | 'PAGADO';
  createdAt: any;
  items: { concept: string; amount: number }[]; // Desglose
}

const ReceiptHistoryAdmin: React.FC<Props> = ({ setScreen }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');

  // 1. CARGAR RECIBOS DE FIREBASE
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        // Traemos todos ordenados por fecha de creación
        const q = query(collection(db, 'receipts'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Receipt[];
        setReceipts(data);
      } catch (error) {
        console.error("Error cargando recibos:", error);
        // DATOS DE PRUEBA SI NO HAY NADA EN DB AÚN
        setReceipts([
            {
                id: 'demo-1', unit: '1-A', period: '2023-10', totalAmount: 45.00, status: 'PENDIENTE', createdAt: new Date(),
                items: [{ concept: 'Condominio', amount: 40 }, { concept: 'Reserva', amount: 5 }]
            },
            {
                id: 'demo-2', unit: '2-B', period: '2023-09', totalAmount: 42.00, status: 'PAGADO', createdAt: new Date(),
                items: [{ concept: 'Condominio', amount: 42 }]
            }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, []);

  // 2. FUNCIÓN PARA GENERAR E IMPRIMIR PDF
  const printReceipt = (rec: Receipt) => {
    const doc = new jsPDF();

    // -- ENCABEZADO --
    doc.setFillColor(30, 58, 138); // Azul oscuro
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO DE CONDOMINIO", 105, 18, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Residencias El Parque", 105, 28, { align: "center" });

    // -- DATOS DEL APTO --
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Unidad: ${rec.unit}`, 14, 50);
    doc.text(`Periodo: ${rec.period}`, 14, 56);
    
    const statusColor = rec.status === 'PAGADO' ? [0, 128, 0] : [200, 0, 0];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`ESTADO: ${rec.status}`, 150, 50);

    // -- TABLA DE CONCEPTOS --
    const tableBody = rec.items.map(item => [item.concept, `$${item.amount.toFixed(2)}`]);
    
    autoTable(doc, {
      startY: 65,
      head: [['Concepto', 'Monto']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 10 },
    });

    // -- TOTAL --
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL A PAGAR: $${rec.totalAmount.toFixed(2)}`, 140, finalY);

    // -- PIE DE PÁGINA --
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text("Este recibo es un comprobante digital generado por el Sistema de Gestión.", 105, 280, { align: "center" });

    // Descargar
    doc.save(`Recibo_${rec.unit}_${rec.period}.pdf`);
  };

  // Filtrado simple por texto (mes o unidad)
  const filteredReceipts = receipts.filter(r => 
    r.period.includes(filterMonth) || r.unit.toLowerCase().includes(filterMonth.toLowerCase())
  );

  if (loading) return <div className="p-10 text-white text-center">Cargando historial...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 pb-20">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setScreen('dashboard')} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-blue-400">Historial de Recibos</h1>
          <p className="text-sm text-slate-400">Consulta y reimpresión de cobros generados</p>
        </div>
      </div>

      {/* FILTRO */}
      <div className="mb-6 bg-slate-800 p-4 rounded-xl flex gap-4 border border-slate-700">
        <div className="flex-1 flex items-center gap-2 bg-slate-900 rounded-lg px-3 border border-slate-700">
            <span className="material-symbols-outlined text-slate-500">search</span>
            <input 
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                placeholder="Buscar por Mes (2023-10) o Apto..."
                className="bg-transparent w-full h-10 text-white font-bold focus:outline-none"
            />
        </div>
      </div>

      {/* LISTA DE RECIBOS */}
      <div className="space-y-3">
        {filteredReceipts.length === 0 && (
            <div className="text-center py-10 text-slate-500 font-bold">No se encontraron recibos.</div>
        )}

        {filteredReceipts.map((rec) => (
            <div key={rec.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center hover:bg-slate-700/50 transition-colors">
                
                {/* Info Izquierda */}
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${rec.status === 'PAGADO' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {rec.status === 'PAGADO' ? 'OK' : '$'}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Apto {rec.unit}</h3>
                        <p className="text-xs text-slate-400 uppercase font-bold">{rec.period} • {rec.items.length} Conceptos</p>
                    </div>
                </div>

                {/* Info Derecha + Botón */}
                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-xl font-black text-white">${rec.totalAmount.toFixed(2)}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${rec.status === 'PAGADO' ? 'text-green-400' : 'text-amber-500'}`}>
                            {rec.status}
                        </p>
                    </div>

                    <button 
                        onClick={() => printReceipt(rec)}
                        className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                        title="Imprimir PDF"
                    >
                        <span className="material-symbols-outlined">print</span>
                        <span className="hidden md:inline font-bold text-sm">IMPRIMIR</span>
                    </button>
                </div>

            </div>
        ))}
      </div>
    </div>
  );
};

export default ReceiptHistoryAdmin;