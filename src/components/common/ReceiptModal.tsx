import React from 'react';
import { Modal } from './Modal';
import { Payment, Gym } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  gym: Gym | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  gym,
}) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(gym?.name || 'GymFlow Fitness', 20, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${gym?.address || ''}, ${gym?.city || ''}, ${gym?.country || ''}`, 20, 32);
      doc.text(`Phone: ${gym?.phone || ''} | Email: ${gym?.email || ''}`, 20, 37);

      doc.setLineWidth(0.5);
      doc.line(20, 42, 190, 42);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL PAYMENT RECEIPT', 20, 52);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Receipt #: ${payment.receiptNumber}`, 20, 62);
      doc.text(`Invoice #: ${payment.invoiceNumber}`, 20, 68);
      doc.text(`Date: ${formatDate(payment.paymentDate)}`, 20, 74);
      doc.text(`Payment Mode: ${payment.mode.toUpperCase()}`, 20, 80);

      doc.text(`Billed To: ${payment.memberName || 'Valued Member'} (${payment.memberCode || ''})`, 120, 62);
      doc.text(`Plan/Item: ${payment.planName || 'Membership'}`, 120, 68);
      doc.text(`Status: ${payment.pendingAmount <= 0 ? 'COMPLETED (PAID)' : 'PARTIAL'}`, 120, 74);

      // Table Header
      doc.setFillColor(245, 247, 250);
      doc.rect(20, 90, 170, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 25, 96);
      doc.text('Plan Amount', 110, 96);
      doc.text('Paid Amount', 155, 96);

      // Table Row
      doc.setFont('helvetica', 'normal');
      doc.text(payment.planName || 'Membership Plan Fee', 25, 108);
      doc.text(formatCurrency(payment.amount, gym?.currency || '$'), 110, 108);
      doc.text(formatCurrency(payment.paidAmount, gym?.currency || '$'), 155, 108);

      doc.line(20, 115, 190, 115);

      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount:', 120, 125);
      doc.text(formatCurrency(payment.amount, gym?.currency || '$'), 160, 125);

      doc.text('Amount Received:', 120, 133);
      doc.text(formatCurrency(payment.paidAmount, gym?.currency || '$'), 160, 133);

      if (payment.pendingAmount > 0) {
        doc.setTextColor(200, 30, 30);
        doc.text('Balance Pending:', 120, 141);
        doc.text(formatCurrency(payment.pendingAmount, gym?.currency || '$'), 160, 141);
        doc.setTextColor(0, 0, 0);
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('This is a computer generated receipt issued by GymFlow. No physical signature required.', 20, 170);

      doc.save(`Receipt_${payment.receiptNumber}.pdf`);
    } catch (e) {
      console.error('Failed to generate receipt PDF:', e);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Receipt"
      subtitle={`Receipt #${payment.receiptNumber}`}
      maxWidth="lg"
    >
      <div className="space-y-6 font-sans">
        {/* Thermal / Digital Receipt Card */}
        <div className="border border-[#262626] rounded-xl p-6 bg-[#0d0d0d] font-sans">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#262626] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-mono font-medium text-xs">
                  GF
                </div>
                <h4 className="text-base font-semibold text-white font-sans">
                  {gym?.name || 'IronPulse Fitness Club'}
                </h4>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-sans">
                {gym?.address}, {gym?.city}
              </p>
              <p className="text-[11px] text-gray-500 font-mono">
                Phone: {gym?.phone} | {gym?.email}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Payment Received
              </span>
              <p className="text-xs font-mono text-gray-500 mt-1.5">{payment.receiptNumber}</p>
            </div>
          </div>

          {/* Member & Payment Meta */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-[#262626] text-xs font-sans">
            <div>
              <p className="text-gray-500 text-[11px] font-mono">BILLED TO</p>
              <p className="font-medium text-white mt-0.5">
                {payment.memberName}
              </p>
              <p className="text-gray-500 font-mono">{payment.memberCode}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-[11px] font-mono">PAYMENT DETAILS</p>
              <p className="font-medium text-white mt-0.5 font-mono">
                Date: {formatDate(payment.paymentDate)}
              </p>
              <p className="text-gray-500 capitalize">Mode: {payment.mode}</p>
            </div>
          </div>

          {/* Line Items */}
          <div className="py-4 space-y-3">
            <div className="flex justify-between text-xs font-mono text-gray-500">
              <span>ITEM DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2.5 bg-[#141414] px-3.5 rounded-lg border border-[#262626]">
              <div>
                <p className="font-medium text-white font-sans">
                  {payment.planName || 'Membership Subscription'}
                </p>
                <p className="text-xs text-gray-500 font-mono">Invoice: {payment.invoiceNumber}</p>
              </div>
              <span className="font-mono font-medium text-white">
                {formatCurrency(payment.amount, gym?.currency || '$')}
              </span>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-[#262626] pt-3 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(payment.amount, gym?.currency || '$')}</span>
            </div>
            <div className="flex justify-between font-semibold text-sm text-white pt-1">
              <span>Paid Total</span>
              <span className="text-emerald-400 font-mono">
                {formatCurrency(payment.paidAmount, gym?.currency || '$')}
              </span>
            </div>
            {payment.pendingAmount > 0 && (
              <div className="flex justify-between font-medium text-xs text-rose-400 pt-1">
                <span>Remaining Pending</span>
                <span>{formatCurrency(payment.pendingAmount, gym?.currency || '$')}</span>
              </div>
            )}
          </div>

          {/* Security stamp */}
          <div className="mt-5 pt-4 border-t border-dashed border-[#262626] flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5 text-gray-400 font-sans">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified & Sealed by GymFlow
            </div>
            <span className="font-mono text-[10px]">AUTH-{payment.id.toUpperCase()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border border-[#262626] bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>
    </Modal>
  );
};
