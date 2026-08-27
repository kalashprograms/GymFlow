import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Member, MembershipPlan, Gym } from '../../types';
import { calculateExpiryDate, formatCurrency, formatDate } from '../../lib/utils';
import { Sparkles, Calendar, DollarSign, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  plans: MembershipPlan[];
  gym: Gym | null;
  onRenewSuccess: () => void;
}

export const RenewalModal: React.FC<RenewalModalProps> = ({
  isOpen,
  onClose,
  member,
  plans,
  gym,
  onRenewSuccess,
}) => {
  if (!member) return null;

  const [selectedPlanId, setSelectedPlanId] = useState(member.planId || plans[0]?.id || '');
  const [startDate, setStartDate] = useState(
    member.status === 'active' && new Date(member.membershipExpiryDate) > new Date()
      ? member.membershipExpiryDate
      : '2026-08-27'
  );
  const [calculatedExpiry, setCalculatedExpiry] = useState('');
  const [amount, setAmount] = useState('65');
  const [paidAmount, setPaidAmount] = useState('65');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      const plan = plans.find((p) => p.id === selectedPlanId) || plans[0];
      if (plan) {
        // If member is active, extend from current expiry date, else from today
        const isFuture = new Date(member.membershipExpiryDate) > new Date('2026-08-27');
        const start = isFuture ? member.membershipExpiryDate : '2026-08-27';
        setStartDate(start);

        const newExp = calculateExpiryDate(start, plan.durationMonths, plan.durationDays);
        setCalculatedExpiry(newExp);

        const basePrice = plan.price;
        const discount = Number(discountPercent) || 0;
        const finalPrice = Math.max(0, basePrice - (basePrice * discount) / 100);
        setAmount(finalPrice.toString());
        setPaidAmount(finalPrice.toString());
      }
    }
  }, [member, selectedPlanId, discountPercent, plans]);

  const handlePlanChange = (pId: string) => {
    setSelectedPlanId(pId);
  };

  const handleApplyDiscountPreset = (pct: number) => {
    setDiscountPercent(pct.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await api.renewMembership(member.id, {
        planId: selectedPlanId,
        startDate,
        paymentMode,
        paidAmount: Number(paidAmount) || 0,
        discount: Number(discountPercent) || 0,
        notes,
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      onRenewSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to renew membership');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanObj = plans.find((p) => p.id === selectedPlanId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Renew Membership"
      subtitle={`Renewing subscription for ${member.fullName} (${member.memberCode})`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
            {error}
          </div>
        )}

        {/* Current status banner */}
        <div className="p-3.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
              Current Membership
            </span>
            <p className="font-bold text-zinc-900 dark:text-white mt-0.5">
              {member.planName} • Expiring: {formatDate(member.membershipExpiryDate)}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              member.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
            }`}
          >
            {member.status}
          </span>
        </div>

        {/* Plan Picker */}
        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
            Select Renewal Plan *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {plans.map((p) => {
              const isSelected = selectedPlanId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handlePlanChange(p.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-zinc-900 dark:text-white ring-1 ring-blue-600'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{p.name}</span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      ${p.price}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {p.durationMonths} Month(s) duration
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Date & Auto Calculated Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Renewal Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs sm:text-sm font-mono text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              New Expiry Date (Auto Extended)
            </label>
            <input
              type="date"
              readOnly
              value={calculatedExpiry}
              className="w-full px-3 py-2 rounded-xl border border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-mono font-bold"
            />
          </div>
        </div>

        {/* Discount Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Loyalty Discount (%)
            </label>
            <span className="text-[11px] text-zinc-400">Quick Presets:</span>
          </div>
          <div className="flex items-center gap-2">
            {[0, 5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleApplyDiscountPreset(pct)}
                className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${
                  discountPercent === pct.toString()
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {pct === 0 ? 'None' : `${pct}% Off`}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Amount & Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Amount to Collect ($)
            </label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm font-bold"
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
              <option value="upi">UPI / Instant</option>
              <option value="card">Card Payment</option>
              <option value="online">Online Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              Extending membership by {selectedPlanObj?.durationMonths || 1} month(s)
            </span>
          </div>
          <span className="font-bold">
            Total: {formatCurrency(Number(paidAmount) || 0, gym?.currency || '$')}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Processing Renewal...' : 'Confirm Renewal & Issue Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
