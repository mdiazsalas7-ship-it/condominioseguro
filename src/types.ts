export enum UserRole {
  RESIDENT = 'RESIDENT',
  SECURITY = 'SECURITY',
  ADMIN = 'ADMIN'
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  unit?: string;
  apt?: string;
  photoURL?: string;
  createdAt?: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  invoicePhoto?: string;
  category?: string;
}

export interface IncomeItem {
  id: string;
  source: 'Propiedad' | 'Local' | 'Caney' | 'Otros';
  description: string;
  amount: number;
  date: string;
  unit?: string;
}

export interface UnitStatus {
  id: string;
  number: string;
  tower: string;
  owner: string;
  monthsOwed: number;
  lastPaymentDate: string;
  status: 'Solvente' | 'Pendiente' | 'Insolvente';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'Asamblea' | 'Comunicado' | 'Urgente';
  author: string;
}

// --- ACTUALIZADO PARA DELIVERY Y CONTROL DE ACCESO ---
export interface AccessInvitation {
  id: string;
  name: string;
  idNumber: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  type: 'Visitante' | 'Delivery';
  deliveryCompany?: string; // Empresa de delivery
  unit: string;
  status: 'PENDIENTE' | 'EN SITIO' | 'SALIDA' | 'EXPIRADO';
  entryTime?: string;
  exitTime?: string;        // Hora de salida
  qrData?: string;
  author?: string;          // ID del creador
  createdAt?: string;       // Fecha creación
}

export interface SurveyOption {
  id: string;
  text: string;
  votes: number;
}

export interface Survey {
  id: string;
  question: string;
  options: SurveyOption[];
  totalVotes: number;
  expiresAt: string;
}

// --- NUEVOS TIPOS PARA GESTIÓN ADMIN (FACTURACIÓN) ---

export interface Expense {
  id: string;
  description: string;
  amount: number; // Siempre en USD (base)
  type: 'FIXED' | 'VARIABLE';
  status: 'PENDING' | 'PAID'; // Control de pago a proveedores
  invoiceUrl?: string; // Foto del soporte (se sube luego)
  paymentDate?: string;
}

export interface GlobalReceipt {
  id?: string;
  month: string;      // Ej: "FEBRERO 2026"
  year: number;
  exchangeRate: number; // Tasa BCV del momento de emisión
  
  expenses: Expense[];
  
  // Variables de Configuración
  totalUnits: number;           // Cantidad de Apartamentos
  reserveFundPerc: number;      // % Fondo de Reserva
  earlyPaymentPercent: number;  // % Descuento Pronto Pago
  earlyPaymentDeadline: string; // Fecha tope del descuento
  
  // Totales Calculados (Snapshot en USD)
  subtotalExpenses: number;  // Suma de Gastos Fijos + Variables
  reserveFundAmount: number; // Dinero destinado a reserva
  totalToCollect: number;    // Total General a cobrar al edificio
  
  // Cuotas Individuales (Lo que ve el residente)
  quotaNormal: number;       // Cuota Full
  quotaWithDiscount: number; // Cuota con Pronto Pago
  
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
}