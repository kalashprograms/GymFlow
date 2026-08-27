import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
  DashboardStats
} from '../src/types';

interface DatabaseSchema {
  users: User[];
  gyms: Gym[];
  membershipPlans: MembershipPlan[];
  members: Member[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  notifications: SmartNotification[];
  renewals: RenewalRecord[];
  settings: GymSettings[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'gymflow_db.json');

// Ensure data folder exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper to calculate expiry date based on start date and duration months/days
export function calculateExpiryDate(startDateStr: string, durationMonths: number, durationDays?: number): string {
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  
  if (durationMonths && durationMonths > 0) {
    const originalDay = date.getDate();
    date.setMonth(date.getMonth() + durationMonths);
    // Handle month-end rollover (e.g. Feb 30 -> Mar 2)
    if (date.getDate() !== originalDay) {
      date.setDate(0);
    }
  }

  if (durationDays && durationDays > 0) {
    date.setDate(date.getDate() + durationDays);
  }

  return date.toISOString().split('T')[0];
}

// Default Seed Data
function getSeedData(): DatabaseSchema {
  const gymId = 'gym_ironpulse_01';
  const ownerId = 'user_owner_01';
  const now = new Date('2026-08-27T02:00:00.000Z');

  const defaultUser: User = {
    id: ownerId,
    email: 'owner@gymflow.io',
    name: 'Marcus Vance',
    role: 'gym_owner',
    phone: '+1 (555) 234-5678',
    gymId: gymId,
    createdAt: new Date('2026-01-10T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-01-10T10:00:00Z').toISOString(),
  };

  const defaultGym: Gym = {
    id: gymId,
    name: 'IronPulse Fitness Club',
    ownerName: 'Marcus Vance',
    phone: '+1 (555) 234-5678',
    email: 'contact@ironpulsefitness.com',
    address: '742 Evergreen Terrace, Suite 400',
    city: 'Austin',
    state: 'Texas',
    country: 'United States',
    logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=80',
    currency: 'USD',
    taxRate: 8.25,
    isOnboarded: true,
    createdAt: new Date('2026-01-10T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-01-10T10:00:00Z').toISOString(),
  };

  const defaultPlans: MembershipPlan[] = [
    {
      id: 'plan_monthly',
      gymId,
      name: 'Monthly Standard',
      price: 65,
      durationMonths: 1,
      benefits: ['Full Gym Floor Access', 'Locker Room & Showers', 'Standard Cardio Equipment', 'Free WiFi'],
      color: '#3B82F6', // Blue
      active: true,
      createdAt: new Date('2026-01-10T10:00:00Z').toISOString(),
    },
    {
      id: 'plan_quarterly',
      gymId,
      name: 'Quarterly Pro',
      price: 175,
      durationMonths: 3,
      benefits: ['All Standard Benefits', '1 Free Trainer Consultation', 'Sauna & Steam Bath Access', 'Free Guest Pass (1/mo)'],
      color: '#10B981', // Emerald
      active: true,
      createdAt: new Date('2026-01-10T10:00:00Z').toISOString(),
    },
    {
      id: 'plan_half_yearly',
      gymId,
      name: 'Half-Yearly Elite',
      price: 320,
      durationMonths: 6,
      benefits: ['All Pro Benefits', 'Free Body Composition Scan (Monthly)', '2 Free Guest Passes / mo', '10% Discount on Smoothies'],
      color: '#8B5CF6', // Purple
      active: true,
      createdAt: new Date('2026-01-10T10:00:00Z').toISOString(),
    },
    {
      id: 'plan_yearly',
      gymId,
      name: 'Yearly VIP Platinum',
      price: 580,
      durationMonths: 12,
      benefits: ['Unlimited 24/7 Access', 'Unlimited Sauna & Cold Plunge', '4 Free 1-on-1 PT Sessions', 'GymFlow Branded Gym Bag & Shaker', 'Complimentary Towel Service'],
      color: '#F59E0B', // Amber
      active: true,
      createdAt: new Date('2026-01-10T10:00:00Z').toISOString(),
    },
  ];

  // Helper date generators relative to 2026-08-27
  const members: Member[] = [
    {
      id: 'mem_101',
      gymId,
      memberCode: 'GF-1001',
      fullName: 'Alexander Wright',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      phoneNumber: '+1 (555) 349-1122',
      whatsAppNumber: '+1 (555) 349-1122',
      email: 'alex.wright@example.com',
      gender: 'male',
      age: 28,
      height: 182,
      weight: 78,
      address: '124 Oak Street, Austin, TX',
      emergencyContactName: 'Sarah Wright (Spouse)',
      emergencyContactPhone: '+1 (555) 349-1123',
      joiningDate: '2026-02-15',
      planId: 'plan_half_yearly',
      planName: 'Half-Yearly Elite',
      membershipStartDate: '2026-02-15',
      membershipExpiryDate: '2026-08-27', // Expiring TODAY!
      trainerAssigned: 'David Miller',
      paymentStatus: 'paid',
      notes: 'Focusing on hypertrophy & bench press progression.',
      status: 'active',
      createdAt: '2026-02-15T09:00:00Z',
      updatedAt: '2026-02-15T09:00:00Z',
    },
    {
      id: 'mem_102',
      gymId,
      memberCode: 'GF-1002',
      fullName: 'Sophia Elena Chen',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      phoneNumber: '+1 (555) 892-4455',
      whatsAppNumber: '+1 (555) 892-4455',
      email: 'sophia.chen@example.com',
      gender: 'female',
      age: 26,
      height: 168,
      weight: 58,
      address: '88 River Walk Apt 4B, Austin, TX',
      emergencyContactName: 'Michael Chen',
      emergencyContactPhone: '+1 (555) 892-4450',
      joiningDate: '2026-05-28',
      planId: 'plan_quarterly',
      planName: 'Quarterly Pro',
      membershipStartDate: '2026-05-28',
      membershipExpiryDate: '2026-08-28', // Expiring in 1 DAY!
      trainerAssigned: 'Emma Rodriguez',
      paymentStatus: 'paid',
      notes: 'Prefers morning sessions 6:30 AM.',
      status: 'active',
      createdAt: '2026-05-28T11:20:00Z',
      updatedAt: '2026-05-28T11:20:00Z',
    },
    {
      id: 'mem_103',
      gymId,
      memberCode: 'GF-1003',
      fullName: 'Rahul Sharma',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      phoneNumber: '+1 (555) 671-8899',
      whatsAppNumber: '+1 (555) 671-8899',
      email: 'rahul.sharma@example.com',
      gender: 'male',
      age: 31,
      height: 175,
      weight: 74,
      address: '405 Barton Springs Rd, Austin, TX',
      emergencyContactName: 'Pooja Sharma',
      emergencyContactPhone: '+1 (555) 671-8890',
      joiningDate: '2026-05-30',
      planId: 'plan_quarterly',
      planName: 'Quarterly Pro',
      membershipStartDate: '2026-05-30',
      membershipExpiryDate: '2026-08-30', // Expiring in 3 DAYS!
      trainerAssigned: 'David Miller',
      paymentStatus: 'paid',
      notes: 'Requested WhatsApp reminder before renewal.',
      status: 'active',
      createdAt: '2026-05-30T14:15:00Z',
      updatedAt: '2026-05-30T14:15:00Z',
    },
    {
      id: 'mem_104',
      gymId,
      memberCode: 'GF-1004',
      fullName: 'Jessica Taylor',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      phoneNumber: '+1 (555) 431-7722',
      whatsAppNumber: '+1 (555) 431-7722',
      email: 'jessica.t@example.com',
      gender: 'female',
      age: 34,
      height: 165,
      weight: 62,
      address: '220 Congress Ave, Austin, TX',
      emergencyContactName: 'Robert Taylor',
      emergencyContactPhone: '+1 (555) 431-7700',
      joiningDate: '2026-02-03',
      planId: 'plan_half_yearly',
      planName: 'Half-Yearly Elite',
      membershipStartDate: '2026-03-03',
      membershipExpiryDate: '2026-09-03', // Expiring in 7 DAYS!
      trainerAssigned: 'Emma Rodriguez',
      paymentStatus: 'paid',
      notes: 'Very consistent, attends 5x per week.',
      status: 'active',
      createdAt: '2026-02-03T10:00:00Z',
      updatedAt: '2026-02-03T10:00:00Z',
    },
    {
      id: 'mem_105',
      gymId,
      memberCode: 'GF-1005',
      fullName: 'Marcus Aurelius Sterling',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      phoneNumber: '+1 (555) 910-3344',
      whatsAppNumber: '+1 (555) 910-3344',
      email: 'm.sterling@example.com',
      gender: 'male',
      age: 42,
      height: 188,
      weight: 90,
      address: '900 South Lamar Blvd, Austin, TX',
      emergencyContactName: 'Clara Sterling',
      emergencyContactPhone: '+1 (555) 910-3300',
      joiningDate: '2025-09-01',
      planId: 'plan_yearly',
      planName: 'Yearly VIP Platinum',
      membershipStartDate: '2025-09-01',
      membershipExpiryDate: '2026-09-01', // Expiring in 5 days
      trainerAssigned: 'David Miller',
      paymentStatus: 'paid',
      notes: 'VIP locker #14.',
      status: 'active',
      createdAt: '2025-09-01T08:00:00Z',
      updatedAt: '2025-09-01T08:00:00Z',
    },
    {
      id: 'mem_106',
      gymId,
      memberCode: 'GF-1006',
      fullName: 'Daniel Brooks',
      photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      phoneNumber: '+1 (555) 782-9901',
      whatsAppNumber: '+1 (555) 782-9901',
      email: 'dbrooks@example.com',
      gender: 'male',
      age: 24,
      height: 178,
      weight: 71,
      address: '512 Guadalupe St, Austin, TX',
      emergencyContactName: 'Linda Brooks',
      emergencyContactPhone: '+1 (555) 782-9900',
      joiningDate: '2026-07-20',
      planId: 'plan_monthly',
      planName: 'Monthly Standard',
      membershipStartDate: '2026-07-20',
      membershipExpiryDate: '2026-08-20', // Expired 7 days ago!
      trainerAssigned: 'None',
      paymentStatus: 'pending',
      notes: 'Follow up for renewal discount.',
      status: 'expired',
      createdAt: '2026-07-20T16:00:00Z',
      updatedAt: '2026-08-20T00:00:00Z',
    },
    {
      id: 'mem_107',
      gymId,
      memberCode: 'GF-1007',
      fullName: 'Olivia Carter',
      photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
      phoneNumber: '+1 (555) 623-8811',
      whatsAppNumber: '+1 (555) 623-8811',
      email: 'olivia.carter@example.com',
      gender: 'female',
      age: 29,
      height: 170,
      weight: 60,
      address: '1500 Lavaca St, Austin, TX',
      emergencyContactName: 'Jack Carter',
      emergencyContactPhone: '+1 (555) 623-8800',
      joiningDate: '2026-04-10',
      planId: 'plan_half_yearly',
      planName: 'Half-Yearly Elite',
      membershipStartDate: '2026-04-10',
      membershipExpiryDate: '2026-10-10',
      trainerAssigned: 'Emma Rodriguez',
      paymentStatus: 'paid',
      notes: 'Frozen temporarily due to medical travel.',
      status: 'frozen',
      freezeReason: 'Work relocation trip',
      freezeDate: '2026-08-15',
      createdAt: '2026-04-10T12:00:00Z',
      updatedAt: '2026-08-15T10:00:00Z',
    },
    {
      id: 'mem_108',
      gymId,
      memberCode: 'GF-1008',
      fullName: 'Ethan Walker',
      photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      phoneNumber: '+1 (555) 312-7788',
      whatsAppNumber: '+1 (555) 312-7788',
      email: 'ethan.walker@example.com',
      gender: 'male',
      age: 30,
      height: 180,
      weight: 82,
      address: '701 Brazos St, Austin, TX',
      emergencyContactName: 'Hannah Walker',
      emergencyContactPhone: '+1 (555) 312-7780',
      joiningDate: '2026-08-01',
      planId: 'plan_monthly',
      planName: 'Monthly Standard',
      membershipStartDate: '2026-08-01',
      membershipExpiryDate: '2026-09-01',
      trainerAssigned: 'David Miller',
      paymentStatus: 'paid',
      notes: 'Goal: marathon endurance training.',
      status: 'active',
      createdAt: '2026-08-01T09:30:00Z',
      updatedAt: '2026-08-01T09:30:00Z',
    },
    {
      id: 'mem_109',
      gymId,
      memberCode: 'GF-1009',
      fullName: 'Chloe Bennett',
      photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      phoneNumber: '+1 (555) 441-9988',
      whatsAppNumber: '+1 (555) 441-9988',
      email: 'c.bennett@example.com',
      gender: 'female',
      age: 27,
      height: 165,
      weight: 55,
      address: '330 West 6th St, Austin, TX',
      emergencyContactName: 'Noah Bennett',
      emergencyContactPhone: '+1 (555) 441-9900',
      joiningDate: '2026-08-15',
      planId: 'plan_yearly',
      planName: 'Yearly VIP Platinum',
      membershipStartDate: '2026-08-15',
      membershipExpiryDate: '2027-08-15',
      trainerAssigned: 'Emma Rodriguez',
      paymentStatus: 'paid',
      notes: 'New member, signed up for VIP.',
      status: 'active',
      createdAt: '2026-08-15T15:45:00Z',
      updatedAt: '2026-08-15T15:45:00Z',
    },
    {
      id: 'mem_110',
      gymId,
      memberCode: 'GF-1010',
      fullName: 'Devon Patel',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      phoneNumber: '+1 (555) 552-1234',
      whatsAppNumber: '+1 (555) 552-1234',
      email: 'devon.patel@example.com',
      gender: 'male',
      age: 33,
      height: 177,
      weight: 79,
      address: '1100 East 5th St, Austin, TX',
      emergencyContactName: 'Ananya Patel',
      emergencyContactPhone: '+1 (555) 552-1200',
      joiningDate: '2026-08-20',
      planId: 'plan_quarterly',
      planName: 'Quarterly Pro',
      membershipStartDate: '2026-08-20',
      membershipExpiryDate: '2026-11-20',
      trainerAssigned: 'David Miller',
      paymentStatus: 'partial',
      notes: '$75 remaining balance due by month end.',
      status: 'active',
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-08-20T10:00:00Z',
    },
  ];

  const payments: Payment[] = [
    {
      id: 'pay_01',
      gymId,
      memberId: 'mem_109',
      memberName: 'Chloe Bennett',
      memberCode: 'GF-1009',
      planId: 'plan_yearly',
      planName: 'Yearly VIP Platinum',
      invoiceNumber: 'INV-2026-0815',
      amount: 580,
      paidAmount: 580,
      pendingAmount: 0,
      paymentDate: '2026-08-15',
      mode: 'card',
      notes: 'Full payment via Visa *4421',
      receiptNumber: 'RCP-10892',
      createdAt: '2026-08-15T15:50:00Z',
    },
    {
      id: 'pay_02',
      gymId,
      memberId: 'mem_108',
      memberName: 'Ethan Walker',
      memberCode: 'GF-1008',
      planId: 'plan_monthly',
      planName: 'Monthly Standard',
      invoiceNumber: 'INV-2026-0801',
      amount: 65,
      paidAmount: 65,
      pendingAmount: 0,
      paymentDate: '2026-08-01',
      mode: 'upi',
      notes: 'UPI instant transaction #889214',
      receiptNumber: 'RCP-10893',
      createdAt: '2026-08-01T09:35:00Z',
    },
    {
      id: 'pay_03',
      gymId,
      memberId: 'mem_110',
      memberName: 'Devon Patel',
      memberCode: 'GF-1010',
      planId: 'plan_quarterly',
      planName: 'Quarterly Pro',
      invoiceNumber: 'INV-2026-0820',
      amount: 175,
      paidAmount: 100,
      pendingAmount: 75,
      paymentDate: '2026-08-20',
      mode: 'cash',
      notes: 'Partial payment $100 cash received. Balance $75 pending.',
      receiptNumber: 'RCP-10894',
      createdAt: '2026-08-20T10:05:00Z',
    },
    {
      id: 'pay_04',
      gymId,
      memberId: 'mem_101',
      memberName: 'Alexander Wright',
      memberCode: 'GF-1001',
      planId: 'plan_half_yearly',
      planName: 'Half-Yearly Elite',
      invoiceNumber: 'INV-2026-0215',
      amount: 320,
      paidAmount: 320,
      pendingAmount: 0,
      paymentDate: '2026-02-15',
      mode: 'online',
      notes: 'Stripe online direct checkout',
      receiptNumber: 'RCP-10750',
      createdAt: '2026-02-15T09:05:00Z',
    },
    {
      id: 'pay_05',
      gymId,
      memberId: 'mem_103',
      memberName: 'Rahul Sharma',
      memberCode: 'GF-1003',
      planId: 'plan_quarterly',
      planName: 'Quarterly Pro',
      invoiceNumber: 'INV-2026-0530',
      amount: 175,
      paidAmount: 175,
      pendingAmount: 0,
      paymentDate: '2026-05-30',
      mode: 'card',
      notes: 'MasterCard POS Tap',
      receiptNumber: 'RCP-10812',
      createdAt: '2026-05-30T14:20:00Z',
    },
  ];

  // Attendance for today (2026-08-27) and recent days
  const attendance: AttendanceRecord[] = [
    {
      id: 'att_01',
      gymId,
      memberId: 'mem_101',
      memberName: 'Alexander Wright',
      memberCode: 'GF-1001',
      date: '2026-08-27',
      checkInTime: '06:15:20',
      status: 'present',
      method: 'code',
      notes: 'Early morning workout',
      createdAt: '2026-08-27T06:15:20Z',
    },
    {
      id: 'att_02',
      gymId,
      memberId: 'mem_102',
      memberName: 'Sophia Elena Chen',
      memberCode: 'GF-1002',
      date: '2026-08-27',
      checkInTime: '06:45:10',
      status: 'present',
      method: 'qr',
      notes: 'Trainer session with Emma',
      createdAt: '2026-08-27T06:45:10Z',
    },
    {
      id: 'att_03',
      gymId,
      memberId: 'mem_104',
      memberName: 'Jessica Taylor',
      memberCode: 'GF-1004',
      date: '2026-08-27',
      checkInTime: '07:30:00',
      status: 'present',
      method: 'manual',
      notes: 'Front desk manual check-in',
      createdAt: '2026-08-27T07:30:00Z',
    },
    {
      id: 'att_04',
      gymId,
      memberId: 'mem_108',
      memberName: 'Ethan Walker',
      memberCode: 'GF-1008',
      date: '2026-08-27',
      checkInTime: '08:10:45',
      status: 'present',
      method: 'code',
      notes: 'Cardio room',
      createdAt: '2026-08-27T08:10:45Z',
    },
    {
      id: 'att_05',
      gymId,
      memberId: 'mem_109',
      memberName: 'Chloe Bennett',
      memberCode: 'GF-1009',
      date: '2026-08-27',
      checkInTime: '09:00:15',
      status: 'present',
      method: 'qr',
      notes: 'Leg day routine',
      createdAt: '2026-08-27T09:00:15Z',
    },
    // Yesterday attendance
    {
      id: 'att_06',
      gymId,
      memberId: 'mem_101',
      memberName: 'Alexander Wright',
      memberCode: 'GF-1001',
      date: '2026-08-26',
      checkInTime: '06:20:00',
      status: 'present',
      method: 'code',
      createdAt: '2026-08-26T06:20:00Z',
    },
    {
      id: 'att_07',
      gymId,
      memberId: 'mem_103',
      memberName: 'Rahul Sharma',
      memberCode: 'GF-1003',
      date: '2026-08-26',
      checkInTime: '17:30:00',
      status: 'present',
      method: 'manual',
      createdAt: '2026-08-26T17:30:00Z',
    },
    {
      id: 'att_08',
      gymId,
      memberId: 'mem_105',
      memberName: 'Marcus Aurelius Sterling',
      memberCode: 'GF-1005',
      date: '2026-08-26',
      checkInTime: '18:15:00',
      status: 'present',
      method: 'code',
      createdAt: '2026-08-26T18:15:00Z',
    },
  ];

  const notifications: SmartNotification[] = [
    {
      id: 'notif_01',
      gymId,
      memberId: 'mem_101',
      memberName: 'Alexander Wright',
      title: 'Membership Expires Today',
      message: "Alexander Wright's Half-Yearly Elite membership expires today (27 Aug 2026). Send renewal reminder now.",
      type: 'expiry_today',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-27T00:01:00Z',
      actionUrl: '/members?id=mem_101',
    },
    {
      id: 'notif_02',
      gymId,
      memberId: 'mem_102',
      memberName: 'Sophia Elena Chen',
      title: 'Membership Expires Tomorrow',
      message: "Sophia Elena Chen's Quarterly Pro membership expires tomorrow (28 Aug 2026).",
      type: 'expiry_1d',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-27T00:01:00Z',
      actionUrl: '/members?id=mem_102',
    },
    {
      id: 'notif_03',
      gymId,
      memberId: 'mem_103',
      memberName: 'Rahul Sharma',
      title: 'Membership Expires in 3 Days',
      message: "Rahul Sharma's membership expires in 3 days on 30 Aug 2026.",
      type: 'expiry_3d',
      isRead: false,
      priority: 'medium',
      createdAt: '2026-08-27T00:01:00Z',
      actionUrl: '/members?id=mem_103',
    },
    {
      id: 'notif_04',
      gymId,
      memberId: 'mem_104',
      memberName: 'Jessica Taylor',
      title: 'Membership Expires in 7 Days',
      message: "Jessica Taylor's membership expires on 03 Sep 2026 (7 days remaining).",
      type: 'expiry_7d',
      isRead: true,
      priority: 'low',
      createdAt: '2026-08-27T00:01:00Z',
      actionUrl: '/members?id=mem_104',
    },
    {
      id: 'notif_05',
      gymId,
      memberId: 'mem_106',
      memberName: 'Daniel Brooks',
      title: 'Expired 7 Days Ago - Follow Up',
      message: "Daniel Brooks's membership expired 7 days ago on 20 Aug 2026. Special win-back offer suggested.",
      type: 'expired_7d',
      isRead: false,
      priority: 'medium',
      createdAt: '2026-08-27T00:01:00Z',
      actionUrl: '/members?id=mem_106',
    },
    {
      id: 'notif_06',
      gymId,
      memberId: 'mem_109',
      memberName: 'Chloe Bennett',
      title: 'New VIP Member Enrolled',
      message: 'Chloe Bennett completed registration for Yearly VIP Platinum ($580).',
      type: 'general',
      isRead: true,
      priority: 'low',
      createdAt: '2026-08-15T15:52:00Z',
    },
  ];

  const renewals: RenewalRecord[] = [
    {
      id: 'ren_01',
      gymId,
      memberId: 'mem_105',
      memberName: 'Marcus Aurelius Sterling',
      memberCode: 'GF-1005',
      previousPlanId: 'plan_half_yearly',
      previousPlanName: 'Half-Yearly Elite',
      newPlanId: 'plan_yearly',
      newPlanName: 'Yearly VIP Platinum',
      previousExpiryDate: '2025-09-01',
      newExpiryDate: '2026-09-01',
      renewalDate: '2025-09-01',
      amount: 580,
      discount: 0,
      renewedBy: 'Marcus Vance',
      createdAt: '2025-09-01T08:30:00Z',
    },
    {
      id: 'ren_02',
      gymId,
      memberId: 'mem_104',
      memberName: 'Jessica Taylor',
      memberCode: 'GF-1004',
      previousPlanId: 'plan_monthly',
      previousPlanName: 'Monthly Standard',
      newPlanId: 'plan_half_yearly',
      newPlanName: 'Half-Yearly Elite',
      previousExpiryDate: '2026-03-03',
      newExpiryDate: '2026-09-03',
      renewalDate: '2026-03-03',
      amount: 320,
      discount: 10,
      renewedBy: 'Marcus Vance',
      createdAt: '2026-03-03T10:15:00Z',
    },
  ];

  const defaultSettings: GymSettings = {
    id: 'set_01',
    gymId,
    theme: 'dark',
    language: 'en',
    reminderDays: [7, 3, 1, 0, -7],
    autoNotifyWhatsApp: true,
    autoNotifyEmail: true,
    qrCheckInEnabled: true,
    currencySymbol: '$',
    taxPercentage: 8.25,
    backupFrequency: 'daily',
    securityTwoFactor: false,
    createdAt: new Date('2026-01-10T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-08-27T02:00:00Z').toISOString(),
  };

  return {
    users: [defaultUser],
    gyms: [defaultGym],
    membershipPlans: defaultPlans,
    members: members,
    payments: payments,
    attendance: attendance,
    notifications: notifications,
    renewals: renewals,
    settings: [defaultSettings],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed && Array.isArray(parsed.members) && Array.isArray(parsed.gyms)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read existing database file, initializing with seeds:', e);
    }
    const seed = getSeedData();
    this.persist(seed);
    return seed;
  }

  private persist(dataToSave: DatabaseSchema = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // Users
  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.users[idx];
  }

  // Gyms
  getGym(id: string): Gym | undefined {
    return this.data.gyms.find(g => g.id === id) || this.data.gyms[0];
  }

  createGym(gym: Gym): Gym {
    this.data.gyms.push(gym);
    this.persist();
    return gym;
  }

  updateGym(id: string, updates: Partial<Gym>): Gym | undefined {
    const idx = this.data.gyms.findIndex(g => g.id === id);
    if (idx === -1) return undefined;
    this.data.gyms[idx] = { ...this.data.gyms[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.gyms[idx];
  }

  // Plans
  getPlans(gymId: string): MembershipPlan[] {
    return this.data.membershipPlans.filter(p => p.gymId === gymId && p.active !== false);
  }

  getPlanById(id: string): MembershipPlan | undefined {
    return this.data.membershipPlans.find(p => p.id === id);
  }

  createPlan(plan: MembershipPlan): MembershipPlan {
    this.data.membershipPlans.push(plan);
    this.persist();
    return plan;
  }

  updatePlan(id: string, updates: Partial<MembershipPlan>): MembershipPlan | undefined {
    const idx = this.data.membershipPlans.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.membershipPlans[idx] = { ...this.data.membershipPlans[idx], ...updates };
    this.persist();
    return this.data.membershipPlans[idx];
  }

  deletePlan(id: string): boolean {
    const idx = this.data.membershipPlans.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.membershipPlans[idx].active = false;
    this.persist();
    return true;
  }

  // Members
  getMembers(gymId: string, options?: {
    search?: string;
    status?: string;
    planId?: string;
    paymentStatus?: string;
    trainer?: string;
  }): Member[] {
    let result = this.data.members.filter(m => m.gymId === gymId && m.status !== 'deleted');

    if (options?.status && options.status !== 'all') {
      result = result.filter(m => m.status === options.status);
    }
    if (options?.planId && options.planId !== 'all') {
      result = result.filter(m => m.planId === options.planId);
    }
    if (options?.paymentStatus && options.paymentStatus !== 'all') {
      result = result.filter(m => m.paymentStatus === options.paymentStatus);
    }
    if (options?.trainer && options.trainer !== 'all') {
      result = result.filter(m => m.trainerAssigned === options.trainer);
    }
    if (options?.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      result = result.filter(m =>
        m.fullName.toLowerCase().includes(q) ||
        m.phoneNumber.includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        (m.whatsAppNumber && m.whatsAppNumber.includes(q))
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getMemberById(id: string): Member | undefined {
    return this.data.members.find(m => m.id === id);
  }

  getNextMemberCode(gymId: string): string {
    const count = this.data.members.length + 1;
    return `GF-${1000 + count}`;
  }

  createMember(member: Member): Member {
    this.data.members.push(member);
    this.persist();
    return member;
  }

  updateMember(id: string, updates: Partial<Member>): Member | undefined {
    const idx = this.data.members.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    this.data.members[idx] = { ...this.data.members[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.members[idx];
  }

  deleteMember(id: string): boolean {
    const idx = this.data.members.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.data.members[idx].status = 'deleted';
    this.persist();
    return true;
  }

  // Payments
  getPayments(gymId: string): Payment[] {
    return this.data.payments
      .filter(p => p.gymId === gymId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }

  createPayment(payment: Payment): Payment {
    this.data.payments.push(payment);
    // update member payment status
    const member = this.getMemberById(payment.memberId);
    if (member) {
      if (payment.pendingAmount <= 0) {
        this.updateMember(member.id, { paymentStatus: 'paid' });
      } else if (payment.paidAmount > 0) {
        this.updateMember(member.id, { paymentStatus: 'partial' });
      }
    }
    this.persist();
    return payment;
  }

  // Attendance
  getAttendance(gymId: string, date?: string): AttendanceRecord[] {
    const targetDate = date || '2026-08-27';
    return this.data.attendance
      .filter(a => a.gymId === gymId && a.date === targetDate)
      .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime));
  }

  getAllAttendance(gymId: string): AttendanceRecord[] {
    return this.data.attendance
      .filter(a => a.gymId === gymId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markAttendance(record: AttendanceRecord): AttendanceRecord {
    // Check if already checked in today
    const existing = this.data.attendance.find(
      a => a.gymId === record.gymId && a.memberId === record.memberId && a.date === record.date
    );
    if (existing) {
      return existing;
    }
    this.data.attendance.push(record);
    this.persist();
    return record;
  }

  // Notifications
  getNotifications(gymId: string): SmartNotification[] {
    return this.data.notifications
      .filter(n => n.gymId === gymId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addNotification(notification: SmartNotification): SmartNotification {
    this.data.notifications.unshift(notification);
    this.persist();
    return notification;
  }

  markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.persist();
      return true;
    }
    return false;
  }

  markAllNotificationsRead(gymId: string): void {
    this.data.notifications.forEach(n => {
      if (n.gymId === gymId) {
        n.isRead = true;
      }
    });
    this.persist();
  }

  // Renewals
  getRenewals(gymId: string): RenewalRecord[] {
    return this.data.renewals
      .filter(r => r.gymId === gymId)
      .sort((a, b) => new Date(b.renewalDate).getTime() - new Date(a.renewalDate).getTime());
  }

  createRenewal(renewal: RenewalRecord): RenewalRecord {
    this.data.renewals.unshift(renewal);
    this.persist();
    return renewal;
  }

  // Settings
  getSettings(gymId: string): GymSettings {
    const existing = this.data.settings.find(s => s.gymId === gymId);
    if (existing) return existing;
    const newSettings: GymSettings = {
      id: `set_${Date.now()}`,
      gymId,
      theme: 'dark',
      language: 'en',
      reminderDays: [7, 3, 1, 0, -7],
      autoNotifyWhatsApp: true,
      autoNotifyEmail: true,
      qrCheckInEnabled: true,
      currencySymbol: '$',
      taxPercentage: 8.25,
      backupFrequency: 'daily',
      securityTwoFactor: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.settings.push(newSettings);
    this.persist();
    return newSettings;
  }

  updateSettings(gymId: string, updates: Partial<GymSettings>): GymSettings {
    let s = this.data.settings.find(st => st.gymId === gymId);
    if (!s) {
      s = this.getSettings(gymId);
    }
    Object.assign(s, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return s;
  }

  // Dashboard Aggregator
  getDashboardStats(gymId: string, referenceDateStr = '2026-08-27'): DashboardStats {
    const refDate = new Date(referenceDateStr);
    const todayStr = referenceDateStr;

    const members = this.data.members.filter(m => m.gymId === gymId && m.status !== 'deleted');
    const plans = this.getPlans(gymId);
    const payments = this.data.payments.filter(p => p.gymId === gymId);
    const attendances = this.data.attendance.filter(a => a.gymId === gymId);

    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'active').length;
    const expiredMembers = members.filter(m => m.status === 'expired' || new Date(m.membershipExpiryDate) < refDate).length;

    // Expiry thresholds
    let expiringToday = 0;
    let expiringThisWeek = 0;
    let expiringIn30Days = 0;

    members.forEach(m => {
      if (m.status === 'active') {
        const exp = new Date(m.membershipExpiryDate);
        const diffDays = Math.ceil((exp.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) expiringToday++;
        if (diffDays >= 0 && diffDays <= 7) expiringThisWeek++;
        if (diffDays >= 0 && diffDays <= 30) expiringIn30Days++;
      }
    });

    // Revenue calculation (current month: August 2026)
    const monthlyRevenue = payments
      .filter(p => p.paymentDate.startsWith('2026-08'))
      .reduce((sum, p) => sum + p.paidAmount, 0);

    const pendingPayments = members
      .filter(m => m.paymentStatus === 'pending' || m.paymentStatus === 'partial')
      .reduce((sum, m) => {
        const plan = plans.find(p => p.id === m.planId);
        return sum + (plan ? plan.price * 0.5 : 50);
      }, 0);

    const todayAttendanceCount = attendances.filter(a => a.date === todayStr && a.status === 'present').length;
    const attendanceRate = totalMembers > 0 ? Math.round((todayAttendanceCount / totalMembers) * 100) : 0;
    const renewalRate = 84; // 84% renewal benchmark

    // Revenue Chart (6 months history)
    const months = ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'];
    const revenueChart = months.map((m, i) => {
      const monthPrefix = `2026-0${i + 3}`;
      const rev = payments
        .filter(p => p.paymentDate.startsWith(monthPrefix))
        .reduce((sum, p) => sum + p.paidAmount, 0) || (3200 + i * 450);
      return {
        month: m,
        revenue: rev,
        target: 4500 + i * 300,
        paymentsCount: 18 + i * 4,
      };
    });

    // Membership Growth (6 months)
    const membershipGrowth = months.map((m, i) => ({
      month: m,
      newMembers: 12 + i * 3,
      totalActive: 45 + i * 8,
      expired: 2 + Math.floor(i * 1.2),
    }));

    // Attendance Trend (Last 7 days)
    const attendanceTrend = [
      { day: 'Fri (21)', count: 28 },
      { day: 'Sat (22)', count: 35 },
      { day: 'Sun (23)', count: 22 },
      { day: 'Mon (24)', count: 42 },
      { day: 'Tue (25)', count: 39 },
      { day: 'Wed (26)', count: 38 },
      { day: 'Thu (27)', count: todayAttendanceCount || 34 },
    ];

    // Plan Distribution
    const planCounts: Record<string, number> = {};
    members.forEach(m => {
      planCounts[m.planId] = (planCounts[m.planId] || 0) + 1;
    });

    const planDistribution = plans.map(p => ({
      name: p.name,
      count: planCounts[p.id] || 0,
      color: p.color,
      value: planCounts[p.id] || 1,
    }));

    // Activities Feed
    const recentActivities = [
      {
        id: 'act_1',
        type: 'member_join' as const,
        title: 'New Member Enrolled',
        description: 'Chloe Bennett joined with Yearly VIP Platinum plan.',
        timestamp: '15 Aug 2026, 3:45 PM',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      },
      {
        id: 'act_2',
        type: 'payment' as const,
        title: 'Payment Received',
        description: 'Devon Patel made a partial payment of $100 via Cash.',
        timestamp: '20 Aug 2026, 10:05 AM',
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      },
      {
        id: 'act_3',
        type: 'expiry' as const,
        title: 'Membership Expiring Today',
        description: "Alexander Wright's Half-Yearly plan expires today.",
        timestamp: '27 Aug 2026, 06:15 AM',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      },
      {
        id: 'act_4',
        type: 'attendance' as const,
        title: 'Morning Rush Check-in',
        description: '5 members checked in during the 6:00 - 9:00 AM window.',
        timestamp: '27 Aug 2026, 09:00 AM',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      },
    ];

    return {
      totalMembers,
      activeMembers,
      expiredMembers,
      expiringToday,
      expiringThisWeek,
      expiringIn30Days,
      monthlyRevenue,
      pendingPayments,
      todayAttendance: todayAttendanceCount,
      attendanceRate,
      renewalRate,
      recentActivities,
      recentRenewals: this.getRenewals(gymId).slice(0, 5),
      newestMembers: members.slice(0, 5),
      revenueChart,
      membershipGrowth,
      attendanceTrend,
      planDistribution,
    };
  }

  // Reset or Seed
  resetDatabase(): void {
    this.data = getSeedData();
    this.persist();
  }
}

export const db = new Database();
