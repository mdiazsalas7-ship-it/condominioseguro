import React, { useState, useEffect } from 'react';
import { AccessInvitation } from '../types';
import { db } from '../firebase';
// Importamos getDoc para poder buscar el token del dueño
import { collection, query, where, onSnapshot, doc, updateDoc, limit, writeBatch, getDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Scanner } from '@yudiel/react-qr-scanner'; 

// ⚠️ TU CLAVE DE API (AIza...) QUE YA FUNCIONA PORQUE HABILITASTE LA API LEGACY
const FIREBASE_SERVER_KEY = "AIzaSyCLPOzzpBAnljJIpf_TwQOTAqj9V-rUFyk"; 

interface Props {
  setScreen: (s: string) => void;
  onLogout?: () => void;
}

const SecurityPanel: React.FC<Props> = ({ setScreen, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'control' | 'historial' | 'morosidad'>('control');
  
  // Estados de datos
  const [activeInvitations, setActiveInvitations] = useState<AccessInvitation[]>([]); 
  const [historyLog, setHistoryLog] = useState<AccessInvitation[]>([]); 
  
  // Estados de UI
  const [scannedVisitor, setScannedVisitor] = useState<AccessInvitation | null>(null);
  const [selectedLog, setSelectedLog] = useState<AccessInvitation | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualSearchCedula, setManualSearchCedula] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isScanning, setIsScanning] = useState(false); 

  // 1. CARGAR INVITACIONES ACTIVAS
  useEffect(() => {
    const q = query(collection(db, 'access_invitations'), where('status', 'in', ['PENDIENTE', 'EN SITIO']));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AccessInvitation[];
      docs.sort((a, b) => (a.status === 'EN SITIO' ? -1 : 1));
      setActiveInvitations(docs);
    });
  }, []);

  // 2. CARGAR HISTORIAL
  useEffect(() => {
    const qHistory = query(collection(db, 'access_invitations'), where('status', '==', 'SALIDA'), limit(50));
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

  // --- FUNCIÓN DE NOTIFICACIÓN (CON PROXY ESTABLE) ---
  const notifyOwner = async (invitation: AccessInvitation) => {
    try {
      // 1. Buscamos el token del dueño
      const userRef = doc(db, 'users', invitation.author);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const token = userData.fcmToken;

        if (token) {
          console.log("🔔 Enviando notificación a:", userData.name);
          
          // 2. USAMOS corsproxy.io QUE ES MÁS ROBUSTO
          const targetUrl = 'https://fcm.googleapis.com/fcm/send';
          const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);

          const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${FIREBASE_SERVER_KEY}`
            },
            body: JSON.stringify({
              to: token,
              notification: {
                title: '🔔 ¡VISITA EN GARITA!',
                body: `${invitation.name} (${invitation.type}) ha ingresado al condominio.`,
                sound: "default"
              },
              priority: "high",
              data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                status: "done" 
              }
            })
          });

          if (response.ok) {
             console.log("✅ ¡Notificación enviada con éxito!");
             if (navigator.vibrate) navigator.vibrate([50, 50]); // Feedback táctil en la PC si es táctil
          } else {
             const errorText = await response.text();
             console.error("❌ Error enviando:", errorText);
             alert("Error al notificar: " + response.status + " " + response.statusText);
          }
        } else {
           console.log("⚠️ El dueño no tiene token registrado (quizás no ha abierto la App recientemente).");
        }
      }
    } catch (error) {
      console.error("Error general de notificación:", error);
    }
  };

  // 3. LÓGICA DE ESCANEO
  const handleQrScan = (detectedCodes: any) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const rawValue = detectedCodes[0].rawValue; 
      if (rawValue) {
        setIsScanning(false);
        const found = activeInvitations.find(inv => inv.id === rawValue);
        if (found) {
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          setScannedVisitor(found);
        } else {
          if (navigator.vibrate) navigator.vibrate(500);
          alert("❌ PASE NO VÁLIDO O YA PROCESADO");
          setIsScanning(false);
        }
      }
    }
  };

  // 4. PROCESAR ACCESO
  const processAccess = async (visitor: AccessInvitation, action: 'ENTRAR' | 'SALIR') => {
    try {
      const docRef = doc(db, 'access_invitations', visitor.id);
      const now = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
      
      await updateDoc(docRef, { 
        status: action === 'ENTRAR' ? 'EN SITIO' : 'SALIDA', 
        [action === 'ENTRAR' ? 'entryTime' : 'exitTime']: now 
      });

      // 🔥 SI ESTÁ ENTRANDO, DISPARAMOS LA NOTIFICACIÓN
      if (action === 'ENTRAR') {
        // Ejecutamos la notificación sin esperar (async) para no trabar la UI
        notifyOwner(visitor);
      }

      setScannedVisitor(null);
    } catch (e) { 
      alert("Error de conexión");
      console.error(e);
    }
  };

  // 5. GENERAR REPORTE PDF
  const generateDailyReport = async () => {
    if (historyLog.length === 0 && activeInvitations.length === 0) return alert("No hay registros para cerrar.");
    if (!confirm("¿Generar Reporte y CERRAR GUARDIA?")) return;

    setGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('es-VE');
      const timeNow = new Date().toLocaleTimeString('es-VE');

      doc.setFillColor(30, 58, 138); doc.rect(14, 10, 25, 25, 'F'); 
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.text("CS", 19, 27); 
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("CONDOMINIO SEGURO", 45, 20);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      doc.text(`REPORTE DE GUARDIA - ${today} ${timeNow}`, 45, 26);

      const allRecords = [...activeInvitations, ...historyLog];
      const tableData = allRecords.map(row => [
        row.entryTime || '--', row.exitTime || (row.status === 'EN SITIO' ? 'Dentro' : 'Pendiente'),
        row.unit, row.name, row.idNumber, row.type, row.status
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Entrada', 'Salida', 'Apto', 'Nombre', 'Cédula', 'Tipo', 'Estado']],
        body: tableData,
      });

      doc.save(`Guardia_${today.replace(/\//g, '-')}.pdf`);

      if (historyLog.length > 0) {
        const batch = writeBatch(db);
        historyLog.forEach(log => {
          if (log.status === 'SALIDA') batch.update(doc(db, 'access_invitations', log.id), { archived: true });
        });
        await batch.commit();
      }
    } catch (e) { alert("Error PDF"); } finally { setGeneratingPdf(false); }
  };

  // --- RENDERIZADO ---
  if (isScanning) return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="w-full max-w-md aspect-square relative rounded-3xl overflow-hidden border-4 border-blue-500 shadow-2xl bg-black">
        <Scanner onScan={handleQrScan} components={{ audio: false, torch: true }} styles={{ container: { width: '100%', height: '100%' } }} />
      </div>
      <button onClick={() => setIsScanning(false)} className="mt-8 bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase">Cerrar Cámara</button>
    </div>
  );

  const morosos = [{ unit: '102-A', resident: 'Pedro Gomez', debt: '$150.00', status: 'Restringido' }];

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white pb-20">
      <header className="p-4 bg-slate-800 border-b border-slate-700 shadow-lg sticky top-0 z-50">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><span className="material-symbols-outlined text-white">security</span></div>
            <div><h1 className="text-sm font-black uppercase tracking-widest">Garita</h1><p className="text-[10px] font-bold text-blue-400">Control</p></div>
          </div>
          <button onClick={onLogout} className="size-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400"><span className="material-symbols-outlined">logout</span></button>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
          <button onClick={() => setActiveTab('control')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${activeTab === 'control' ? 'bg-blue-600' : 'text-slate-500'}`}>Accesos</button>
          <button onClick={() => setActiveTab('historial')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${activeTab === 'historial' ? 'bg-slate-600' : 'text-slate-500'}`}>Historial</button>
          <button onClick={() => setActiveTab('morosidad')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${activeTab === 'morosidad' ? 'bg-red-600' : 'text-slate-500'}`}>Morosidad</button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {activeTab === 'control' && (
          <>
            {!scannedVisitor && !isManualEntry && (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIsScanning(true)} className="bg-blue-600 p-6 rounded-3xl flex flex-col items-center gap-2 shadow-lg"><span className="material-symbols-outlined text-4xl">qr_code_scanner</span><span className="text-xs font-black uppercase">Escanear</span></button>
                <button onClick={() => setIsManualEntry(true)} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex flex-col items-center gap-2"><span className="material-symbols-outlined text-4xl text-slate-400">search</span><span className="text-xs font-black uppercase text-slate-400">Cédula</span></button>
              </div>
            )}
            
            {isManualEntry && (
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <input value={manualSearchCedula} onChange={e => setManualSearchCedula(e.target.value)} className="w-full bg-slate-900 border-none rounded-xl h-12 px-4 text-white font-bold mb-3" placeholder="Cédula..." />
                <div className="flex gap-2">
                  <button onClick={() => setIsManualEntry(false)} className="flex-1 bg-slate-700 h-10 rounded-lg text-xs font-bold uppercase">Cancelar</button>
                  <button onClick={() => {
                    const found = activeInvitations.find(inv => inv.idNumber.includes(manualSearchCedula));
                    if (found) { setScannedVisitor(found); setIsManualEntry(false); setManualSearchCedula(''); } else alert("❌ No encontrada.");
                  }} className="flex-1 bg-blue-600 h-10 rounded-lg text-xs font-bold uppercase">Buscar</button>
                </div>
              </div>
            )}

            {scannedVisitor && (
              <div className="bg-slate-800 border-2 border-green-500 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                 <div className="absolute top-0 left-0 right-0 bg-green-500 py-1 text-center"><p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">✅ Pase Válido</p></div>
                 <div className="mt-6 mb-4">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{scannedVisitor.type}</p>
                    <h2 className="text-2xl font-black text-white">{scannedVisitor.name}</h2>
                    <p className="text-sm text-yellow-500 font-bold">Apto: {scannedVisitor.unit}</p>
                 </div>
                 <button onClick={() => processAccess(scannedVisitor, scannedVisitor.status === 'PENDIENTE' ? 'ENTRAR' : 'SALIR')} className={`w-full h-14 rounded-2xl font-black uppercase shadow-lg flex items-center justify-center gap-2 ${scannedVisitor.status === 'PENDIENTE' ? 'bg-green-500' : 'bg-red-500'}`}>
                   {scannedVisitor.status === 'PENDIENTE' ? 'APROBAR ENTRADA' : 'REGISTRAR SALIDA'}
                 </button>
                 <button onClick={() => setScannedVisitor(null)} className="w-full mt-4 text-xs text-slate-500 font-bold uppercase">Cancelar</button>
              </div>
            )}

            <div className="space-y-3 pt-4">
               {activeInvitations.map(inv => (
                <div key={inv.id} onClick={() => setScannedVisitor(inv)} className={`p-4 rounded-2xl border flex justify-between items-center cursor-pointer ${inv.status === 'EN SITIO' ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700'}`}>
                  <div><h4 className="font-bold text-sm text-white">{inv.name}</h4><p className="text-[10px] text-slate-400 uppercase font-bold">{inv.unit} • {inv.type}</p></div>
                  {inv.status === 'EN SITIO' ? <span className="text-[9px] font-black bg-green-500 text-white px-2 py-0.5 rounded uppercase">Adentro</span> : <span className="text-[9px] font-black border border-slate-600 text-slate-500 px-2 py-0.5 rounded uppercase">Pendiente</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'historial' && (
          <div className="space-y-2">
            {historyLog.map((log) => (
               <div key={log.id} onClick={() => setSelectedLog(log)} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
                  <div><p className="text-sm font-bold text-slate-300">{log.name}</p><p className="text-[10px] text-yellow-500 uppercase font-bold">{log.unit}</p></div>
                  <div className="text-right"><p className="text-[9px] text-slate-400 uppercase">Salida</p><p className="text-xs font-black text-white">{log.exitTime}</p></div>
               </div>
            ))}
            <button onClick={generateDailyReport} className="w-full py-4 mt-4 bg-blue-600 rounded-xl font-bold uppercase text-xs">Cerrar Guardia (PDF)</button>
          </div>
        )}

        {activeTab === 'morosidad' && morosos.map((m, i) => (
          <div key={i} className="bg-slate-800 p-5 rounded-2xl border-l-4 border-l-red-500 border border-slate-700 flex justify-between items-center">
             <div><p className="text-lg font-black text-white">{m.unit}</p></div>
             <div className="text-right"><p className="text-sm font-black text-red-500">{m.debt}</p><p className="text-[9px] font-black uppercase text-red-900 bg-red-500/20 px-2 rounded mt-1">{m.status}</p></div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default SecurityPanel;