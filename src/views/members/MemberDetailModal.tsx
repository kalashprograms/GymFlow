import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Member, Gym, Payment, AttendanceRecord } from '../../types';
import { formatCurrency, formatDate, getDaysRemaining } from '../../lib/utils';
import {
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Flame,
  MessageSquare,
  RefreshCw,
  Clock,
  Heart,
  Activity,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { ReceiptModal } from '../../components/common/ReceiptModal';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string | null;
  gym: Gym | null;
  onOpenRenewal: (member: Member) => void;
  onOpenWhatsApp: (member: Member) => void;
  onOpenEdit: (member: Member) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  memberId,
  gym,
  onOpenRenewal,
  onOpenWhatsApp,
  onOpenEdit,
}) => {
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'attendance'>('overview');
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    if (isOpen && memberId) {
      loadMemberDetails();
    }
  }, [isOpen, memberId]);

  const loadMemberDetails = async () => {
    if (!memberId) return;
    try {
      setIsLoading(true);
      const res = await api.getMember(memberId);
      setMember(res.member);
      setPayments(res.payments || []);
      setAttendance(res.attendance || []);
    } catch (e) {
      console.error('Failed to load member detail:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const daysRemaining = member ? getDaysRemaining(member.membershipExpiryDate) : 0;

  // Calculate BMI if height and weight exist
  const bmi =
    member?.height && member?.weight
      ? (member.weight / Math.pow(member.height / 100, 2)).toFixed(1)
      : null;

  const bmiCategory = bmi
    ? Number(bmi) < 18.5
      ? 'Underweight'
      : Number(bmi) < 25
      ? 'Normal weight (Healthy)'
      : Number(bmi) < 30
      ? 'Overweight'
      : 'Obese'
    : null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={member?.fullName || 'Member Profile'}
        subtitle={`Member ID: ${member?.memberCode || ''}`}
        maxWidth="2xl"
      >
        {isLoading || !member ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            Loading member profile...
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top Identity Card */}
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={
                    member.photo ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={member.fullName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-300 dark:border-zinc-700 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      {member.fullName}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        member.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                          : member.status === 'expired'
                          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                          : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {member.planName} • Trainer: {member.trainerAssigned || 'None'}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Phone: {member.phoneNumber} | Joined: {formatDate(member.joiningDate)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenWhatsApp(member)}
                  title="Send WhatsApp Reminder"
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenRenewal(member)}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Renew</span>
                </button>
              </div>
            </div>

            {/* Expiry Status Strip */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                daysRemaining < 0
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  : daysRemaining <= 3
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">
                  Valid from {formatDate(member.membershipStartDate)} to {formatDate(member.membershipExpiryDate)}
                </span>
              </div>
              <span className="font-bold">
                {daysRemaining < 0
                  ? `Expired ${Math.abs(daysRemaining)} days ago`
                  : daysRemaining === 0
                  ? 'Expires Today'
                  : `${daysRemaining} days remaining`}
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 transition-colors cursor-pointer ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Overview & Vitals
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`pb-2.5 transition-colors cursor-pointer ${
                  activeTab === 'payments'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Payment Receipts ({payments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className={`pb-2.5 transition-colors cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Attendance Log ({attendance.length})
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Age / Gender</p>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white mt-1 capitalize">
                      {member.age || 25} yrs • {member.gender || 'Male'}
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Height & Weight</p>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white mt-1">
                      {member.height || 175} cm • {member.weight || 72} kg
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Calculated BMI</p>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white mt-1">
                      {bmi ? `${bmi} (${bmiCategory})` : 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Check-Ins</p>
                    <p className="text-xs font-bold text-indigo-500 mt-1">
                      {attendance.length} Visits
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-1.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Emergency Contact</p>
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      {member.emergencyContactName || 'Not specified'}
                    </p>
                    <p className="text-zinc-500">{member.emergencyContactPhone || '—'}</p>
                  </div>

                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-1.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Address & Notes</p>
                    <p className="text-zinc-700 dark:text-zinc-300">{member.address || '—'}</p>
                    <p className="text-zinc-500 italic">
                      "{member.notes || 'No health restrictions noted'}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Payments */}
            {activeTab === 'payments' && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {payments.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center">No payment history found.</p>
                ) : (
                  payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white font-mono">
                            {p.receiptNumber}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-medium capitalize">
                            {p.mode}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {p.planName} • Date: {formatDate(p.paymentDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">
                            {formatCurrency(p.paidAmount, gym?.currency || '$')}
                          </p>
                          {p.pendingAmount > 0 && (
                            <p className="text-[10px] text-rose-500 font-medium">
                              Bal: {formatCurrency(p.pendingAmount, gym?.currency || '$')}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(p)}
                          title="View Official Receipt"
                          className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Attendance */}
            {activeTab === 'attendance' && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attendance.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center">No attendance records yet.</p>
                ) : (
                  attendance.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          {formatDate(att.date)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 font-mono">{att.checkInTime}</span>
                        <span className="ml-2 text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded capitalize">
                          {att.method}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => onOpenEdit(member)}
                className="text-xs font-semibold text-zinc-500 hover:text-blue-500 transition-colors"
              >
                Edit Member Details
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-200 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Embedded Payment Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
        gym={gym}
      />
    </>
  );
};
