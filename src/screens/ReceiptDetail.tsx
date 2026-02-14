import React, { useState, useEffect } from 'react';

interface Props {
  setScreen: (s: string) => void;
}

const ReceiptDetail: React.FC<Props> = ({ setScreen }) => {
  const [loading, setLoading] = useState(true);

  // --- DATOS SIMULADOS (Esto vendría de Firebase en el futuro) ---
  const receiptData = {
    periodo: "Octubre 2023", // Coincide con tu ejemplo anterior
    montoTotal: 45.00,
    montoBs: 1642.50,
    tasa: 36.50,
    vencimiento: "05/11/2023",
    items: [
      { concepto: "Alícuota (1.5%) - Apto 4-B", monto: 36.75 },
      { concepto: "Fondo de Reserva (10%)", monto: 3.25 },
      { concepto: "Deuda Mes Anterior", monto: 5.00 }, // Ejemplo de deuda
      // Los gastos comunes globales no se suman aquí individualmente al total del recibo
      // pero se pueden listar si se requiere desglose de la alícuota.
      // Para este recibo personal, mostramos lo que paga EL USUARIO.
    ]
  };

  // NÚMERO DE TELÉFONO DE LA JUNTA (Para el botón de dudas)
  const PHONE_JUNTA = "584121234567"; 

  useEffect(() => {
    // Simular carga rápida
    setTimeout(() => setLoading(false), 500);
  }, []);

  // --- LÓGICA DE BOTONES ---
  const handleContactBoard = () => {
    const message = `Hola, soy del Apto 4-B. Tengo una duda con mi recibo de ${receiptData.periodo} por $${receiptData.montoTotal}.`;
    const url = `https://wa.me/${PHONE_JUNTA}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handlePay = () => {
    setScreen('report-payment');
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Cargando recibo...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white pb-24 relative">
      
      {/* 1. ENCABEZADO SIMPLE */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => setScreen('dashboard')} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-black uppercase tracking-widest text-blue-400">Detalle de Recibo</h1>
            <p className="text-xs text-slate-400 font-bold">{receiptData.periodo}</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6 flex-1">
        
        {/* 2. TARJETA DE TOTAL (Visualmente impactante) */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 p-6 rounded-3xl border border-blue-500/30 shadow-2xl text-center relative overflow-hidden">
            {/* Adorno de fondo */}
            <div className="absolute -top-6 -right-6 opacity-10">
                <span className="material-symbols-outlined text-[150px]">receipt_long</span>
            </div>

            <p className="text-sm text-blue-200 font-bold uppercase mb-1 tracking-widest">Total a Pagar</p>
            <h2 className="text-6xl font-black text-white tracking-tighter mb-2">
                ${receiptData.montoTotal.toFixed(2)}
            </h2>
            
            <div className="flex justify-center gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700 backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Tasa: {receiptData.tasa}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/50 backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-blue-200 uppercase">Bs. {receiptData.montoBs.toFixed(2)}</span>
                </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-red-500/20 px-4 py-1.5 rounded-full border border-red-500/50">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-bold text-red-200 uppercase tracking-wide">Vence: {receiptData.vencimiento}</span>
            </div>
        </div>

        {/* 3. DESGLOSE (Limpio y claro) */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-3">
            <span className="material-symbols-outlined text-slate-400">list_alt</span>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Conceptos Facturados</h3>
          </div>
          
          <div className="space-y-5">
            {receiptData.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start group">
                <div className="w-2/3">
                    <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{item.concepto}</div>
                    {/* Si fuera deuda, podemos poner un texto rojo */}
                    {item.concepto.includes('Deuda') && <span className="text-[10px] text-red-400 font-bold uppercase">Pago vencido</span>}
                </div>
                <div className="text-sm font-bold text-white tracking-tight">${item.monto.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-600 flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 uppercase">Total Facturado</span>
            <span className="text-xl font-black text-green-400">${receiptData.montoTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Nota informativa pequeña */}
        <p className="text-center text-[10px] text-slate-600 px-4">
            Al realizar el pago, recuerde reportarlo inmediatamente para evitar morosidad.
        </p>
      </main>

      {/* 4. BOTONES DE ACCIÓN (SOLO 2) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex gap-3 z-50 max-w-md mx-auto">
        
        {/* BOTÓN 1: DUDAS (Gris/Secundario) */}
        <button 
          onClick={handleContactBoard}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold uppercase text-xs flex flex-col items-center justify-center gap-1 border border-slate-700 shadow-lg active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-xl text-yellow-500">help</span>
          Tengo Dudas
        </button>

        {/* BOTÓN 2: PAGAR (Azul/Primario) */}
        <button 
          onClick={handlePay}
          className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-900/40 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-xl">payments</span>
          Reportar Pago
        </button>

      </div>
    </div>
  );
};

export default ReceiptDetail;