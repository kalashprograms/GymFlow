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
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Resilient Fallback Intelligence Generator for GymFlow
function generateGymFlowSmartResponse(
  prompt: string,
  gym: Gym | undefined,
  stats: any,
  members: Member[],
  plans: MembershipPlan[],
  payments: Payment[],
  attendance: AttendanceRecord[],
  refDate: string
): string {
  const q = prompt.toLowerCase().trim();
  const gymName = gym?.name || 'IronPulse Fitness';
  const ownerName = gym?.ownerName || 'Marcus';
  const currency = gym?.currency || '$';

  // Helper date calculations
  const todayStr = refDate;
  const today = new Date(todayStr);
  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);

  // ----------------------------------------------------
  // INTENT 1: COPYWRITING & MESSAGE DRAFTING (WhatsApp / SMS / Scripts / Discount Copy)
  // ----------------------------------------------------
  const isDraftingIntent =
    q.includes('draft') ||
    q.includes('write') ||
    q.includes('script') ||
    q.includes('template') ||
    q.includes('whatsapp') ||
    q.includes('sms') ||
    q.includes('message') ||
    q.includes('copy') ||
    q.includes('text to send') ||
    q.includes('what should i say') ||
    q.includes('say to');

  if (isDraftingIntent) {
    // Check if user specifically requested a discount (e.g. 10%, 15%, 20%, discount, promo, offer)
    const hasDiscountRequest =
      q.includes('discount') ||
      q.includes('10%') ||
      q.includes('15%') ||
      q.includes('20%') ||
      q.includes('offer') ||
      q.includes('promo') ||
      q.includes('deal') ||
      q.includes('coupon');

    const discountRate = q.includes('15%')
      ? '15%'
      : q.includes('20%')
      ? '20%'
      : q.includes('25%')
      ? '25%'
      : '10%';

    if (hasDiscountRequest) {
      return `### 💬 High-Converting ${discountRate} Discount WhatsApp & SMS Templates for ${gymName}

Here are 4 ready-to-copy message variations tailored for different member segments. Simply copy and paste them directly into WhatsApp:

---

#### 🚀 Option 1: Early-Bird ${discountRate} Renewal Offer (For Members Expiring in 1–7 Days)
*Best sent 3 to 5 days prior to expiry.*

\`\`\`text
Hey [Member Name]! 💪

Marcus from ${gymName} here. You've been crushing your workouts lately! 

Your current membership is coming up for renewal on [Expiry Date]. To celebrate your dedication, we've unlocked a private early-bird perk for you:

🔥 RENEW BEFORE [Expiry Date] & GET ${discountRate} OFF ANY MULTI-MONTH PLAN!
⚡ Lock in your savings:
• Quarterly Plan: Save ${currency}25
• Annual Plan: Save ${currency}80+

Reply "RENEW" or tap here to claim your discount: https://gymflow.app/pay/${gym?.id || 'demo'}

Keep lifting strong! 🏋️‍♂️
— Marcus & Team ${gymName}
\`\`\`

---

#### 🚨 Option 2: 24-Hour Last Chance ${discountRate} Saver (Expiring Today / Tomorrow)
*Best sent on the morning of expiry.*

\`\`\`text
Hi [Member Name]! ⚠️

Friendly reminder that your ${gymName} access pass expires TODAY ([Expiry Date]).

We want to make sure your biometric check-in and locker privileges continue without a pause:
🎁 Renew within the next 24 hours to claim your ${discountRate} Loyalty Waiver!

👉 Instant UPI / Card Renewal: https://gymflow.app/pay/${gym?.id || 'demo'}
Or show this message at the front desk when you come in today.

See you on the gym floor!
\`\`\`

---

#### 🎯 Option 3: "We Miss You" ${discountRate} Win-Back Special (For Inactive / Expired Members)
*Best sent to members whose membership lapsed 7–30 days ago.*

\`\`\`text
Hey [Member Name]! 👋 

The barbell rack at ${gymName} is missing you! We know life gets busy, but your fitness goals are waiting for you.

Come back this week and we'll welcome you with:
✅ ${discountRate} OFF any Quarterly or Half-Yearly pass
✅ 100% WAIVER on the reactivation / registration fee
✅ 1 Free Personal Training Strategy Session

Ready to jump back in? Reply "I'M IN" and we'll reactivate your profile today! 💥
\`\`\`

---

#### 👑 Option 4: VIP Upgrade & Long-Term Loyalty Perk (For Regulars)
*Best sent to active members wanting to upgrade from Monthly to Annual.*

\`\`\`text
Hi [Member Name]! 🌟 

As one of our most consistent members at ${gymName}, you've earned VIP Tier status. 

Upgrade to our Annual Pass this week and enjoy:
✨ Flat ${discountRate} instant discount
✨ 2 Free Guest Passes for your workout partners
✨ Complimentary locker allocation

Reply "UPGRADE" and let's lock in your lowest yearly rate!
\`\`\`

---
💡 **Pro-Tip for Maximum Conversions:** Messages sent between **09:00 AM – 10:30 AM** or **05:00 PM – 06:30 PM** see an average **42% higher response rate** on WhatsApp.`;
    }

    // Standard reminder / notification drafts (without specific discount)
    return `### 💬 Ready-to-Send WhatsApp & SMS Reminder Templates for ${gymName}

Here are professionally formatted notification scripts ready to copy and send:

---

#### ⏳ 1. Gentle Advance Reminder (3–5 Days Before Expiry)
\`\`\`text
Hi [Member Name]! 👋 

This is Marcus from ${gymName}. Friendly heads-up that your [Plan Name] is scheduled to renew on [Expiry Date].

To ensure uninterrupted access to the gym, locker facilities, and group classes, you can renew early at the front desk or via UPI: https://gymflow.app/pay/${gym?.id || 'demo'}

Keep up the great consistency! 💪
\`\`\`

---

#### 🚨 2. Urgent Day-Of Expiry Reminder (Expiring Today)
\`\`\`text
Hi [Member Name], 

Your membership at ${gymName} expires TODAY ([Expiry Date]). 🏋️‍♂️

Please stop by the front desk during your workout today or renew online to prevent any automatic turnstile/biometric lockout:
👉 Renew Now: https://gymflow.app/pay/${gym?.id || 'demo'}

Let us know if you need any assistance!
\`\`\`

---

#### 💰 3. Pending Fee / Balance Payment Follow-up
\`\`\`text
Dear [Member Name], 

Greetings from ${gymName}. This is a gentle reminder regarding your outstanding balance of ${currency}[Pending Amount] for your [Plan Name].

Kindly clear the balance at your earliest convenience via the desk or UPI to keep your account active and in good standing.

Thank you for your cooperation! 🙏
\`\`\`
`;
  }

  // ----------------------------------------------------
  // INTENT 2: WHO IS EXPIRING & RETENTION ROSTER LIST
  // ----------------------------------------------------
  const isExpiryRosterIntent =
    q.includes('expir') ||
    q.includes('who is') ||
    q.includes('who need') ||
    q.includes('which member') ||
    q.includes('list member') ||
    q.includes('due this week') ||
    q.includes('renew this week') ||
    q.includes('upcoming renewal');

  if (isExpiryRosterIntent) {
    const expiringTodayList = members.filter((m) => m.membershipExpiryDate === todayStr && m.status !== 'frozen');
    
    const expiringIn1to3Days = members.filter((m) => {
      const exp = new Date(m.membershipExpiryDate);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 1 && diffDays <= 3 && m.status === 'active';
    });

    const expiringIn4to7Days = members.filter((m) => {
      const exp = new Date(m.membershipExpiryDate);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 4 && diffDays <= 7 && m.status === 'active';
    });

    const totalExpiringThisWeek = expiringTodayList.length + expiringIn1to3Days.length + expiringIn4to7Days.length;

    const alreadyExpiredRecent = members.filter((m) => {
      const exp = new Date(m.membershipExpiryDate);
      const diffDays = Math.ceil((today.getTime() - exp.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 14 && (m.status === 'expired' || m.status === 'active');
    });

    let res = `### 📋 Members Expiring This Week & Retention Follow-up List\n\n`;
    res += `**Reference System Date:** \`${todayStr}\` | **Total Expiring in Next 7 Days:** \`${totalExpiringThisWeek} Member(s)\`\n\n`;

    // 1. Expiring Today
    if (expiringTodayList.length > 0) {
      res += `#### 🚨 Priority 1: Expiring TODAY (${expiringTodayList.length} Member${expiringTodayList.length > 1 ? 's' : ''})\n`;
      res += `*Action: Reach out immediately before evening gym shift to prevent turnstile lockout.*\n\n`;
      expiringTodayList.forEach((m) => {
        res += `- **${m.fullName}** (\`${m.memberCode}\`)\n`;
        res += `  - **Plan:** *${m.planName || 'Standard'}* | Payment: \`${m.paymentStatus.toUpperCase()}\`\n`;
        res += `  - **Phone:** \`${m.phoneNumber}\`\n`;
        res += `  - **Status:** ⚠️ \`Expiring Today (${todayStr})\`\n\n`;
      });
    } else {
      res += `#### 🚨 Priority 1: Expiring TODAY\n✅ *No memberships expiring exactly today (${todayStr}).*\n\n`;
    }

    // 2. Expiring in 1-3 Days
    if (expiringIn1to3Days.length > 0) {
      res += `#### ⏳ Priority 2: Expiring in 1–3 Days (${expiringIn1to3Days.length} Members)\n`;
      res += `*Action: Send our standard 10% early renewal WhatsApp message.*\n\n`;
      expiringIn1to3Days.forEach((m) => {
        const exp = new Date(m.membershipExpiryDate);
        const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        res += `- **${m.fullName}** (\`${m.memberCode}\`) — **${daysLeft} day${daysLeft > 1 ? 's' : ''} left** (Expires: \`${m.membershipExpiryDate}\`)\n`;
        res += `  - Plan: *${m.planName}* | Phone: \`${m.phoneNumber}\`\n`;
      });
      res += `\n`;
    }

    // 3. Expiring in 4-7 Days
    if (expiringIn4to7Days.length > 0) {
      res += `#### 📅 Priority 3: Expiring in 4–7 Days (${expiringIn4to7Days.length} Members)\n`;
      res += `*Action: Schedule reminder queue for automatic WhatsApp delivery.*\n\n`;
      expiringIn4to7Days.forEach((m) => {
        const exp = new Date(m.membershipExpiryDate);
        const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        res += `- **${m.fullName}** (\`${m.memberCode}\`) — **${daysLeft} days left** (Expires: \`${m.membershipExpiryDate}\`)\n`;
        res += `  - Plan: *${m.planName}* | Phone: \`${m.phoneNumber}\`\n`;
      });
      res += `\n`;
    }

    // 4. Recently Expired
    if (alreadyExpiredRecent.length > 0) {
      res += `#### ⚠️ Recently Expired Members (Past 14 Days - ${alreadyExpiredRecent.length} Members)\n`;
      res += `*Action: Target with our "We Miss You" win-back offer.*\n\n`;
      alreadyExpiredRecent.slice(0, 5).forEach((m) => {
        res += `- **${m.fullName}** (\`${m.memberCode}\`) — Expired on: \`${m.membershipExpiryDate}\` | Plan: *${m.planName}* | Phone: \`${m.phoneNumber}\`\n`;
      });
      if (alreadyExpiredRecent.length > 5) {
        res += `- *...and ${alreadyExpiredRecent.length - 5} more in the Members table.*\n`;
      }
      res += `\n`;
    }

    res += `> 💡 **Next Step:** You can click the green **WhatsApp icon** next to any member in the **Members Tab** or open the **Expiry Calendar** to dispatch renewal messages directly!`;
    return res;
  }

  // ----------------------------------------------------
  // INTENT 3: FINANCIALS, REVENUE & PENDING BALANCES
  // ----------------------------------------------------
  if (
    q.includes('revenue') ||
    q.includes('financial') ||
    q.includes('pending') ||
    q.includes('income') ||
    q.includes('money') ||
    q.includes('collection') ||
    q.includes('sales') ||
    q.includes('earnings')
  ) {
    const totalCollected = payments.reduce((acc, p) => acc + p.paidAmount, 0);
    const totalPending = payments.reduce((acc, p) => acc + p.pendingAmount, 0);
    const modeTotals = {
      cash: payments.filter((p) => p.mode === 'cash').reduce((acc, p) => acc + p.paidAmount, 0),
      upi: payments.filter((p) => p.mode === 'upi').reduce((acc, p) => acc + p.paidAmount, 0),
      card: payments.filter((p) => p.mode === 'card').reduce((acc, p) => acc + p.paidAmount, 0),
      online: payments.filter((p) => p.mode === 'online').reduce((acc, p) => acc + p.paidAmount, 0),
    };

    const pendingMembers = members.filter((m) => m.paymentStatus === 'pending' || m.paymentStatus === 'partial');

    return `### 💰 Financial & Revenue Intelligence for ${gymName}

#### 📊 Revenue Breakdown:
- **Total Lifetime Revenue Collected:** \`${currency}${totalCollected.toLocaleString()}\`
- **Current Month Estimated Inflow:** \`${currency}${stats.monthlyRevenue.toLocaleString()}\`
- **Total Outstanding Pending Dues:** \`${currency}${totalPending.toLocaleString()}\`
- **Active Paying Members:** \`${stats.activeMembers} / ${stats.totalMembers}\`

#### 💳 Collections by Payment Mode:
| Mode | Total Volume | Share |
| :--- | :--- | :--- |
| **Cash** | ${currency}${modeTotals.cash.toLocaleString()} | ${totalCollected > 0 ? ((modeTotals.cash / totalCollected) * 100).toFixed(1) : 0}% |
| **UPI / QR** | ${currency}${modeTotals.upi.toLocaleString()} | ${totalCollected > 0 ? ((modeTotals.upi / totalCollected) * 100).toFixed(1) : 0}% |
| **Credit/Debit Card** | ${currency}${modeTotals.card.toLocaleString()} | ${totalCollected > 0 ? ((modeTotals.card / totalCollected) * 100).toFixed(1) : 0}% |
| **Online / Transfer** | ${currency}${modeTotals.online.toLocaleString()} | ${totalCollected > 0 ? ((modeTotals.online / totalCollected) * 100).toFixed(1) : 0}% |

${
  pendingMembers.length > 0
    ? `#### ⚠️ Members with Pending Balances (${pendingMembers.length}):\n` +
      pendingMembers
        .map(
          (m) =>
            `- **${m.fullName}** (\`${m.memberCode}\`) — Plan: *${m.planName}* | Phone: \`${m.phoneNumber}\` | Status: \`${m.paymentStatus.toUpperCase()}\``
        )
        .join('\n')
    : '✅ No members with overdue pending fee balances!'
}

> 💡 **Cash Flow Strategy:** Encourage upfront Quarterly and Annual subscriptions by bundling complimentary personal training sessions or gym merchandise.`;
  }

  // ----------------------------------------------------
  // INTENT 4: ATTENDANCE & PEAK TRAFFIC HOURS
  // ----------------------------------------------------
  if (
    q.includes('attendance') ||
    q.includes('check-in') ||
    q.includes('peak') ||
    q.includes('crowd') ||
    q.includes('traffic') ||
    q.includes('hours') ||
    q.includes('turnout')
  ) {
    const todayLogs = attendance.filter((a) => a.date === refDate);
    const activeCount = members.filter((m) => m.status === 'active').length;
    const attendanceRate = activeCount > 0 ? Math.round((todayLogs.length / activeCount) * 100) : 0;

    return `### 🏋️ Attendance & Facility Traffic Analytics

- **Today's Check-ins:** \`${todayLogs.length} members\` on \`${refDate}\`
- **Active Member Daily Turnout:** \`${attendanceRate}%\` (${todayLogs.length} / ${activeCount} active members)
- **Total Recorded Attendance Logs:** \`${attendance.length}\`

#### ⏰ Estimated Gym Floor Traffic Distribution:
- 🌅 **Early Morning Peak (06:00 AM – 09:30 AM):** High cardio & strength volume (~40% of total daily traffic)
- ☀️ **Mid-Day Lull (11:00 AM – 04:00 PM):** Optimal window for deep sanitization, equipment maintenance, & personal training
- 🌆 **Evening Prime Peak (05:30 PM – 09:30 PM):** Heaviest load (~50% of daily traffic), barbell and rack queues

> 💡 **Facility Management Tip:** Schedule floor trainers during the 06:00–09:00 PM evening rush to supervise form, assist spotters, and maximize member engagement.`;
  }

  // ----------------------------------------------------
  // INTENT 5: WORKOUT & NUTRITION PROGRAMMING
  // ----------------------------------------------------
  if (
    q.includes('workout') ||
    q.includes('exercise') ||
    q.includes('routine') ||
    q.includes('diet') ||
    q.includes('nutrition') ||
    q.includes('split') ||
    q.includes('training') ||
    q.includes('meal')
  ) {
    return `### 📋 Comprehensive Member Training & Nutrition Guide

#### 🏋️ 4-Day Upper / Lower Hypertrophy Split:
- **Day 1: Upper Body Power**
  - Barbell Bench Press: 4 sets × 6–8 reps
  - Bent-Over Barbell Rows: 4 sets × 6–8 reps
  - Overhead Standing Dumbbell Press: 3 sets × 8–10 reps
  - Lat Pulldowns: 3 sets × 10–12 reps
  - Triceps Cable Pushdowns & Bicep Curls Super-set: 3 sets × 12–15 reps
- **Day 2: Lower Body Strength**
  - Barbell Squats: 4 sets × 6–8 reps
  - Romanian Deadlifts (RDLs): 3 sets × 8–10 reps
  - Leg Press / Walking Dumbbell Lunges: 3 sets × 12 reps
  - Standing Calf Raises & Hanging Leg Raises: 4 sets × 15 reps
- **Day 3: Active Recovery / Cardio & Core**
- **Day 4: Upper Body Hypertrophy (Pump & Volume)**
  - Incline Dumbbell Press: 4 sets × 10–12 reps
  - Cable Seated Rows: 4 sets × 10–12 reps
  - Dumbbell Lateral Raises: 4 sets × 15 reps
  - Incline Dumbbell Curls & Skull Crushers: 3 sets × 12 reps
- **Day 5: Lower Body & Glutes/Hamstrings**
  - Leg Curls & Leg Extensions: 3 sets × 12–15 reps
  - Bulgarian Split Squats: 3 sets × 10 reps/leg
  - Standing Calves & Plank Holds: 3 rounds

#### 🥗 Balanced Macro Nutrition Blueprint (Target: Lean Recomposition):
- **Protein Intake:** 1.6g – 2.0g per kg of body weight (Chicken breast, eggs, whey, Greek yogurt, paneer/tofu, lentils)
- **Carbohydrates:** 40–45% of total caloric intake from slow-digesting complex carbs (Oats, brown rice, sweet potatoes, quinoa)
- **Healthy Fats:** 25–30% (Avocados, extra virgin olive oil, almonds, walnuts, flaxseeds)
- **Hydration:** Minimum 3.5 to 4 Liters of water daily + electrolyte replenishment post-workout.`;
  }

  // ----------------------------------------------------
  // INTENT 6: DEFAULT EXECUTIVE OVERVIEW
  // ----------------------------------------------------
  return `### 🤖 ${gymName} AI Business Copilot Analysis

Hello **${ownerName}**! Here is an executive operational snapshot for **${gymName}** based on real-time database records:

#### 📌 Executive Summary:
- **Total Registered Members:** \`${stats.totalMembers}\` (\`${stats.activeMembers}\` active, \`${stats.expiredMembers}\` expired)
- **Expiring Today:** \`${stats.expiringToday} member(s)\`
- **Expiring This Week:** \`${stats.expiringThisWeek} member(s)\`
- **Monthly Revenue:** \`${currency}${stats.monthlyRevenue.toLocaleString()}\`
- **Outstanding Pending Dues:** \`${currency}${stats.pendingPayments.toLocaleString()}\`

#### 🎯 Strategic Priority Actions for Today:
1. **Urgent Expiries:** Reach out to the **${stats.expiringToday}** member(s) expiring today with a same-day renewal bonus.
2. **Follow-Up Pipeline:** Send our automated WhatsApp reminder script to the **${stats.expiringThisWeek}** members expiring within the next 7 days.
3. **Pending Collections:** Collect the **${currency}${stats.pendingPayments}** in outstanding dues via the Payments tab.
4. **Member Re-engagement:** Send a win-back discount offer to the **${stats.expiredMembers}** inactive/expired members.

*You can ask me to draft WhatsApp messages, analyze revenue, list expiring members, or generate custom workout plans!*`;
}

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

  // Try calling Gemini models if API Key is available
  try {
    const ai = getGeminiClient();
    if (ai) {
      const expiringTodayList = members.filter((m) => m.membershipExpiryDate === refDate);
      const today = new Date(refDate);
      const in7Days = new Date(today);
      in7Days.setDate(today.getDate() + 7);
      const expiringWeekList = members.filter((m) => {
        const exp = new Date(m.membershipExpiryDate);
        return exp >= today && exp <= in7Days;
      });
      const pendingList = members.filter((m) => m.paymentStatus === 'pending' || m.paymentStatus === 'partial');

      const systemContext = `You are GymFlow AI Business & Retention Copilot, an elite gym operations and retention strategist assisting gym owner "${gym?.ownerName || 'Marcus'}" at "${gym?.name || 'IronPulse Fitness'}".

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
1. Provide actionable, concise, well-structured advice using clear Markdown (headings, bullet points, code blocks for WhatsApp/SMS copy).
2. When asked about expiring members or retention, cite actual member names and dates from the data.
3. When drafting messages, include ready-to-copy WhatsApp/SMS text with high-conversion phrasing.
4. Maintain a supportive, energetic, professional tone suitable for a gym owner.`;

      // Try primary model (gemini-2.5-flash)
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt.trim(),
          config: {
            systemInstruction: systemContext,
          },
        });

        if (response && response.text) {
          return res.json({ reply: response.text, source: 'gemini-2.5-flash' });
        }
      } catch (geminiError: any) {
        console.warn('Gemini 2.5 flash attempt error, trying fallback model:', geminiError?.message || geminiError);
        // Fallback to gemini-2.0-flash
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `${systemContext}\n\nUser Question: ${prompt.trim()}`,
          });
          if (fallbackResponse && fallbackResponse.text) {
            return res.json({ reply: fallbackResponse.text, source: 'gemini-2.0-flash' });
          }
        } catch (secondaryError) {
          console.warn('Secondary Gemini model error:', secondaryError);
        }
      }
    }
  } catch (outerErr) {
    console.warn('Gemini client execution skipped or errored:', outerErr);
  }

  // Graceful fallback to GymFlow Smart Intelligence Engine
  // This guarantees 100% uptime with rich, accurate gym analytics
  const smartReply = generateGymFlowSmartResponse(
    prompt.trim(),
    gym,
    stats,
    members,
    plans,
    payments,
    attendance,
    refDate
  );

  return res.json({ reply: smartReply, source: 'gymflow_engine' });
});
