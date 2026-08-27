import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { Member, MembershipPlan, Gym } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { CreditCard, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  gym: Gym | null;
  onPaymentRecorded: () => void;
}

export const NewPaymentModal: React.FC<NewPaymentModalProps> = ({
  isOpen,
  onClose,
  gym,
  onPaymentRecorded,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('65');
  const [paidAmount, setPaidAmount] = useState('65');
  const [mode, setMode] = useState('cash');
  const [paymentDate, setPaymentDate] = useState('2026-08-27');
  const [notes, setNotes] = useState('Manual billing collection');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  const loadMembers = async () => {
    try {
      const data = await api.getMembers();
      setMembers(data);
      if (data.length > 0) {
        setSelectedMemberId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError('Please select a member');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const member = members.find((m) => m.id === selectedMemberId);
      await api.createPayment({
        memberId: selectedMemberId,
        amount: Number(amount) || 0,
        paidAmount: Number(paidAmount) || 0,
        mode,
        paymentDate,
        planName: member?.planName || 'Gym Subscription',
        notes,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      onPaymentRecorded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  const pending = Math.max(0, (Number(amount) || 0) - (Number(paidAmount) || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      subtitle="Issue an invoice and receipt for membership fees or extras"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
            Select Member *
          </label>
          <select
            required
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm font-sans"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.memberCode}) — {m.planName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Total Invoice Amount ($) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setPaidAmount(e.target.value);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Amount Received ($) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>

        {pending > 0 && (
          <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs text-rose-500 flex justify-between font-semibold">
            <span>Balance Remaining Pending:</span>
            <span>{formatCurrency(pending, gym?.currency || '$')}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Payment Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm capitalize"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI / Instant Pay</option>
              <option value="card">Credit / Debit Card</option>
              <option value="online">Online Transfer</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
            Notes / Description
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Monthly renewal fee"
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm"
          />
        </div>

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
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Record Payment & Generate Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
