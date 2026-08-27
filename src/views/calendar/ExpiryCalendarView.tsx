import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Member } from '../../types';
import { formatDate, getDaysRemaining } from '../../lib/utils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  Users,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { WhatsAppReminderModal } from '../../components/common/WhatsAppReminderModal';

export const ExpiryCalendarView: React.FC = () => {
  const { gym } = useAuth();
  const { systemDate } = useNotifications();

  const [members, setMembers] = useState<Member[]>([]);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed: 7 = August
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-27');
  const [selectedMemberForWhatsApp, setSelectedMemberForWhatsApp] = useState<Member | null>(null);

  useEffect(() => {
    loadMembers();
  }, [systemDate]);

  const loadMembers = async () => {
    try {
      const data = await api.getMembers();
      setMembers(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Group members by expiry date string 'YYYY-MM-DD'
  const expiriesByDate: { [dateStr: string]: Member[] } = {};
  members.forEach((m) => {
    if (m.membershipExpiryDate) {
      if (!expiriesByDate[m.membershipExpiryDate]) {
        expiriesByDate[m.membershipExpiryDate] = [];
      }
      expiriesByDate[m.membershipExpiryDate].push(m);
    }
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedDateMembers = expiriesByDate[selectedDate] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Membership Expiry Calendar
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Visual month-by-month schedule of upcoming renewals and expired passes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#141414] border border-[#262626] rounded-md p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-medium text-white min-w-[130px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-md hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid & Selected Date Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Calendar View */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm space-y-4">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 text-center text-xs font-mono text-gray-500 uppercase tracking-wider py-1 border-b border-[#262626]">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty slots for start day */}
            {[...Array(firstDayOfWeek)].map((_, i) => (
              <div key={`empty-${i}`} className="h-20 sm:h-24 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]" />
            ))}

            {/* Days of Month */}
            {[...Array(daysInMonth)].map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayExpiries = expiriesByDate[dateStr] || [];
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === '2026-08-27';

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-20 sm:h-24 p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                      : dayExpiries.length > 0
                      ? 'border-amber-500/30 bg-amber-950/20 hover:border-amber-500/50'
                      : 'border-[#262626] bg-[#0d0d0d] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono ${
                        isToday
                          ? 'w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold'
                          : 'text-gray-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dayExpiries.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>

                  {dayExpiries.length > 0 ? (
                    <div className="space-y-0.5">
                      <span className="block text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 truncate">
                        {dayExpiries.length} Expiring
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-600 italic">
                      No expiries
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Panel */}
        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                  Selected Date
                </p>
                <h3 className="text-base font-semibold text-white mt-0.5 font-sans">
                  {formatDate(selectedDate)}
                </h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {selectedDateMembers.length} Expiring
              </span>
            </div>

            {/* List of members expiring on this day */}
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
              {selectedDateMembers.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 font-mono">
                  No memberships expire on this day.
                </div>
              ) : (
                selectedDateMembers.map((m) => {
                  const daysLeft = getDaysRemaining(m.membershipExpiryDate);
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg bg-[#0d0d0d] border border-[#262626] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-white">
                            {m.fullName}
                          </p>
                          <p className="text-[10px] font-mono text-gray-500">
                            {m.memberCode} • {m.planName}
                          </p>
                        </div>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            daysLeft < 0
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : daysLeft === 0
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {daysLeft < 0
                            ? 'Expired'
                            : daysLeft === 0
                            ? 'Today'
                            : `In ${daysLeft} days`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#262626] text-xs">
                        <span className="text-gray-400 text-[11px] font-mono">
                          {m.phoneNumber}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedMemberForWhatsApp(m)}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3 bg-[#0d0d0d] rounded-lg border border-[#262626] text-xs text-gray-400">
            <div className="flex items-center gap-2 text-indigo-400 font-medium mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Smart Retention Tip</span>
            </div>
            Members contacted 3 days before expiry have a 92% renewal retention rate compared to overdue follow-ups.
          </div>
        </div>
      </div>

      {/* Embedded WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={!!selectedMemberForWhatsApp}
        onClose={() => setSelectedMemberForWhatsApp(null)}
        member={selectedMemberForWhatsApp}
        gym={gym}
      />
    </div>
  );
};
