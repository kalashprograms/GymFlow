import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ReportData } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  Users,
  UserCheck,
  TrendingUp,
  CreditCard,
  Printer,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import jsPDF from 'jspdf';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { gym } = useAuth();
  const [report, setReport] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const data = await api.getReports({ period });
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period]);

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(`${gym?.name || 'GymFlow'} — Business Performance Report`, 20, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()} | Period: ${period.toUpperCase()}`, 20, 32);

      doc.setLineWidth(0.5);
      doc.line(20, 36, 190, 36);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Performance Indicators', 20, 48);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Revenue Collected: ${formatCurrency(report?.totalRevenue || 0, gym?.currency || '$')}`, 20, 58);
      doc.text(`Pending Balance: ${formatCurrency(report?.pendingPayments || 0, gym?.currency || '$')}`, 20, 66);
      doc.text(`New Member Enrolments: ${report?.newMembers || 0}`, 20, 74);
      doc.text(`Expired Members: ${report?.expiredMembers || 0}`, 20, 82);
      doc.text(`Total Gym Floor Check-Ins: ${report?.totalAttendance || 0}`, 20, 90);

      doc.save(`GymFlow_Report_${period}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    if (!report?.monthlyBreakdown) return;
    const headers = ['Month', 'Revenue', 'Target', 'New Members', 'Expired Members'];
    const rows = report.monthlyBreakdown.map((r) => [
      r.month,
      r.revenue,
      r.target,
      r.newMembers,
      r.expired,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GymFlow_Financial_Report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Reports & Business Intelligence
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Audit gym performance, cash flow, retention metrics, and export data
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center bg-[#141414] border border-[#262626] rounded-md p-1 shadow-xs">
            {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                  period === p
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-gray-300 text-xs font-medium hover:bg-[#262626] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF Summary</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-gray-500 font-mono">Total Period Revenue</p>
            <p className="text-2xl font-semibold text-emerald-400 mt-1 font-mono tracking-tight">
              {formatCurrency(report?.totalRevenue || 0, gym?.currency || '$')}
            </p>
            <p className="text-[11px] text-emerald-500 mt-0.5 font-mono">+16.4% YoY</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-gray-500 font-mono">New Enrolments</p>
            <p className="text-2xl font-semibold text-white mt-1 font-mono tracking-tight">
              {report?.newMembers || 0}
            </p>
            <p className="text-[11px] text-indigo-400 mt-0.5 font-mono">Acquisition pace</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-gray-500 font-mono">Total Check-Ins</p>
            <p className="text-2xl font-semibold text-white mt-1 font-mono tracking-tight">
              {report?.totalAttendance || 0}
            </p>
            <p className="text-[11px] text-indigo-400 mt-0.5 font-mono">Member engagement</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-gray-500 font-mono">Pending Collectibles</p>
            <p className="text-2xl font-semibold text-rose-400 mt-1 font-mono tracking-tight">
              {formatCurrency(report?.pendingPayments || 0, gym?.currency || '$')}
            </p>
            <p className="text-[11px] text-rose-400 mt-0.5 font-mono">Overdue accounts</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Breakdown Chart */}
      <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white font-sans">
              Revenue & Growth Breakdown
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">
              Historical monthly trends for {gym?.name}
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report?.monthlyBreakdown || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="month" stroke="#666666" fontSize={11} tickLine={false} fontFamily="monospace" />
              <YAxis stroke="#666666" fontSize={11} tickLine={false} fontFamily="monospace" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  borderColor: '#262626',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#888' }} />
              <Bar dataKey="revenue" name="Revenue ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="rounded-xl bg-[#141414] border border-[#262626] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#262626] bg-[#0d0d0d] flex items-center justify-between">
          <h4 className="text-xs font-mono font-medium uppercase tracking-wider text-gray-300">
            Monthly Performance Table
          </h4>
          <span className="text-xs text-gray-500 font-mono">All amounts in {gym?.currency || 'USD'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="border-b border-[#262626] text-gray-500 uppercase font-medium text-[10px] tracking-wider font-mono">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">New Members</th>
                <th className="py-3 px-4">Expired</th>
                <th className="py-3 px-4 text-right">Net Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {(report?.monthlyBreakdown || []).map((row, idx) => (
                <tr key={idx} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white font-mono">
                    {row.month}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                    {formatCurrency(row.revenue, gym?.currency || '$')}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-400">
                    {formatCurrency(row.target, gym?.currency || '$')}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-indigo-400">
                    +{row.newMembers}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-rose-400">
                    -{row.expired}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium">
                    <span className={row.newMembers - row.expired >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {row.newMembers - row.expired >= 0 ? `+${row.newMembers - row.expired}` : row.newMembers - row.expired}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
