import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { MembershipPlan, Member } from '../../types';
import { calculateExpiryDate, formatDate } from '../../lib/utils';
import {
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Sparkles,
  MapPin,
  Heart,
  Activity,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: MembershipPlan[];
  onMemberCreated: () => void;
  memberToEdit?: Member | null;
}

export const NewMemberModal: React.FC<NewMemberModalProps> = ({
  isOpen,
  onClose,
  plans,
  onMemberCreated,
  memberToEdit,
}) => {
  const isEditing = !!memberToEdit;

  const [fullName, setFullName] = useState('');
  const [photo, setPhoto] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState('26');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [joiningDate, setJoiningDate] = useState('2026-08-27');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState('2026-08-27');
  const [expiryDate, setExpiryDate] = useState('');
  const [trainerAssigned, setTrainerAssigned] = useState('David Miller');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (memberToEdit) {
      setFullName(memberToEdit.fullName || '');
      setPhoto(memberToEdit.photo || '');
      setPhoneNumber(memberToEdit.phoneNumber || '');
      setWhatsAppNumber(memberToEdit.whatsAppNumber || memberToEdit.phoneNumber || '');
      setEmail(memberToEdit.email || '');
      setGender(memberToEdit.gender || 'male');
      setAge(memberToEdit.age?.toString() || '26');
      setHeight(memberToEdit.height?.toString() || '175');
      setWeight(memberToEdit.weight?.toString() || '70');
      setAddress(memberToEdit.address || '');
      setEmergencyContactName(memberToEdit.emergencyContactName || '');
      setEmergencyContactPhone(memberToEdit.emergencyContactPhone || '');
      setJoiningDate(memberToEdit.joiningDate || '2026-08-27');
      setPlanId(memberToEdit.planId || '');
      setStartDate(memberToEdit.membershipStartDate || '');
      setExpiryDate(memberToEdit.membershipExpiryDate || '');
      setTrainerAssigned(memberToEdit.trainerAssigned || 'None');
      setPaymentStatus(memberToEdit.paymentStatus || 'paid');
      setNotes(memberToEdit.notes || '');
    } else {
      setFullName('');
      setPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
      setPhoneNumber('');
      setWhatsAppNumber('');
      setEmail('');
      setGender('male');
      setAge('26');
      setHeight('175');
      setWeight('72');
      setAddress('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setJoiningDate('2026-08-27');
      const defaultPlan = plans[0]?.id || '';
      setPlanId(defaultPlan);
      setStartDate('2026-08-27');
      setTrainerAssigned('David Miller');
      setPaymentStatus('paid');
      setPaymentMode('cash');
      setPaidAmount(plans[0]?.price?.toString() || '65');
      setNotes('');
    }
  }, [isOpen, memberToEdit, plans]);

  // Auto calculate expiry date when plan or start date changes
  useEffect(() => {
    if (!planId) return;
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      const calculated = calculateExpiryDate(startDate, plan.durationMonths, plan.durationDays);
      setExpiryDate(calculated);
      if (!isEditing && paidAmount === '') {
        setPaidAmount(plan.price.toString());
      }
    }
  }, [planId, startDate, plans, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber || !planId) {
      setError('Please fill in required fields: Full Name, Phone Number, and Plan');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (isEditing && memberToEdit) {
        await api.updateMember(memberToEdit.id, {
          fullName,
          photo,
          phoneNumber,
          whatsAppNumber: whatsAppNumber || phoneNumber,
          email,
          gender,
          age: Number(age) || 25,
          height: height ? Number(height) : undefined,
          weight: weight ? Number(weight) : undefined,
          address,
          emergencyContactName,
          emergencyContactPhone,
          joiningDate,
          planId,
          membershipStartDate: startDate,
          membershipExpiryDate: expiryDate,
          trainerAssigned,
          paymentStatus,
          notes,
        });
      } else {
        await api.createMember({
          fullName,
          photo,
          phoneNumber,
          whatsAppNumber: whatsAppNumber || phoneNumber,
          email,
          gender,
          age: Number(age) || 25,
          height: height ? Number(height) : undefined,
          weight: weight ? Number(weight) : undefined,
          address,
          emergencyContactName,
          emergencyContactPhone,
          joiningDate,
          planId,
          membershipStartDate: startDate,
          membershipExpiryDate: expiryDate,
          trainerAssigned,
          paymentStatus,
          paidAmount: Number(paidAmount) || 0,
          paymentMode,
          notes,
        });

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }

      onMemberCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save member');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanObj = plans.find((p) => p.id === planId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Member Profile' : 'Register New Gym Member'}
      subtitle={isEditing ? `Editing ${memberToEdit?.memberCode}` : 'Fill in member details and membership duration'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Personal & Contact Details */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            1. Personal & Contact Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (!whatsAppNumber) setWhatsAppNumber(e.target.value);
                }}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                WhatsApp Number (for Expiry Reminders)
              </label>
              <input
                type="text"
                value={whatsAppNumber}
                onChange={(e) => setWhatsAppNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="72"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Street, City"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Section 2: Membership Plan & Auto Expiry Calculation */}
        <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            2. Membership Plan & Automated Expiry Engine
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Select Membership Plan *
              </label>
              <select
                required
                value={planId}
                onChange={(e) => {
                  setPlanId(e.target.value);
                  const p = plans.find((pl) => pl.id === e.target.value);
                  if (p && !isEditing) {
                    setPaidAmount(p.price.toString());
                  }
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${p.price} ({p.durationMonths} Months)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Assigned Trainer
              </label>
              <select
                value={trainerAssigned}
                onChange={(e) => setTrainerAssigned(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="None">None (General Floor)</option>
                <option value="David Miller">David Miller (Strength & Conditioning)</option>
                <option value="Emma Rodriguez">Emma Rodriguez (HIIT & Mobility)</option>
                <option value="Alex Johnson">Alex Johnson (Bodybuilding)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Membership Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Calculated Expiry Date (Auto Generated)
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-blue-400 dark:border-blue-500/50 bg-blue-50/40 dark:bg-blue-950/20 text-zinc-900 dark:text-white text-xs sm:text-sm font-mono font-semibold"
              />
            </div>
          </div>

          {/* Auto Expiry Calculation Info Box */}
          <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>
                Plan Duration: <strong>{selectedPlanObj?.durationMonths || 1} Month(s)</strong>
              </span>
            </div>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              Valid until: {formatDate(expiryDate)}
            </span>
          </div>
        </div>

        {/* Section 3: Initial Payment & Billing */}
        {!isEditing && (
          <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              3. Initial Payment & Invoice
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => {
                    const status = e.target.value as any;
                    setPaymentStatus(status);
                    if (status === 'pending') setPaidAmount('0');
                    if (status === 'paid' && selectedPlanObj) setPaidAmount(selectedPlanObj.price.toString());
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm"
                >
                  <option value="paid">Full Payment Received</option>
                  <option value="partial">Partial Payment</option>
                  <option value="pending">Pending Payment</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Amount Collected ($)
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="65"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm capitalize"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Instant Pay</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="online">Online Transfer</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Notes */}
        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
            Trainer Notes / Fitness Goals
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Focus on weight loss, recovery stretching..."
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Complete Registration & Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
