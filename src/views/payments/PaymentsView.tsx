import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Payment } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  CreditCard,
  DollarSign,
  Plus,
  Download,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Printer,
  Sparkles,
} from 'lucide-react';
import { NewPaymentModal } from './NewPaymentModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { EmptyState } from '../../components/common/EmptyState';

export const PaymentsView: React.FC = () => {
  const { gym } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPayments({
        mode: modeFilter !== 'all' ? modeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      setPayments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [modeFilter, statusFilter, search]);

  const totalCollected = payments.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const totalPending = payments.reduce((acc, p) => acc + (p.pendingAmount || 0), 0);

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    const headers = [
      'Receipt #',
      'Invoice #',
      'Date',
      'Member Code',
      'Member Name',
      'Plan',
      'Total Amount',
      'Paid Amount',
      'Pending Amount',
      'Payment Mode',
      'Status',
    ];
    const rows = payments.map((p) => [
      p.receiptNumber,
      p.invoiceNumber,
      p.paymentDate,
      p.memberCode || '',
      `"${p.memberName || ''}"`,
      `"${p.planName || ''}"`,
      p.amount,
      p.paidAmount,
      p.pendingAmount,
      p.mode,
      p.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GymFlow_Billing_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Payments & Billing Invoices
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Track revenue, issue official receipts, and manage pending subscription fees
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-gray-300 text-xs font-medium hover:bg-[#262626] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewPaymentModalOpen(true)}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-mono">Total Paid Collections</p>
            <p className="text-2xl font-semibold text-emerald-400 mt-1 font-mono tracking-tight">
              {formatCurrency(totalCollected, gym?.currency || '$')}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-sans">Across {payments.length} transactions</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-mono">Uncollected Pending</p>
            <p className="text-2xl font-semibold text-rose-400 mt-1 font-mono tracking-tight">
              {formatCurrency(totalPending, gym?.currency || '$')}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-sans">Requires front desk follow-up</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-mono">Payment Mode Diversity</p>
            <p className="text-xl font-medium text-white mt-1">
              UPI • Cash • Card
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-sans">Instant receipt dispatch</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt #, invoice #, or member name..."
            className="w-full pl-9.5 pr-4 py-2 rounded-md text-xs bg-[#1a1a1a] border border-[#262626] text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-2 rounded-md text-xs bg-[#1a1a1a] border border-[#262626] text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Payment Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI / Instant</option>
            <option value="card">Card</option>
            <option value="online">Online Transfer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-md text-xs bg-[#1a1a1a] border border-[#262626] text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Fully Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl bg-[#141414] border border-[#262626] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-gray-500 animate-pulse font-mono">
            Loading billing records...
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            title="No Payment Records"
            description="No transactions found matching your filter criteria."
            actionLabel="Record New Payment"
            onAction={() => setIsNewPaymentModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#262626] bg-[#0d0d0d] text-gray-500 uppercase font-medium text-[10px] tracking-wider font-mono">
                  <th className="py-3.5 px-4">Receipt / Invoice</th>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Plan / Item</th>
                  <th className="py-3.5 px-4">Paid Amount</th>
                  <th className="py-3.5 px-4">Pending</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] font-sans">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <p className="font-medium text-white">
                        {p.receiptNumber}
                      </p>
                      <p className="text-[10px] text-gray-500">{p.invoiceNumber}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-white">
                        {p.memberName}
                      </p>
                      <span className="text-[10px] font-mono text-gray-500">
                        {p.memberCode}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-300">
                      {p.planName || 'Membership'}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                      {formatCurrency(p.paidAmount, gym?.currency || '$')}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {p.pendingAmount > 0 ? (
                        <span className="font-medium text-rose-400">
                          {formatCurrency(p.pendingAmount, gym?.currency || '$')}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#1a1a1a] border border-[#262626] text-gray-300 capitalize">
                        {p.mode}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-400">
                      {formatDate(p.paymentDate)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(p)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#1a1a1a] border border-[#262626] text-gray-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors cursor-pointer text-xs font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Payment Modal */}
      <NewPaymentModal
        isOpen={isNewPaymentModalOpen}
        onClose={() => setIsNewPaymentModalOpen(false)}
        gym={gym}
        onPaymentRecorded={loadPayments}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
        gym={gym}
      />
    </div>
  );
};
