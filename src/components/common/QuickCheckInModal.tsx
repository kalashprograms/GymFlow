import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../../services/api';
import { Member, AttendanceRecord } from '../../types';
import { CheckCircle2, QrCode, Search, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckInSuccess?: () => void;
}

export const QuickCheckInModal: React.FC<QuickCheckInModalProps> = ({
  isOpen,
  onClose,
  onCheckInSuccess,
}) => {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    member?: Member;
    record?: AttendanceRecord;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedMember(null);
      setCheckInResult(null);
      loadRecentMembers();
    }
  }, [isOpen]);

  const loadRecentMembers = async () => {
    try {
      setIsSearching(true);
      const data = await api.getMembers({ status: 'active' });
      setMembers(data.slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (val: string) => {
    setQuery(val);
    setCheckInResult(null);
    if (!val.trim()) {
      loadRecentMembers();
      return;
    }
    try {
      setIsSearching(true);
      const data = await api.getMembers({ search: val.trim() });
      setMembers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const executeCheckIn = async (member: Member) => {
    try {
      const res = await api.markAttendance({
        memberId: member.id,
        memberCode: member.memberCode,
        method: 'code',
        notes: 'Quick desk check-in',
      });

      setCheckInResult({
        success: true,
        member: res.member || member,
        record: res.record,
        message: `Welcome, ${member.fullName}! Check-in recorded at ${res.record.checkInTime}.`,
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });

      onCheckInSuccess?.();
    } catch (err: any) {
      setCheckInResult({
        success: false,
        message: err.message || 'Failed to record attendance',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Member Express Check-In"
      subtitle="Punch in member code (e.g. GF-1001) or search member name"
      maxWidth="md"
    >
      <div className="space-y-4 font-sans">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type GF-1001, phone, or name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        {/* Success / Error Feedback Banner */}
        {checkInResult && (
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-3 transition-all ${
              checkInResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {checkInResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-medium">{checkInResult.message}</p>
              {checkInResult.member && (
                <p className="text-[11px] font-mono opacity-80 mt-0.5">
                  Plan: {checkInResult.member.planName} | Code: {checkInResult.member.memberCode}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Member matching list */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <p className="text-[11px] font-mono text-gray-500 uppercase tracking-wider px-1">
            {query.trim() ? 'Matching Members' : 'Active Members'}
          </p>

          {members.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500 font-mono">
              No matching members found for "{query}".
            </div>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                onClick={() => executeCheckIn(m)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#262626] bg-[#141414] hover:bg-[#1a1a1a] hover:border-indigo-500/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={m.fullName}
                    className="w-9 h-9 rounded-full object-cover border border-[#262626]"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-white group-hover:text-indigo-400 transition-colors">
                        {m.fullName}
                      </p>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#262626] text-gray-400">
                        {m.memberCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {m.planName} • {m.phoneNumber}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    executeCheckIn(m);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#1a1a1a] border border-[#262626] text-gray-300 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-colors cursor-pointer"
                >
                  Check In
                </button>
              </div>
            ))
          )}
        </div>

        {/* QR Scan Simulator hint */}
        <div className="p-3 rounded-lg bg-[#0d0d0d] border border-[#262626] text-xs flex items-center justify-between text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>QR Scanner Mode Active</span>
          </div>
          <span className="text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">Ready</span>
        </div>
      </div>
    </Modal>
  );
};
