import React, { useState, useEffect } from 'react';
import { AccessInvitation } from '../types';
import { db } from '../firebase';
// AGREGADO: getDoc a los imports
import { collection, query, where, onSnapshot, doc, updateDoc, limit, writeBatch, getDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Scanner } from '@yudiel/react-qr-scanner'; 

// --- CLAVE DE API CONFIGURADA ---
const FIREBASE_SERVER_KEY = "AIzaSyC8jYuK_-ZTMiUv3_ksmEb0CEra7oqmYiw"; 

interface Props {
  setScreen: (s: string) => void;
  onLogout?: () => void;
}

const SecurityPanel: React.FC<Props> = ({ setScreen, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'control' | 'historial' | 'morosidad'>('control');
  
  // Listas de datos
  const [activeInvitations, setActiveInvitations] = useState<AccessInvitation[]>([]); 
  const [historyLog, setHistoryLog] = useState<AccessInvitation[]>([]); 
  
  // Modales y Estados
  const [scannedVisitor, setScannedVisitor] = useState<AccessInvitation | null>(null);
  const [selectedLog, setSelectedLog] = useState<AccessInvitation | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualSearchCedula, setManualSearchCedula] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isScanning, setIsScanning] = useState(false); 

  // 1. TIEMPO REAL: ACTIVOS
  useEffect(() => {
    const q = query(collection(db, 'access_invitations'), where('status', 'in', ['PENDIENTE', 'EN SITIO']));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AccessInvitation[];
      docs.sort((a, b) => (a.status === 'EN SITIO' ? -1 : 1));
      setActiveInvitations(docs);
    });
  }, []);

  // 2. TIEMPO REAL: HISTORIAL
  useEffect(() => {
    const qHistory = query(collection(db, 'access_invitations'), where('status', '==', 'SALIDA'), limit(100));
    return onSnapshot(qHistory, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AccessInvitation[];
      const currentShiftLogs = docs.filter(doc => !(doc as any).archived);
      currentShiftLogs.sort((a, b) => {
         const timeA = a.exitTime || '';
         const timeB = b.exitTime || '';
         return timeB.localeCompare(timeA); 
      });
      setHistoryLog(currentShiftLogs);
    });
  }, []);

  // --- FUNCIÓN NUEVA: DISPARAR NOTIFICACIÓN ---
  const notifyOwner = async (invitation: AccessInvitation) => {
    try {
      // 1. Buscamos el token del dueño
      const userRef = doc(db, 'users', invitation.author);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const token = userData.fcmToken;

        if (token) {
          // 2. Enviamos el mensaje a Firebase
          await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${FIREBASE_SERVER_KEY}`
            },
            body: JSON.stringify({
              to: token,
              notification: {
                title: '🔔 Visita Llegando',
                body: `${invitation.name} (${invitation.type}) ha ingresado al condominio.`
              },
              data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK"
              }
            })
          });
          console.log("Notificación enviada a:", userData.name);
        }
      }
    } catch (error) {
      console.error("Error enviando notificación:", error);
    }
  };

  // --- 3. CORRECCIÓN DE LA LÓGICA DE ESCANEO ---
  const handleQrScan = (detectedCodes: any) => {
    // La librería devuelve un array, extraemos el primer valor
    if (detectedCodes && detectedCodes.length > 0) {
      const rawValue = detectedCodes[0].rawValue; 
      
      if (rawValue) {
        setIsScanning(false); // Detener cámara
        
        // Buscamos el ID exacto en la base de datos
        const found = activeInvitations.find(inv => inv.id === rawValue);
        
        if (found) {
          // ÉXITO: Encontrado y Válido
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Vibración doble
          setScannedVisitor(found);
        } else {
          // ERROR: No encontrado (Expirado o Falso)
          if (navigator.vibrate) navigator.vibrate(500); // Vibración larga error
          alert("❌ CÓDIGO NO VÁLIDO.\n\nEste pase no existe en la lista activa, ya salió o es falso.");
          setIsScanning(false);
        }
      }
    }
  };

  // 4. GENERAR REPORTE (Sin cambios)
  const generateDailyReport = async () => {
    if (historyLog.length === 0 && activeInvitations.length === 0) return alert("No hay registros.");
    if (!confirm("¿Generar Reporte y CERRAR GUARDIA?\nEsto archivará las visitas del historial.")) return;

    setGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('es-VE');
      const timeNow = new Date().toLocaleTimeString('es-VE');

      doc.setFillColor(30, 58, 138); doc.rect(14, 10, 25, 25, 'F'); 
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.text("CS", 19, 27); 

      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("URBANIZACIÓN CONDOMINIO SEGURO", 45, 20);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      doc.text("REPORTE DE CIERRE DE GUARDIA", 45, 26);
      doc.text(`Fecha: ${today}  |  Cierre: ${timeNow}`, 45, 32);

      const allRecords = [...activeInvitations, ...historyLog];
      const tableData = allRecords.map(row => [
        row.entryTime || '--:--', row.exitTime || (row.status === 'EN SITIO' ? 'En Sitio' : 'Pendiente'),
        row.unit, row.name, row.idNumber,
        row.type === 'Delivery' ? `Delivery (${row.deliveryCompany})` : `Visitante ${row.vehiclePlate ? `(${row.vehiclePlate})` : ''}`,
        row.status
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Entrada', 'Salida', 'Destino', 'Nombre', 'Cédula', 'Detalle', 'Estado']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], halign: 'center', fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2 }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 30;
      doc.line(30, finalY, 80, finalY); doc.text("ENTREGA GUARDIA", 55, finalY + 5, { align: 'center' });
      doc.line(130, finalY, 180, finalY); doc.text("RECIBE GUARDIA", 155, finalY + 5, { align: 'center' });

      doc.save(`Guardia_${today.replace(/\//g, '-')}.pdf`);

      if (historyLog.length > 0) {
        const batch = writeBatch(db);
        historyLog.forEach(log => {
          if (log.status === 'SALIDA') batch.update(doc(db, 'access_invitations', log.id), { archived: true });
        });
        await batch.commit();
      }
    } catch (e) { alert("Error reporte"); } finally { setGeneratingPdf(false); }
  };

  const processAccess = async (visitor: AccessInvitation, action: 'ENTRAR' | 'SALIR') => {
    // Confirmación visual ya está en el botón, procedemos directo o con confirm
    // if (!confirm(`¿Confirmar ${action}?`)) return; // Opcional si ya el botón es claro
    
    try {
      const docRef = doc(db, 'access_invitations', visitor.id);
      const now = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
      await updateDoc(docRef, { 
        status: action === 'ENTRAR' ? 'EN SITIO' : 'SALIDA', 
        [action === 'ENTRAR' ? 'entryTime' : 'exitTime']: now 
      });

      // 🔥 SI ESTÁ ENTRANDO, DISPARAMOS LA NOTIFICACIÓN
      if (action === 'ENTRAR') {
        notifyOwner(visitor);
      }

      setScannedVisitor(null);
    } catch (e) { alert("Error conexión"); }
  };

  // --- RENDERIZADO ---
  if (isScanning) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
        <div className="w-full max-w-md aspect-square relative rounded-3xl overflow-hidden border-4 border-blue-500 shadow-2xl bg-black">
          <Scanner 
            onScan={(result) => handleQrScan(result)} // <--- USO CORRECTO: onScan
            onError={(error) => console.log(error?.message)}
            components={{ audio: false, torch: true }} // Opciones extra
            styles={{ container: { width: '100%', height: '100%' } }}
          />
          <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none flex items-center justify-center">
            <div className="size-60 border-2 border-white/50 rounded-xl relative">
                {/* Esquinas visuales */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1"></div>
            </div>
          </div>
        </div>
        <p className="text-white mt-6 font-bold uppercase tracking-widest text-sm animate-pulse">Buscando Código...</p>
        <button onClick={() => setIsScanning(false)} className="mt-8 bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest shadow-lg">Cerrar Cámara</button>
      </div>
    );
  }

  const morosos = [{ unit: '102-A', resident: 'Pedro Gomez', debt: '$150.00', status: 'Restringido' }];

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white pb-20">
      <header className="p-4 bg-slate-800 border-b border-slate-700 shadow-lg sticky top-0 z-50">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><span className="material-symbols-outlined text-white">security</span></div>
            <div><h1 className="text-sm font-black uppercase tracking-widest">Garita Principal</h1><p className="text-[10px] font-bold text-blue-400">Control de Acceso</p></div>
          </div>
          <button onClick={onLogout} className="size-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400"><span className="material-symbols-outlined">logout</span></button>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
          <button onClick={() => setActiveTab('control')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'control' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Accesos ({activeInvitations.length})</button>
          <button onClick={() => setActiveTab('historial')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'historial' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-white'}`}>Historial ({historyLog.length})</button>
          <button onClick={() => setActiveTab('morosidad')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'morosidad' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-white'}`}>Morosidad</button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        
        {/* TAB 1: CONTROL */}
        {activeTab === 'control' && (
          <>
            {!scannedVisitor && !isManualEntry && (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIsScanning(true)} className="bg-blue-600 hover:bg-blue-500 p-6 rounded-3xl shadow-xl flex flex-col items-center gap-2 active:scale-95"><span className="material-symbols-outlined text-4xl">qr_code_scanner</span><span className="text-xs font-black uppercase">Escanear</span></button>
                <button onClick={() => setIsManualEntry(true)} className="bg-slate-800 hover:bg-slate-700 p-6 rounded-3xl border border-slate-700 flex flex-col items-center gap-2 active:scale-95"><span className="material-symbols-outlined text-4xl text-slate-400">search</span><span className="text-xs font-black uppercase text-slate-400">Cédula</span></button>
              </div>
            )}
            
            {isManualEntry && (
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 animate-in zoom-in-95">
                <input value={manualSearchCedula} onChange={e => setManualSearchCedula(e.target.value)} className="w-full bg-slate-900 border-none rounded-xl h-12 px-4 text-white font-bold mb-3" placeholder="Cédula..." />
                <div className="flex gap-2">
                  <button onClick={() => setIsManualEntry(false)} className="flex-1 bg-slate-700 h-10 rounded-lg text-xs font-bold uppercase">Cancelar</button>
                  <button onClick={() => {
                    const found = activeInvitations.find(inv => inv.idNumber.includes(manualSearchCedula));
                    if (found) { setScannedVisitor(found); setIsManualEntry(false); setManualSearchCedula(''); } 
                    else alert("❌ No encontrada.");
                  }} className="flex-1 bg-blue-600 h-10 rounded-lg text-xs font-bold uppercase">Buscar</button>
                </div>
              </div>
            )}

            {/* MODAL VISITANTE ENCONTRADO (VALIDACIÓN VISUAL) */}
            {scannedVisitor && (
              <div className="bg-slate-800 border-2 border-green-500 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
                 
                 {/* CINTILLO DE VALIDACIÓN */}
                 <div className="absolute top-0 left-0 right-0 bg-green-500 py-1 text-center">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">✅ Pase Válido / Legal</p>
                 </div>

                 <div className="flex justify-between items-start mb-4 mt-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{scannedVisitor.type}</p>
                      <h2 className="text-2xl font-black text-white leading-none">{scannedVisitor.name}</h2>
                      {scannedVisitor.deliveryCompany && <span className="inline-block mt-2 bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase px-2 py-1 rounded">{scannedVisitor.deliveryCompany}</span>}
                    </div>
                    <button onClick={() => setScannedVisitor(null)} className="size-8 rounded-full bg-slate-700 flex items-center justify-center"><span className="material-symbols-outlined text-sm">close</span></button>
                 </div>
                 <div className="bg-slate-900/50 p-4 rounded-xl space-y-2 mb-6">
                    <p className="flex justify-between text-xs"><span className="text-slate-400">Destino:</span> <strong className="text-yellow-400">{scannedVisitor.unit}</strong></p>
                    <p className="flex justify-between text-xs"><span className="text-slate-400">Cédula:</span> <strong>{scannedVisitor.idNumber}</strong></p>
                    <p className="flex justify-between text-xs"><span className="text-slate-400">Placa:</span> <strong>{scannedVisitor.vehiclePlate}</strong></p>
                 </div>
                 <button onClick={() => processAccess(scannedVisitor, scannedVisitor.status === 'PENDIENTE' ? 'ENTRAR' : 'SALIR')} className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 ${scannedVisitor.status === 'PENDIENTE' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                   <span className="material-symbols-outlined">{scannedVisitor.status === 'PENDIENTE' ? 'login' : 'logout'}</span>
                   {scannedVisitor.status === 'PENDIENTE' ? 'APROBAR ENTRADA' : 'REGISTRAR SALIDA'}
                 </button>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">En Garita / Pendientes</h3>
              {activeInvitations.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No hay visitas activas.</p>}
              {activeInvitations.map(inv => (
                <div key={inv.id} onClick={() => setScannedVisitor(inv)} className={`p-4 rounded-2xl border flex justify-between items-center cursor-pointer ${inv.status === 'EN SITIO' ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700'}`}>
                  <div><h4 className="font-bold text-sm text-white">{inv.name}</h4><p className="text-[10px] text-slate-400 uppercase font-bold">{inv.unit} • {inv.type}</p></div>
                  {inv.status === 'EN SITIO' ? <span className="text-[9px] font-black bg-green-500 text-white px-2 py-0.5 rounded uppercase">Adentro</span> : <span className="text-[9px] font-black border border-slate-600 text-slate-500 px-2 py-0.5 rounded uppercase">Pendiente</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 2: HISTORIAL */}
        {activeTab === 'historial' && (
          <section className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center bg-slate-800 p-3 rounded-2xl border border-slate-700">
               <div><h2 className="text-xs font-black text-white uppercase tracking-widest">Reporte de Guardia</h2><p className="text-[9px] text-slate-400">Imprimir y Limpiar Panel</p></div>
               <button onClick={generateDailyReport} disabled={generatingPdf} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg disabled:opacity-50"><span className="material-symbols-outlined text-sm">print</span> {generatingPdf ? '...' : 'Cerrar Guardia'}</button>
            </div>
            {historyLog.length === 0 && <p className="text-center text-xs text-slate-400 py-10">Sin visitas finalizadas.</p>}
            <div className="space-y-2">
              {historyLog.map((log) => (
                <div key={log.id} onClick={() => setSelectedLog(log)} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-700/50">
                  <div className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-500">history</span><div><p className="text-sm font-bold text-slate-300">{log.name}</p><p className="text-[10px] text-yellow-500 uppercase font-bold">Destino: {log.unit}</p></div></div>
                  <div className="text-right"><p className="text-[9px] text-slate-400 uppercase">Salida</p><p className="text-xs font-black text-white">{log.exitTime}</p></div>
                </div>
              ))}
            </div>
            {selectedLog && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
                  <button onClick={() => setSelectedLog(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider mb-1">Ficha de Visita</h3>
                  <div className="space-y-4 mt-6">
                    <div className="bg-slate-800 p-4 rounded-xl"><p className="text-[10px] text-slate-400 uppercase font-bold">Visitante</p><p className="text-lg font-black text-white">{selectedLog.name}</p><p className="text-sm text-slate-300">CI: {selectedLog.idNumber}</p></div>
                    <div className="grid grid-cols-2 gap-3"><div className="bg-slate-800 p-3 rounded-xl"><p className="text-[10px] text-slate-400 uppercase font-bold">Entrada</p><p className="text-sm font-black text-green-400">{selectedLog.entryTime || '--'}</p></div><div className="bg-slate-800 p-3 rounded-xl"><p className="text-[10px] text-slate-400 uppercase font-bold">Salida</p><p className="text-sm font-black text-red-400">{selectedLog.exitTime || '--'}</p></div></div>
                    <div className="space-y-2 text-xs text-slate-300 px-1">
                      <div className="flex justify-between border-b border-slate-800 pb-2"><span>Destino:</span> <span className="font-bold text-yellow-500">{selectedLog.unit}</span></div>
                      <div className="flex justify-between border-b border-slate-800 pb-2"><span>Tipo:</span> <span className="font-bold uppercase">{selectedLog.type}</span></div>
                      <div className="flex justify-between border-b border-slate-800 pb-2"><span>Vehículo:</span> <span className="font-bold uppercase">{selectedLog.vehiclePlate || 'N/A'}</span></div>
                      {selectedLog.deliveryCompany && <div className="flex justify-between border-b border-slate-800 pb-2"><span>Empresa:</span> <span className="font-bold text-orange-400 uppercase">{selectedLog.deliveryCompany}</span></div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: MOROSIDAD */}
        {activeTab === 'morosidad' && (
          <section className="space-y-3 animate-in fade-in slide-in-from-right-4">
             {morosos.map((m, i) => (
                <div key={i} className="bg-slate-800 p-5 rounded-2xl border-l-4 border-l-red-500 border border-slate-700 flex justify-between items-center">
                   <div><p className="text-lg font-black text-white">{m.unit}</p></div>
                   <div className="text-right"><p className="text-sm font-black text-red-500">{m.debt}</p><p className="text-[9px] font-black uppercase text-red-900 bg-red-500/20 px-2 rounded mt-1">{m.status}</p></div>
                </div>
             ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default SecurityPanel;