import express, { Request, Response } from 'express';
import { db, calculateExpiryDate } from '../db';
import { reminderEngine } from '../reminderEngine';
import { GoogleGenAI } from '@google/genai';
import {
  Gym,
  Member,
  Payment,
  AttendanceRecord,
  MembershipPlan,
  SmartNotification,
  RenewalRecord,
  GymSettings
} from '../../src/types';

export const apiRouter = express.Router();

// Helper to get active gymId
function getGymId(req: Request): string {
  return (req.headers['x-gym-id'] as string) || 'gym_ironpulse_01';
}

// ----------------------------------------------------
// AUTHENTICATION & PROFILE
// ----------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    // For demo convenience, allow signing in as gym owner
    const newUser = db.createUser({
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      role: 'gym_owner',
      gymId: 'gym_ironpulse_01',
      createdAt: new Date().toISOString(),
    });
    const gym = db.getGym(newUser.gymId);
    return res.json({
      token: `jwt_token_${newUser.id}_${Date.now()}`,
      user: newUser,
      gym,
      message: 'Login successful',
    });
  }

  const gym = db.getGym(user.gymId);
  return res.json({
    token: `jwt_token_${user.id}_${Date.now()}`,
    user,
    gym,
    message: 'Login successful',
  });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, gymName } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const newGymId = `gym_${Date.now()}`;
  const newGym = db.createGym({
    id: newGymId,
    name: gymName || 'My New Gym Club',
    ownerName: name,
    phone: '+1 (555) 000-0000',
    email: email,
    address: '100 Fitness Blvd',
    city: 'Metropolis',
    state: 'State',
    country: 'United States',
    logo: '',
    currency: 'USD',
    taxRate: 0,
    isOnboarded: false,
    createdAt: new Date().toISOString(),
  });

  const newUser = db.createUser({
    id: `user_${Date.now()}`,
    email,
    name,
    role: 'gym_owner',
    gymId: newGymId,
    createdAt: new Date().toISOString(),
  });

  // Seed initial plans for new gym
  db.createPlan({
    id: `plan_m_${Date.now()}`,
    gymId: newGymId,
    name: 'Monthly Standard',
    price: 60,
    durationMonths: 1,
    benefits: ['Full Gym Access', 'Locker Room'],
    color: '#3B82F6',
    active: true,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({
    token: `jwt_token_${newUser.id}_${Date.now()}`,
    user: newUser,
    gym: newGym,
    message: 'Account created successfully',
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const gym = db.getGym(gymId);
  const user = db.getUserById('user_owner_01') || {
    id: 'user_owner_01',
    email: 'owner@gymflow.io',
    name: gym?.ownerName || 'Marcus Vance',
    role: 'gym_owner' as const,
    gymId: gymId,
    createdAt: '2026-01-10T10:00:00Z',
  };
  return res.json({ user, gym });
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  return res.json({
    success: true,
    message: 'Password reset link has been dispatched to your email address.',
  });
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  return res.json({
    success: true,
    message: 'Password has been successfully reset. Please sign in.',
  });
});

// Onboarding setup
apiRouter.post('/onboarding/complete', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const { gymName, ownerName, phone, email, address, city, state, country, logo, currency, taxRate } = req.body;

  const updatedGym = db.updateGym(gymId, {
    name: gymName,
    ownerName,
    phone,
    email,
    address,
    city,
    state,
    country,
    logo,
    currency: currency || 'USD',
    taxRate: Number(taxRate) || 0,
    isOnboarded: true,
  });

  return res.json({ success: true, gym: updatedGym });
});

// Profile update
apiRouter.put('/profile', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const { gymData, userData } = req.body;

  if (gymData) {
    db.updateGym(gymId, gymData);
  }
  if (userData && userData.id) {
    db.updateUser(userData.id, userData);
  }

  const gym = db.getGym(gymId);
  const user = db.getUserById(userData?.id || 'user_owner_01');
  return res.json({ success: true, gym, user });
});

// ----------------------------------------------------
// DASHBOARD
// ----------------------------------------------------
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const stats = db.getDashboardStats(gymId, reminderEngine.getReferenceDate());
  return res.json(stats);
});

// ----------------------------------------------------
// MEMBERSHIP PLANS
// ----------------------------------------------------
apiRouter.get('/plans', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const plans = db.getPlans(gymId);
  return res.json(plans);
});

apiRouter.post('/plans', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const { name, price, durationMonths, durationDays, benefits, color } = req.body;

  if (!name || price === undefined || (!durationMonths && !durationDays)) {
    return res.status(400).json({ error: 'Name, price, and duration are required' });
  }

  const newPlan: MembershipPlan = {
    id: `plan_${Date.now()}`,
    gymId,
    name,
    price: Number(price),
    durationMonths: Number(durationMonths) || 0,
    durationDays: durationDays ? Number(durationDays) : undefined,
    benefits: Array.isArray(benefits) ? benefits : (typeof benefits === 'string' ? benefits.split(',').map(b => b.trim()) : []),
    color: color || '#3B82F6',
    active: true,
    createdAt: new Date().toISOString(),
  };

  const created = db.createPlan(newPlan);
  return res.status(201).json(created);
});

apiRouter.put('/plans/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updatePlan(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  return res.json(updated);
});

apiRouter.delete('/plans/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deletePlan(id);
  return res.json({ success });
});

// ----------------------------------------------------
// AUTO EXPIRY CALCULATION PREVIEW
// ----------------------------------------------------
apiRouter.get('/members/calculate-expiry', (req: Request, res: Response) => {
  const { startDate, planId, durationMonths, durationDays } = req.query;
  const start = (startDate as string) || new Date().toISOString().split('T')[0];

  let months = Number(durationMonths) || 0;
  let days = Number(durationDays) || 0;

  if (planId) {
    const plan = db.getPlanById(planId as string);
    if (plan) {
      months = plan.durationMonths;
      days = plan.durationDays || 0;
    }
  }

  const expiry = calculateExpiryDate(start, months, days);
  return res.json({ startDate: start, expiryDate: expiry });
});

// ----------------------------------------------------
// MEMBERS
// ----------------------------------------------------
apiRouter.get('/members', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const { search, status, planId, paymentStatus, trainer } = req.query;

  const members = db.getMembers(gymId, {
    search: search as string,
    status: status as string,
    planId: planId as string,
    paymentStatus: paymentStatus as string,
    trainer: trainer as string,
  });

  return res.json(members);
});

apiRouter.get('/members/:id', (req: Request, res: Response) => {
  const member = db.getMemberById(req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  return res.json(member);
});

apiRouter.post('/members', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const {
    fullName,
    photo,
    phoneNumber,
    whatsAppNumber,
    email,
    gender,
    age,
    height,
    weight,
    address,
    emergencyContactName,
    emergencyContactPhone,
    joiningDate,
    planId,
    membershipStartDate,
    membershipExpiryDate: customExpiryDate,
    trainerAssigned,
    paymentStatus,
    paidAmount,
    paymentMode,
    notes,
  } = req.body;

  if (!fullName || !phoneNumber || !planId) {
    return res.status(400).json({ error: 'Full name, phone number, and membership plan are required' });
  }

  const plan = db.getPlanById(planId);
  const startDate = membershipStartDate || joiningDate || new Date().toISOString().split('T')[0];
  
  // Auto calculate expiry date if not explicitly overridden
  const expiryDate = customExpiryDate || (plan ? calculateExpiryDate(startDate, plan.durationMonths, plan.durationDays) : calculateExpiryDate(startDate, 1));

  const memberCode = db.getNextMemberCode(gymId);
  const memberId = `mem_${Date.now()}`;

  const newMember: Member = {
    id: memberId,
    gymId,
    memberCode,
    fullName,
    photo: photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    phoneNumber,
    whatsAppNumber: whatsAppNumber || phoneNumber,
    email: email || '',
    gender: gender || 'male',
    age: Number(age) || 25,
    height: height ? Number(height) : undefined,
    weight: weight ? Number(weight) : undefined,
    address: address || '',
    emergencyContactName,
    emergencyContactPhone,
    joiningDate: joiningDate || startDate,
    planId,
    planName: plan?.name || 'Standard Plan',
    membershipStartDate: startDate,
    membershipExpiryDate: expiryDate,
    trainerAssigned: trainerAssigned || 'None',
    paymentStatus: paymentStatus || 'paid',
    notes: notes || '',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = db.createMember(newMember);

  // Record initial payment if specified or plan price exists
  if (plan) {
    const totalAmount = plan.price;
    const paid = paidAmount !== undefined ? Number(paidAmount) : (paymentStatus === 'pending' ? 0 : totalAmount);
    const pending = Math.max(0, totalAmount - paid);

    const payment: Payment = {
      id: `pay_${Date.now()}`,
      gymId,
      memberId: created.id,
      memberName: created.fullName,
      memberCode: created.memberCode,
      planId: plan.id,
      planName: plan.name,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: totalAmount,
      paidAmount: paid,
      pendingAmount: pending,
      paymentDate: startDate,
      mode: paymentMode || 'cash',
      notes: 'Initial registration membership fee',
      receiptNumber: `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString(),
    };
    db.createPayment(payment);
  }

  // Create welcome notification
  db.addNotification({
    id: `notif_${Date.now()}`,
    gymId,
    memberId: created.id,
    memberName: created.fullName,
    title: 'New Member Registered',
    message: `${created.fullName} (${created.memberCode}) enrolled in ${created.planName}. Valid till ${created.membershipExpiryDate}.`,
    type: 'general',
    isRead: false,
    priority: 'low',
    createdAt: new Date().toISOString(),
    actionUrl: `/members?id=${created.id}`,
  });

  return res.status(201).json(created);
});

apiRouter.put('/members/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.getMemberById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Member not found' });
  }

  // If plan changed, recalculate planName
  if (req.body.planId && req.body.planId !== existing.planId) {
    const plan = db.getPlanById(req.body.planId);
    if (plan) {
      req.body.planName = plan.name;
    }
  }

  const updated = db.updateMember(id, req.body);
  return res.json(updated);
});

apiRouter.delete('/members/:id', (req: Request, res: Response) => {
  const success = db.deleteMember(req.params.id);
  return res.json({ success });
});

// Member Freeze / Unfreeze
apiRouter.post('/members/:id/freeze', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason, freezeDate } = req.body;
  const member = db.getMemberById(id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const updated = db.updateMember(id, {
    status: 'frozen',
    freezeReason: reason || 'Requested pause',
    freezeDate: freezeDate || new Date().toISOString().split('T')[0],
  });

  return res.json(updated);
});

apiRouter.post('/members/:id/unfreeze', (req: Request, res: Response) => {
  const { id } = req.params;
  const member = db.getMemberById(id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const updated = db.updateMember(id, {
    status: 'active',
    freezeReason: undefined,
    freezeDate: undefined,
  });

  return res.json(updated);
});

// Member Renewal
apiRouter.post('/members/:id/renew', (req: Request, res: Response) => {
  const { id } = req.params;
  const { planId, startDate, discount, paymentMode, notes } = req.body;

  const member = db.getMemberById(id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const newPlan = db.getPlanById(planId || member.planId);
  if (!newPlan) {
    return res.status(400).json({ error: 'Selected plan not found' });
  }

  // Renewal base start date: if currently active and expiry is in future, renew from expiry date; otherwise from today or selected start date
  const todayStr = reminderEngine.getReferenceDate();
  const currentExpiry = new Date(member.membershipExpiryDate);
  const todayDate = new Date(todayStr);

  let renewalStart = startDate;
  if (!renewalStart) {
    if (member.status === 'active' && currentExpiry >= todayDate) {
      renewalStart = member.membershipExpiryDate;
    } else {
      renewalStart = todayStr;
    }
  }

  const newExpiryDate = calculateExpiryDate(renewalStart, newPlan.durationMonths, newPlan.durationDays);
  const discountAmount = Number(discount) || 0;
  const finalPrice = Math.max(0, newPlan.price - discountAmount);

  // Update member
  const updatedMember = db.updateMember(member.id, {
    planId: newPlan.id,
    planName: newPlan.name,
    membershipStartDate: renewalStart,
    membershipExpiryDate: newExpiryDate,
    status: 'active',
    paymentStatus: 'paid',
  });

  // Create renewal record
  const renewalRecord: RenewalRecord = {
    id: `ren_${Date.now()}`,
    gymId: member.gymId,
    memberId: member.id,
    memberName: member.fullName,
    memberCode: member.memberCode,
    previousPlanId: member.planId,
    previousPlanName: member.planName || 'Previous Plan',
    newPlanId: newPlan.id,
    newPlanName: newPlan.name,
    previousExpiryDate: member.membershipExpiryDate,
    newExpiryDate: newExpiryDate,
    renewalDate: todayStr,
    amount: finalPrice,
    discount: discountAmount,
    renewedBy: 'Gym Owner',
    createdAt: new Date().toISOString(),
  };
  db.createRenewal(renewalRecord);

  // Create payment record
  const payment: Payment = {
    id: `pay_${Date.now()}`,
    gymId: member.gymId,
    memberId: member.id,
    memberName: member.fullName,
    memberCode: member.memberCode,
    planId: newPlan.id,
    planName: newPlan.name,
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    amount: newPlan.price,
    paidAmount: finalPrice,
    pendingAmount: 0,
    paymentDate: todayStr,
    mode: paymentMode || 'cash',
    notes: notes || `Membership Renewal for ${newPlan.name}${discountAmount > 0 ? ` (Discount: $${discountAmount})` : ''}`,
    receiptNumber: `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
    createdAt: new Date().toISOString(),
  };
  db.createPayment(payment);

  // Add notification
  db.addNotification({
    id: `notif_${Date.now()}`,
    gymId: member.gymId,
    memberId: member.id,
    memberName: member.fullName,
    title: 'Membership Renewed',
    message: `${member.fullName} renewed their ${newPlan.name} membership until ${newExpiryDate}.`,
    type: 'renewal',
    isRead: false,
    priority: 'low',
    createdAt: new Date().toISOString(),
    actionUrl: `/members?id=${member.id}`,
  });

  return res.json({
    success: true,
    member: updatedMember,
    renewal: renewalRecord,
    payment,
  });
});

// ----------------------------------------------------
// PAYMENTS & RECEIPTS
// ----------------------------------------------------
apiRouter.get('/payments', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const payments = db.getPayments(gymId);
  return res.json(payments);
});

apiRouter.post('/payments', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const { memberId, planId, amount, paidAmount, paymentDate, mode, notes } = req.body;

  if (!memberId || amount === undefined || paidAmount === undefined) {
    return res.status(400).json({ error: 'Member, total amount, and paid amount are required' });
  }

  const member = db.getMemberById(memberId);
  const plan = planId ? db.getPlanById(planId) : (member ? db.getPlanById(member.planId) : undefined);

  const total = Number(amount);
  const paid = Number(paidAmount);
  const pending = Math.max(0, total - paid);

  const payment: Payment = {
    id: `pay_${Date.now()}`,
    gymId,
    memberId,
    memberName: member?.fullName || 'Member',
    memberCode: member?.memberCode || 'GF-0000',
    planId: plan?.id || member?.planId || 'plan_general',
    planName: plan?.name || member?.planName || 'General Payment',
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    amount: total,
    paidAmount: paid,
    pendingAmount: pending,
    paymentDate: paymentDate || reminderEngine.getReferenceDate(),
    mode: mode || 'cash',
    notes: notes || '',
    receiptNumber: `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
    createdAt: new Date().toISOString(),
  };

  const created = db.createPayment(payment);
  return res.status(201).json(created);
});

// ----------------------------------------------------
// ATTENDANCE
// ----------------------------------------------------
apiRouter.get('/attendance', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const { date, all } = req.query;

  if (all === 'true') {
    const list = db.getAllAttendance(gymId);
    return res.json(list);
  }

  const targetDate = (date as string) || reminderEngine.getReferenceDate();
  const list = db.getAttendance(gymId, targetDate);
  return res.json(list);
});

apiRouter.post('/attendance/mark', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const { memberId, memberCode, date, method, notes } = req.body;

  let member = memberId ? db.getMemberById(memberId) : undefined;
  if (!member && memberCode) {
    const all = db.getMembers(gymId);
    member = all.find(m => m.memberCode.toLowerCase() === memberCode.toLowerCase());
  }

  if (!member) {
    return res.status(404).json({ error: 'Member not found for given ID or Code' });
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const targetDate = date || reminderEngine.getReferenceDate();

  const record: AttendanceRecord = {
    id: `att_${Date.now()}`,
    gymId,
    memberId: member.id,
    memberName: member.fullName,
    memberCode: member.memberCode,
    date: targetDate,
    checkInTime: timeStr,
    status: 'present',
    method: method || 'manual',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  const saved = db.markAttendance(record);
  return res.json({ success: true, record: saved, member });
});

apiRouter.get('/attendance/stats', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const refDate = reminderEngine.getReferenceDate();
  const todayList = db.getAttendance(gymId, refDate);
  const all = db.getAllAttendance(gymId);
  const members = db.getMembers(gymId);

  return res.json({
    todayCount: todayList.length,
    activeMembersCount: members.filter(m => m.status === 'active').length,
    totalLogs: all.length,
  });
});

// ----------------------------------------------------
// REPORTS & ANALYTICS
// ----------------------------------------------------
apiRouter.get('/reports/summary', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const refDate = reminderEngine.getReferenceDate();
  const members = db.getMembers(gymId);
  const payments = db.getPayments(gymId);
  const renewals = db.getRenewals(gymId);
  const attendance = db.getAllAttendance(gymId);
  const plans = db.getPlans(gymId);

  const totalRevenue = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPending = payments.reduce((sum, p) => sum + p.pendingAmount, 0);

  const expiredMembers = members.filter(m => m.status === 'expired' || new Date(m.membershipExpiryDate) < new Date(refDate));
  const activeMembers = members.filter(m => m.status === 'active');

  // Plan Sales breakdown
  const planSales: Record<string, { planName: string; count: number; totalRevenue: number; color: string }> = {};
  plans.forEach(p => {
    planSales[p.id] = { planName: p.name, count: 0, totalRevenue: 0, color: p.color };
  });

  payments.forEach(p => {
    if (planSales[p.planId]) {
      planSales[p.planId].count++;
      planSales[p.planId].totalRevenue += p.paidAmount;
    }
  });

  // Payment Mode breakdown
  const paymentModes = {
    cash: payments.filter(p => p.mode === 'cash').reduce((sum, p) => sum + p.paidAmount, 0),
    upi: payments.filter(p => p.mode === 'upi').reduce((sum, p) => sum + p.paidAmount, 0),
    card: payments.filter(p => p.mode === 'card').reduce((sum, p) => sum + p.paidAmount, 0),
    online: payments.filter(p => p.mode === 'online').reduce((sum, p) => sum + p.paidAmount, 0),
  };

  return res.json({
    totalRevenue,
    totalPending,
    totalMembers: members.length,
    activeMembersCount: activeMembers.length,
    expiredMembersCount: expiredMembers.length,
    renewalsCount: renewals.length,
    attendanceCount: attendance.length,
    planSales: Object.values(planSales),
    paymentModes,
    membersList: members,
    paymentsList: payments,
    renewalsList: renewals,
  });
});

// ----------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const notifs = db.getNotifications(gymId);
  return res.json(notifs);
});

apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  const success = db.markNotificationAsRead(req.params.id);
  return res.json({ success });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  db.markAllNotificationsRead(gymId);
  return res.json({ success: true });
});

apiRouter.post('/notifications/run-scan', (req: Request, res: Response) => {
  const result = reminderEngine.runDailyCheck();
  return res.json({
    success: true,
    message: `Reminder engine scan completed. Scanned ${result.scannedMembers} members, generated ${result.generatedCount} notifications.`,
    stats: result,
  });
});

apiRouter.post('/system/set-date', (req: Request, res: Response) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });
  const stats = reminderEngine.setReferenceDate(date);
  return res.json({ success: true, referenceDate: date, stats });
});

// ----------------------------------------------------
// SETTINGS & BACKUP
// ----------------------------------------------------
apiRouter.get('/settings', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const settings = db.getSettings(gymId);
  return res.json(settings);
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const gymId = getGymId(req);
  const updated = db.updateSettings(gymId, req.body);
  return res.json(updated);
});

apiRouter.post('/settings/reset-seeds', (req: Request, res: Response) => {
  db.resetDatabase();
  return res.json({ success: true, message: 'Database reset to initial demo seeds successfully' });
});

// ----------------------------------------------------
// AI ASSISTANT (Gemini Integration + Smart Copilot Engine)
// ----------------------------------------------------
function getGeminiClient(): GoogleGenAI | null {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  apiKey = apiKey.replace(/^["']|["']$/g, '').trim();
  return new GoogleGenAI({ apiKey });
}

// AI Engine (Gemini Integration)
apiRouter.post('/ai-assistant/chat', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const gymId = getGymId(req);
  const gym = db.getGym(gymId);
  const members = db.getMembers(gymId);
  const stats = db.getDashboardStats(gymId, reminderEngine.getReferenceDate());
  const plans = db.getPlans(gymId);
  const payments = db.getPayments(gymId);
  const attendance = db.getAllAttendance(gymId);
  const refDate = reminderEngine.getReferenceDate();

  try {
    const ai = getGeminiClient();
    
    if (!ai) {
      return res.json({ 
        reply: "To enable the GymFlow AI Copilot, please configure your `GEMINI_API_KEY` in the environment variables.", 
        source: 'system' 
      });
    }

    const expiringTodayList = members.filter((m) => m.membershipExpiryDate === refDate);
    const today = new Date(refDate);
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);
    const expiringWeekList = members.filter((m) => {
      const exp = new Date(m.membershipExpiryDate);
      return exp >= today && exp <= in7Days;
    });
    const pendingList = members.filter((m) => m.paymentStatus === 'pending' || m.paymentStatus === 'partial');

    const systemContext = `You are GymFlow AI Business & Retention Copilot, a highly intelligent and conversational gym operations and retention strategist assisting gym owner "${gym?.ownerName || 'Marcus'}" at "${gym?.name || 'IronPulse Fitness'}".

Current Live Gym Data (System Date: ${refDate}):
- Gym: ${gym?.name || 'IronPulse Fitness'}, Owner: ${gym?.ownerName || 'Marcus'}, Currency: ${gym?.currency || 'USD'}
- Total Members: ${stats.totalMembers} (${stats.activeMembers} active, ${stats.expiredMembers} expired)
- Expiring Today (${expiringTodayList.length}): ${expiringTodayList.map(m => `${m.fullName} [${m.memberCode}, ${m.planName}, Phone: ${m.phoneNumber}]`).join(', ') || 'None'}
- Expiring This Week (${expiringWeekList.length}): ${expiringWeekList.map(m => `${m.fullName} [${m.memberCode}, expires ${m.membershipExpiryDate}, ${m.planName}]`).join(', ') || 'None'}
- Monthly Inflow: ${stats.monthlyRevenue} | Outstanding Pending Balances: ${stats.pendingPayments}
- Members with Overdue/Pending fees: ${pendingList.map(m => `${m.fullName} (${m.memberCode})`).join(', ') || 'None'}
- Today's Check-ins: ${stats.todayAttendance} members
- Plans in Catalogue: ${plans.map(p => `${p.name} (${p.price} for ${p.durationMonths}m)`).join(', ')}

Guidelines:
1. Act as a conversational, helpful, and natural AI assistant (like ChatGPT), providing dynamic responses tailored directly to the user's specific query. Do not just return a default operational snapshot unless explicitly asked for an overview.
2. Provide actionable, concise, well-structured advice using clear Markdown (headings, bullet points, code blocks for WhatsApp/SMS copy).
3. When asked about expiring members, revenue, or retention, analyze the provided data context and cite actual member names and dates dynamically.
4. When drafting messages, include ready-to-copy WhatsApp/SMS text with high-conversion phrasing.
5. Answer general questions dynamically and conversationally.
6. Maintain a supportive, energetic, professional tone suitable for a gym owner.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt.trim(),
        config: {
          systemInstruction: systemContext,
        },
      });

      if (response && response.text) {
        return res.json({ reply: response.text, source: 'gemini-3.7-flash' });
      }
    } catch (geminiError: any) {
      const isAuthError = 
        geminiError?.status === 401 || 
        geminiError?.status === 'UNAUTHENTICATED' ||
        geminiError?.message?.includes('UNAUTHENTICATED') ||
        geminiError?.message?.includes('invalid authentication credentials');

      if (isAuthError) {
        return res.json({ 
          reply: "⚠️ Authentication Failed: Your `GEMINI_API_KEY` is invalid or missing. Please update your environment variables to use the AI Copilot.", 
          source: 'system' 
        });
      } else {
        console.warn('Gemini 3.7 flash attempt error, trying fallback model:', geminiError?.message || geminiError);
        // Fallback to gemini-3.1-pro-preview
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: `${systemContext}\n\nUser Question: ${prompt.trim()}`,
          });
          if (fallbackResponse && fallbackResponse.text) {
            return res.json({ reply: fallbackResponse.text, source: 'gemini-3.1-pro-preview' });
          }
        } catch (secondaryError: any) {
          console.warn('Secondary Gemini model error:', secondaryError?.message || secondaryError);
          return res.json({ 
            reply: "The AI models are currently experiencing an error. Please try again later.", 
            source: 'system' 
          });
        }
      }
    }
  } catch (outerErr) {
    console.error('Gemini client execution errored:', outerErr);
    return res.status(500).json({ error: 'Failed to process AI request.' });
  }

  return res.json({ reply: "I'm sorry, I couldn't process that request at this moment.", source: 'system' });
});
