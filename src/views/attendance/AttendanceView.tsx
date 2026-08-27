import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { AttendanceRecord, Member } from '../../types';
import { formatDate } from '../../lib/utils';
import {
  UserCheck,
  Calendar,
  Search,
  Plus,
  Download,
  Clock,
  QrCode,
  CheckCircle2,
  Users,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { QuickCheckInModal } from '../../components/common/QuickCheckInModal';
import { EmptyState } from '../../components/common/EmptyState';

export const AttendanceView: React.FC = () => {
  const { gym } = useAuth();
  const { systemDate } = useNotifications();

  const [date, setDate] = useState(systemDate || '2026-08-27');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  const loadAttendance = async () => {
    try {
      setIsLoading(true);
      const [attData, membersData] = await Promise.all([
        api.getAttendance({ date }),
        api.getMembers(),
      ]);
      setRecords(attData);
      setMembers(membersData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [date, systemDate]);

  const filteredRecords = records.filter(
    (r) =>
      r.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.memberCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Date', 'Check-In Time', 'Member Code', 'Member Name', 'Method', 'Notes'];
    const rows = records.map((r) => [
      r.date,
      r.checkInTime,
      r.memberCode,
      `"${r.memberName}"`,
      r.method,
      `"${r.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GymFlow_Attendance_${date}.csv`);
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
            Daily Attendance & Check-Ins
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Real-time gym floor visits and biometric/desk check-in logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-gray-300 text-xs font-medium hover:bg-[#262626] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCheckInModalOpen(true)}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Express Check-In</span>
          </button>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-mono">Total Check-Ins Today</p>
            <p className="text-2xl font-semibold text-white mt-1 font-mono tracking-tight">
              {records.length}
            </p>
            <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">
              +{Math.round((records.length / Math.max(1, members.length)) * 100)}% attendance rate
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-mono">Peak Workout Window</p>
            <p className="text-2xl font-semibold text-white mt-1 font-mono tracking-tight">
              06:00 - 08:30 PM
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-sans">
              High gym floor occupancy
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-mono">Active Enrolled Members</p>
            <p className="text-2xl font-semibold text-white mt-1 font-mono tracking-tight">
              {members.filter((m) => m.status === 'active').length}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-sans">
              Valid membership passes
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Date & Filter Bar */}
      <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Select Date:</span>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-[#262626] bg-[#1a1a1a] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by name or code..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md text-xs bg-[#1a1a1a] border border-[#262626] text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-xl bg-[#141414] border border-[#262626] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-gray-500 animate-pulse font-mono">
            Loading attendance records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            title="No Check-Ins Logged"
            description={`No attendance records found for ${formatDate(date)}.`}
            actionLabel="Punch In Check-In"
            onAction={() => setIsCheckInModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#262626] bg-[#0d0d0d] text-gray-500 uppercase font-medium text-[10px] tracking-wider font-mono">
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Member Code</th>
                  <th className="py-3.5 px-4">Check-In Method</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] font-sans">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-white">
                      {r.checkInTime}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {r.memberName?.[0] || 'M'}
                        </div>
                        <span className="font-medium text-white">
                          {r.memberName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {r.memberCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#1a1a1a] border border-[#262626] text-gray-300 capitalize">
                        {r.method === 'code' ? <Clock className="w-3 h-3 text-indigo-400" /> : <QrCode className="w-3 h-3 text-indigo-400" />}
                        {r.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {r.notes || 'Front desk standard pass'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Express Check In Modal */}
      <QuickCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onCheckInSuccess={loadAttendance}
      />
    </div>
  );
};
