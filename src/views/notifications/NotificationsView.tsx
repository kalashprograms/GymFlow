import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Clock,
  Sparkles,
  CalendarCheck,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { WhatsAppReminderModal } from '../../components/common/WhatsAppReminderModal';
import { Member } from '../../types';
import { api } from '../../services/api';

export const NotificationsView: React.FC = () => {
  const { gym } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    triggerScan,
    systemDate,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'expiry'>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedMemberForWhatsApp, setSelectedMemberForWhatsApp] = useState<Member | null>(null);

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      await triggerScan();
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenWhatsAppFromNotif = async (memberId?: string) => {
    if (!memberId) return;
    try {
      const res = await api.getMember(memberId);
      if (res.member) {
        setSelectedMemberForWhatsApp(res.member);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'expiry') return n.type === 'expiry';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Smart Expiry Reminders & Notifications
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Automated alerts scheduled at 7, 3, 1, and 0 days before membership expiration
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-3 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-gray-300 text-xs font-medium hover:bg-[#262626] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRunScan}
            disabled={isScanning}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Running Scan...' : 'Scan Expiries Now'}</span>
          </button>
        </div>
      </div>

      {/* Auto-Scheduler Info Banner */}
      <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-white uppercase tracking-wider">
                Automated Background Reminder Engine
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 font-sans">
              Engine calculates remaining days based on System Date (<strong className="text-white font-mono">{formatDate(systemDate)}</strong>) and triggers WhatsApp & email reminder queues automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#262626] text-xs font-medium gap-4 font-sans">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`pb-2.5 transition-colors cursor-pointer ${
            filter === 'all'
              ? 'text-white border-b-2 border-indigo-500'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`pb-2.5 transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'text-white border-b-2 border-indigo-500'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('expiry')}
          className={`pb-2.5 transition-colors cursor-pointer ${
            filter === 'expiry'
              ? 'text-white border-b-2 border-indigo-500'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Membership Expiries Only
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 bg-[#141414] rounded-xl border border-[#262626] font-mono">
            No notifications found under this filter. All memberships are up to date!
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer ${
                !n.isRead
                  ? 'bg-[#141414] border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-sm'
                  : 'bg-[#141414] border-[#262626] hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    n.priority === 'high'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : n.priority === 'medium'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}
                >
                  {n.priority === 'high' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-medium text-white">
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-600 text-white uppercase">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {n.message}
                  </p>
                  <span className="text-[11px] text-gray-500 font-mono mt-1.5 block">
                    Logged: {formatDate(n.createdAt)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {n.memberId && (
                <div
                  className="flex items-center gap-2 self-end sm:self-center shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppFromNotif(n.memberId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Reminder</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
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
