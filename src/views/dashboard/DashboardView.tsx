import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { DashboardStats, Member, RenewalRecord } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Flame,
  DollarSign,
  CreditCard,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  Dumbbell,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { WhatsAppReminderModal } from '../../components/common/WhatsAppReminderModal';
import { NavView } from '../../components/layout/Sidebar';

interface DashboardViewProps {
  onNavigate?: (view: NavView) => void;
  onOpenNewMember?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate: propOnNavigate,
  onOpenNewMember: propOnOpenNewMember,
}) => {
  const navigate = useNavigate();
  const onNavigate = (v: NavView) => {
    if (propOnNavigate) propOnNavigate(v);
    else navigate(`/${v}`);
  };
  const onOpenNewMember = () => {
    if (propOnOpenNewMember) propOnOpenNewMember();
    else navigate('/members');
  };
  const { gym } = useAuth();
  const { triggerScan, systemDate } = useNotifications();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMemberForReminder, setSelectedMemberForReminder] = useState<Member | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [systemDate]);

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      await triggerScan();
      await loadStats();
    } finally {
      setIsScanning(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-zinc-200 dark:bg-zinc-900 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Members',
      value: stats?.totalMembers || 0,
      subtext: `${stats?.activeMembers || 0} active members`,
      icon: Users,
      trend: '+12.5%',
      trendColor: 'text-green-500',
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/40',
      view: 'members' as NavView,
    },
    {
      title: 'Expiring Soon',
      value: stats?.expiringThisWeek || stats?.expiringToday || 0,
      subtext: `${stats?.expiringToday || 0} expiring today`,
      icon: Clock,
      trend: 'Next 7 days',
      trendColor: 'text-amber-500',
      color: 'text-amber-400',
      bg: 'bg-amber-950/40',
      view: 'calendar' as NavView,
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue || 0, gym?.currency || '$'),
      subtext: 'Target: $15,000',
      icon: DollarSign,
      trend: 'Budget: 85%',
      trendColor: 'text-indigo-400',
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/40',
      view: 'payments' as NavView,
    },
    {
      title: "Today's Attendance",
      value: stats?.todayAttendance || 0,
      subtext: `${stats?.attendanceRate || 0}% active attended`,
      icon: Activity,
      trend: 'Peak: 5 PM',
      trendColor: 'text-gray-500',
      color: 'text-gray-400',
      bg: 'bg-[#1a1a1a]',
      view: 'attendance' as NavView,
    },
    {
      title: 'Active Members',
      value: stats?.activeMembers || 0,
      subtext: 'Consistent membership',
      icon: UserCheck,
      trend: 'Retention 94%',
      trendColor: 'text-green-500',
      color: 'text-green-400',
      bg: 'bg-green-950/40',
      view: 'members' as NavView,
    },
    {
      title: 'Pending Balances',
      value: formatCurrency(stats?.pendingPayments || 0, gym?.currency || '$'),
      subtext: 'Uncollected dues',
      icon: CreditCard,
      trend: 'Action needed',
      trendColor: 'text-rose-500',
      color: 'text-rose-400',
      bg: 'bg-rose-950/40',
      view: 'payments' as NavView,
    },
    {
      title: 'Expiring Today',
      value: stats?.expiringToday || 0,
      subtext: 'Immediate renewal action',
      icon: AlertTriangle,
      trend: stats?.expiringToday ? 'Send reminder' : 'All clear',
      trendColor: stats?.expiringToday ? 'text-amber-500' : 'text-gray-500',
      color: stats?.expiringToday ? 'text-amber-500' : 'text-gray-500',
      bg: stats?.expiringToday ? 'bg-amber-950/50' : 'bg-[#1a1a1a]',
      view: 'notifications' as NavView,
    },
    {
      title: 'Expired Members',
      value: stats?.expiredMembers || 0,
      subtext: 'Win-back campaigns',
      icon: UserX,
      trend: '10% promo active',
      trendColor: 'text-rose-400',
      color: 'text-rose-400',
      bg: 'bg-rose-950/40',
      view: 'members' as NavView,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">
                Welcome back, {gym?.ownerName || 'Mike'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                LIVE
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">
              {gym?.name || 'IronPulse Fitness'} • Automated Expiry Engine active for {stats?.totalMembers || 0} members.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunScan}
            disabled={isScanning}
            className="px-3 py-2 rounded-md bg-[#1a1a1a] hover:bg-[#262626] text-gray-300 text-xs font-medium border border-[#262626] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-indigo-400' : 'text-gray-400'}`} />
            <span>{isScanning ? 'Scanning...' : 'Run Scan'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ai')}
            className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Expiry Alert Callout if members expire today */}
      {stats && stats.expiringToday > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#141414] border border-amber-500/40 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">
                {stats.expiringToday} Membership{stats.expiringToday > 1 ? 's' : ''} Expiring Today!
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Send WhatsApp renewal reminders with 1-click to prevent member drop-offs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            View Alerts →
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          return (
            <div
              key={idx}
              onClick={() => onNavigate(kpi.view)}
              className="bg-[#141414] border border-[#262626] p-4 rounded-xl shadow-sm hover:border-[#3b3b3b] transition-all cursor-pointer group flex flex-col justify-between"
            >
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 font-mono">
                {kpi.title}
              </p>

              <div className="flex items-end justify-between mt-1">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {kpi.value}
                </h3>
                <span className={`text-xs font-semibold ${kpi.trendColor}`}>
                  {kpi.trend}
                </span>
              </div>

              <p className="text-[10px] text-gray-600 mt-2 font-mono truncate">
                {kpi.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Analysis Chart */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#262626] rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#262626] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest font-mono">
              Revenue Analysis
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="text-[10px] text-gray-500 font-mono">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-gray-500 font-mono">Target</span>
              </div>
            </div>
          </div>

          <div className="p-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueChart || []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#262626" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141414',
                    borderColor: '#262626',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" />
                <Area type="monotone" dataKey="target" name="Target" stroke="#10B981" strokeDasharray="3 3" strokeWidth={1.5} fillOpacity={1} fill="url(#targetGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#262626]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest font-mono">
              Recent Activity
            </h2>
          </div>

          <div className="flex-1 overflow-hidden divide-y divide-[#262626] max-h-[320px] overflow-y-auto">
            {stats?.recentActivities?.map((act, i) => {
              const dotColor =
                act.type === 'renewal'
                  ? 'bg-green-500'
                  : act.type === 'member_join'
                  ? 'bg-indigo-500'
                  : act.type === 'payment'
                  ? 'bg-emerald-500'
                  : act.type === 'expiry'
                  ? 'bg-red-500'
                  : 'bg-amber-500';

              return (
                <div key={act.id || i} className="p-4 hover:bg-[#1a1a1a] flex gap-3 transition-colors">
                  <div className={`w-2 h-2 mt-1.5 rounded-full ${dotColor} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-sans truncate">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {act.description}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5 uppercase font-mono">
                      {act.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secondary Row: Membership Types & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Types Distribution */}
        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest font-mono">
              Membership Distribution
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">Active Plans</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.planDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(stats?.planDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141414',
                    borderColor: '#262626',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-[#262626]">
            {(stats?.planDistribution || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-300 font-medium truncate max-w-[140px]">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono text-white">
                  {item.count} members
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Attendance Trend */}
        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-widest font-mono">
                Attendance Velocity
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Past 7 days daily check-ins
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('attendance')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Full Log →
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.attendanceTrend || []}>
                <CartesianGrid strokeDasharray="2 2" stroke="#262626" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141414',
                    borderColor: '#262626',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" name="Check-ins" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal trigger if needed */}
      <WhatsAppReminderModal
        isOpen={!!selectedMemberForReminder}
        onClose={() => setSelectedMemberForReminder(null)}
        member={selectedMemberForReminder}
        gym={gym}
      />
    </div>
  );
};
