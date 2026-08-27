import {
  User,
  Gym,
  MembershipPlan,
  Member,
  Payment,
  AttendanceRecord,
  SmartNotification,
  RenewalRecord,
  GymSettings,
  DashboardStats,
  ReportData,
} from '../types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('gymflow_token');
  const gymId = localStorage.getItem('gymflow_gym_id') || 'gym_ironpulse_01';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (gymId) {
    headers['x-gym-id'] = gymId;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    fetchJSON<{ token: string; user: User; gym: Gym; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: { name: string; email: string; password: string; gymName?: string }) =>
    fetchJSON<{ token: string; user: User; gym: Gym; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => fetchJSON<{ user: User; gym: Gym }>('/auth/me'),

  forgotPassword: (email: string) =>
    fetchJSON<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    fetchJSON<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  updateProfile: (data: any) =>
    fetchJSON<{ success: boolean; gym: Gym; user: User }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data.gymData ? data : { gymData: data }),
    }),

  completeOnboarding: (data: any) =>
    fetchJSON<{ success: boolean; gym: Gym }>('/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboardStats: () => fetchJSON<DashboardStats>('/dashboard/stats'),

  // Plans
  getPlans: () => fetchJSON<MembershipPlan[]>('/plans'),
  createPlan: (data: Partial<MembershipPlan>) =>
    fetchJSON<MembershipPlan>('/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePlan: (id: string, data: Partial<MembershipPlan>) =>
    fetchJSON<MembershipPlan>(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePlan: (id: string) =>
    fetchJSON<{ success: boolean }>(`/plans/${id}`, {
      method: 'DELETE',
    }),

  // Members
  getMembers: (params?: {
    search?: string;
    status?: string;
    planId?: string;
    paymentStatus?: string;
    trainer?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.planId) query.set('planId', params.planId);
    if (params?.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params?.trainer) query.set('trainer', params.trainer);
    return fetchJSON<Member[]>(`/members?${query.toString()}`);
  },

  getMember: (id: string) =>
    fetchJSON<{ member: Member; payments: Payment[]; attendance: AttendanceRecord[]; renewals: RenewalRecord[] }>(
      `/members/${id}`
    ),

  getMemberById: (id: string) => fetchJSON<Member>(`/members/${id}`),

  createMember: (data: any) =>
    fetchJSON<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMember: (id: string, data: Partial<Member>) =>
    fetchJSON<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteMember: (id: string) =>
    fetchJSON<{ success: boolean }>(`/members/${id}`, {
      method: 'DELETE',
    }),

  freezeMember: (id: string, reason?: string, freezeDate?: string) =>
    fetchJSON<Member>(`/members/${id}/freeze`, {
      method: 'POST',
      body: JSON.stringify({ reason, freezeDate }),
    }),

  unfreezeMember: (id: string) =>
    fetchJSON<Member>(`/members/${id}/unfreeze`, {
      method: 'POST',
    }),

  renewMember: (id: string, data: any) =>
    fetchJSON<{ success: boolean; member: Member; renewal: RenewalRecord; payment: Payment }>(`/members/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  renewMembership: (id: string, data: any) =>
    fetchJSON<{ success: boolean; member: Member; renewal: RenewalRecord; payment: Payment }>(`/members/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  calculateExpiry: (params: { startDate?: string; planId?: string; durationMonths?: number; durationDays?: number }) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.planId) query.set('planId', params.planId);
    if (params.durationMonths) query.set('durationMonths', String(params.durationMonths));
    if (params.durationDays) query.set('durationDays', String(params.durationDays));
    return fetchJSON<{ startDate: string; expiryDate: string }>(`/members/calculate-expiry?${query.toString()}`);
  },

  // Payments
  getPayments: (params?: { mode?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.mode) query.set('mode', params.mode);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return fetchJSON<Payment[]>(`/payments?${query.toString()}`);
  },

  createPayment: (data: any) =>
    fetchJSON<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Attendance
  getAttendance: (paramsOrDate?: string | { date?: string; all?: boolean }) => {
    const query = new URLSearchParams();
    if (typeof paramsOrDate === 'string') {
      query.set('date', paramsOrDate);
    } else if (paramsOrDate) {
      if (paramsOrDate.date) query.set('date', paramsOrDate.date);
      if (paramsOrDate.all) query.set('all', 'true');
    }
    return fetchJSON<AttendanceRecord[]>(`/attendance?${query.toString()}`);
  },

  markAttendance: (data: { memberId?: string; memberCode?: string; date?: string; method?: string; notes?: string }) =>
    fetchJSON<{ success: boolean; record: AttendanceRecord; member: Member }>('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAttendanceStats: () =>
    fetchJSON<{ todayCount: number; activeMembersCount: number; totalLogs: number }>('/attendance/stats'),

  // Reports
  getReports: (params?: { period?: string }) => {
    const query = new URLSearchParams();
    if (params?.period) query.set('period', params.period);
    return fetchJSON<ReportData>(`/reports/summary?${query.toString()}`);
  },

  getReportsSummary: () => fetchJSON<ReportData>('/reports/summary'),

  // Notifications
  getNotifications: () => fetchJSON<SmartNotification[]>('/notifications'),
  markNotificationRead: (id: string) => fetchJSON<{ success: boolean }>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => fetchJSON<{ success: boolean }>('/notifications/read-all', { method: 'POST' }),
  runReminderScan: () => fetchJSON<{ success: boolean; message: string; stats: any }>('/notifications/run-scan', { method: 'POST' }),

  // System Date
  setSystemDate: (date: string) =>
    fetchJSON<{ success: boolean; referenceDate: string; stats: any }>('/system/set-date', {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),

  // Settings
  getSettings: () => fetchJSON<GymSettings>('/settings'),
  updateSettings: (data: Partial<GymSettings> | any) =>
    fetchJSON<{ success: boolean; settings?: GymSettings; gym?: Gym }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetDemoDatabase: () => fetchJSON<{ success: boolean; message: string }>('/settings/reset-seeds', { method: 'POST' }),

  // AI Assistant
  askAI: (prompt: string, context?: any) =>
    fetchJSON<{ reply: string }>('/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
    }),

  askAIAssistant: (prompt: string, context?: any) =>
    fetchJSON<{ reply: string }>('/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
    }),
};
