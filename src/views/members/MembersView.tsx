import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Member, MembershipPlan } from '../../types';
import { formatDate, getDaysRemaining } from '../../lib/utils';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  MoreVertical,
  Clock,
  MessageSquare,
  RefreshCw,
  UserCheck,
  Snowflake,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { MemberDetailModal } from './MemberDetailModal';
import { NewMemberModal } from './NewMemberModal';
import { RenewalModal } from './RenewalModal';
import { WhatsAppReminderModal } from '../../components/common/WhatsAppReminderModal';
import { EmptyState } from '../../components/common/EmptyState';

export const MembersView: React.FC = () => {
  const { gym } = useAuth();
  const { systemDate } = useNotifications();

  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Modals state
  const [selectedDetailMemberId, setSelectedDetailMemberId] = useState<string | null>(null);
  const [selectedRenewalMember, setSelectedRenewalMember] = useState<Member | null>(null);
  const [selectedWhatsAppMember, setSelectedWhatsAppMember] = useState<Member | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [membersData, plansData] = await Promise.all([
        api.getMembers({
          search: search.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          planId: planFilter !== 'all' ? planFilter : undefined,
        }),
        api.getPlans(),
      ]);
      setMembers(membersData);
      setPlans(plansData);
    } catch (e) {
      console.error('Failed to load members:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, planFilter, systemDate]);

  const handleToggleFreeze = async (member: Member) => {
    try {
      const newStatus = member.status === 'frozen' ? 'active' : 'frozen';
      await api.updateMember(member.id, { status: newStatus as any });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from GymFlow?`)) return;
    try {
      await api.deleteMember(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    if (members.length === 0) return;
    const headers = [
      'Member Code',
      'Full Name',
      'Phone',
      'WhatsApp',
      'Email',
      'Plan',
      'Status',
      'Start Date',
      'Expiry Date',
      'Payment Status',
    ];
    const rows = members.map((m) => [
      m.memberCode,
      `"${m.fullName}"`,
      m.phoneNumber,
      m.whatsAppNumber || m.phoneNumber,
      m.email || '',
      `"${m.planName}"`,
      m.status,
      m.membershipStartDate,
      m.membershipExpiryDate,
      m.paymentStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GymFlow_Members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Member Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Total {members.length} member records registered under {gym?.name}
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
            onClick={() => {
              setMemberToEdit(null);
              setIsNewMemberModalOpen(true);
            }}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, or member code (e.g. GF-1001)..."
            className="w-full pl-9.5 pr-4 py-2 rounded-md text-xs bg-[#1a1a1a] border border-[#262626] text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-md text-xs bg-[#1a1a1a] border border-[#262626] text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Members</option>
            <option value="expired">Expired Members</option>
            <option value="expiring_soon">Expiring Soon (Next 7 Days)</option>
            <option value="frozen">Frozen Accounts</option>
            <option value="pending">Pending Payments</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 rounded-md text-xs bg-[#1a1a1a] border border-[#262626] text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Table */}
      <div className="rounded-xl bg-[#141414] border border-[#262626] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-gray-500 animate-pulse font-mono">
            Loading members database...
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            title="No Members Found"
            description={
              search.trim()
                ? `No members found matching "${search}". Try adjusting your filters.`
                : 'Get started by adding your first gym member.'
            }
            actionLabel="Add New Member"
            onAction={() => {
              setMemberToEdit(null);
              setIsNewMemberModalOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#262626] bg-[#0d0d0d] text-gray-500 uppercase font-medium text-[10px] tracking-wider font-mono">
                  <th className="py-3.5 px-4">Member Info</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Membership Plan</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] font-sans">
                {members.map((m) => {
                  const daysLeft = getDaysRemaining(m.membershipExpiryDate);
                  const isExpiringSoon = daysLeft >= 0 && daysLeft <= 7;
                  const isExpired = daysLeft < 0;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-[#1a1a1a] transition-colors group cursor-pointer"
                      onClick={() => setSelectedDetailMemberId(m.id)}
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              m.photo ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={m.fullName}
                            className="w-9 h-9 rounded-lg object-cover border border-[#262626]"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-white group-hover:text-indigo-400 transition-colors">
                                {m.fullName}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-500">
                              {m.memberCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-gray-200">
                          {m.phoneNumber}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate max-w-[140px]">
                          {m.email || 'No email registered'}
                        </p>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-white">
                          {m.planName}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Trainer: {m.trainerAssigned || 'General'}
                        </p>
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium font-mono text-white">
                          {formatDate(m.membershipExpiryDate)}
                        </p>
                        <span
                          className={`text-[10px] font-mono ${
                            isExpired
                              ? 'text-red-400'
                              : isExpiringSoon
                              ? 'text-yellow-400'
                              : 'text-gray-500'
                          }`}
                        >
                          {isExpired
                            ? `Expired ${Math.abs(daysLeft)}d ago`
                            : daysLeft === 0
                            ? 'Expires Today'
                            : `${daysLeft} days remaining`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider ${
                            m.status === 'active'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : m.status === 'expired'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md capitalize ${
                            m.paymentStatus === 'paid'
                              ? 'bg-[#1a1a1a] text-gray-400 border border-[#262626]'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20 font-medium'
                          }`}
                        >
                          {m.paymentStatus}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {/* Send WhatsApp Reminder */}
                          <button
                            type="button"
                            onClick={() => setSelectedWhatsAppMember(m)}
                            title="Send WhatsApp Expiry Reminder"
                            className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Quick Renew */}
                          <button
                            type="button"
                            onClick={() => setSelectedRenewalMember(m)}
                            title="Renew Membership"
                            className="p-1.5 rounded-md text-indigo-400 hover:bg-indigo-950/40 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          {/* Freeze / Unfreeze */}
                          <button
                            type="button"
                            onClick={() => handleToggleFreeze(m)}
                            title={m.status === 'frozen' ? 'Unfreeze' : 'Freeze Membership'}
                            className="p-1.5 rounded-md text-amber-400 hover:bg-amber-950/40 transition-colors cursor-pointer"
                          >
                            <Snowflake className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setMemberToEdit(m);
                              setIsNewMemberModalOpen(true);
                            }}
                            title="Edit Profile"
                            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(m.id, m.fullName)}
                            title="Delete Member"
                            className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Details Modal */}
      <MemberDetailModal
        isOpen={!!selectedDetailMemberId}
        onClose={() => setSelectedDetailMemberId(null)}
        memberId={selectedDetailMemberId}
        gym={gym}
        onOpenRenewal={(mem) => {
          setSelectedDetailMemberId(null);
          setSelectedRenewalMember(mem);
        }}
        onOpenWhatsApp={(mem) => {
          setSelectedDetailMemberId(null);
          setSelectedWhatsAppMember(mem);
        }}
        onOpenEdit={(mem) => {
          setSelectedDetailMemberId(null);
          setMemberToEdit(mem);
          setIsNewMemberModalOpen(true);
        }}
      />

      {/* Member Renewal Modal */}
      <RenewalModal
        isOpen={!!selectedRenewalMember}
        onClose={() => setSelectedRenewalMember(null)}
        member={selectedRenewalMember}
        plans={plans}
        gym={gym}
        onRenewSuccess={loadData}
      />

      {/* WhatsApp Message Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={!!selectedWhatsAppMember}
        onClose={() => setSelectedWhatsAppMember(null)}
        member={selectedWhatsAppMember}
        gym={gym}
      />

      {/* New / Edit Member Modal */}
      <NewMemberModal
        isOpen={isNewMemberModalOpen}
        onClose={() => setIsNewMemberModalOpen(false)}
        plans={plans}
        onMemberCreated={loadData}
        memberToEdit={memberToEdit}
      />
    </div>
  );
};
