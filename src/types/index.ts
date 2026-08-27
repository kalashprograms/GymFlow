export type Role = 'gym_owner' | 'receptionist' | 'trainer';

export type MemberStatus = 'active' | 'expired' | 'frozen' | 'deleted';
export type PaymentStatus = 'paid' | 'pending' | 'partial';
export type PaymentMode = 'cash' | 'upi' | 'card' | 'online';
export type AttendanceStatus = 'present' | 'absent';
export type AttendanceMethod = 'manual' | 'qr' | 'code';
export type NotificationType = 
  | 'expiry_7d' 
  | 'expiry_3d' 
  | 'expiry_1d' 
  | 'expiry_today' 
  | 'expired_7d' 
  | 'renewal' 
  | 'payment' 
  | 'general'
  | 'expiry';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  gymId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Gym {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  logo?: string;
  currency: string;
  taxRate: number;
  isOnboarded?: boolean;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MembershipPlan {
  id: string;
  gymId?: string;
  name: string;
  price: number;
  durationMonths: number;
  durationDays?: number;
  benefits?: string[];
  features?: string[];
  description?: string;
  color?: string;
  active?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface Member {
  id: string;
  gymId: string;
  memberCode: string;
  fullName: string;
  photo?: string;
  phoneNumber: string;
  whatsAppNumber?: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  joiningDate?: string;
  planId: string;
  planName?: string;
  membershipStartDate: string;
  membershipExpiryDate: string;
  trainerAssigned?: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  status: MemberStatus;
  freezeReason?: string;
  freezeDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  memberName?: string;
  memberCode?: string;
  planId?: string;
  planName?: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentDate: string;
  mode: PaymentMode | string;
  status?: string;
  notes?: string;
  receiptNumber: string;
  createdAt?: string;
}

export interface AttendanceRecord {
  id: string;
  gymId: string;
  memberId: string;
  memberName?: string;
  memberCode?: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss
  checkOutTime?: string;
  status?: AttendanceStatus;
  method?: AttendanceMethod | string;
  notes?: string;
  createdAt?: string;
}

export interface SmartNotification {
  id: string;
  gymId: string;
  memberId?: string;
  memberName?: string;
  title: string;
  message: string;
  type: NotificationType | string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  actionUrl?: string;
}

export interface RenewalRecord {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  previousPlanId: string;
  previousPlanName: string;
  newPlanId: string;
  newPlanName: string;
  previousExpiryDate: string;
  newExpiryDate: string;
  renewalDate: string;
  amount: number;
  discount: number;
  renewedBy: string;
  createdAt: string;
}

export interface GymSettings {
  id: string;
  gymId: string;
  theme?: 'system' | 'dark' | 'light';
  language?: string;
  reminderDays?: number[];
  reminderDaysNotice?: string;
  autoNotifyWhatsApp?: boolean;
  enableWhatsAppAutoReminder?: boolean;
  autoNotifyEmail?: boolean;
  qrCheckInEnabled?: boolean;
  currencySymbol?: string;
  currency?: string;
  taxPercentage?: number;
  taxRate?: number;
  backupFrequency?: 'daily' | 'weekly' | 'monthly';
  securityTwoFactor?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  expiringToday: number;
  expiringThisWeek: number;
  expiringIn30Days: number;
  monthlyRevenue: number;
  pendingPayments: number;
  todayAttendance: number;
  attendanceRate: number;
  renewalRate: number;
  recentActivities: {
    id: string;
    type: 'member_join' | 'renewal' | 'payment' | 'attendance' | 'expiry';
    title: string;
    description: string;
    timestamp: string;
    badgeColor?: string;
  }[];
  recentRenewals: RenewalRecord[];
  newestMembers: Member[];
  revenueChart: {
    month: string;
    revenue: number;
    target: number;
    paymentsCount: number;
  }[];
  membershipGrowth: {
    month: string;
    newMembers: number;
    totalActive: number;
    expired: number;
  }[];
  attendanceTrend: {
    day: string;
    count: number;
  }[];
  planDistribution: {
    name: string;
    count: number;
    color: string;
    value: number;
  }[];
}

export interface ReportData {
  totalRevenue: number;
  pendingPayments: number;
  newMembers: number;
  expiredMembers: number;
  totalAttendance: number;
  monthlyBreakdown: {
    month: string;
    revenue: number;
    target: number;
    newMembers: number;
    expired: number;
  }[];
}
