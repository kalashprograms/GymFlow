import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  UserCheck,
  Check,
  Calendar,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { NavView } from './Sidebar';
import { formatDate } from '../../lib/utils';
import { Member } from '../../types';
import { api } from '../../services/api';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onNavigate: (view: NavView) => void;
  onOpenNewMemberModal: () => void;
  onOpenQuickCheckInModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onNavigate,
  onOpenNewMemberModal,
  onOpenQuickCheckInModal,
}) => {
  const { gym } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    triggerScan,
    systemDate,
    setSystemDate,
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDateSwitcherOpen, setIsDateSwitcherOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    setIsSearchOpen(true);
    try {
      setIsSearching(true);
      const data = await api.getMembers({ search: val.trim() });
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualScan = async () => {
    setIsScanning(true);
    try {
      await triggerScan();
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0d0d0d] border-b border-[#262626] px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative w-full">
          <div className="flex items-center gap-3 bg-[#1a1a1a] px-3.5 py-2 rounded-full border border-[#262626] focus-within:border-indigo-500/60 transition-colors">
            <Search className="w-4 h-4 text-gray-500 opacity-60 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
              placeholder="Search members, IDs, or plans..."
              className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 w-full font-sans"
            />
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-[#141414] border border-[#262626] rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto">
              <p className="px-2 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-mono">
                {searchResults.length} Members Found
              </p>
              {searchResults.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-gray-500">
                  No member records found matching "{searchQuery}".
                </p>
              ) : (
                searchResults.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      onNavigate('members');
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                        alt={m.fullName}
                        className="w-7 h-7 rounded-full object-cover border border-[#262626]"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-white">
                            {m.fullName}
                          </span>
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#262626] text-gray-400">
                            {m.memberCode}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {m.planName} • {m.phoneNumber}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        m.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : m.status === 'expired'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-3">
        {/* Express Check In button */}
        <button
          type="button"
          onClick={onOpenQuickCheckInModal}
          className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-[#1a1a1a] hover:bg-[#262626] text-gray-300 border border-[#262626] transition-colors cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Check-In</span>
        </button>

        {/* New Member button */}
        <button
          type="button"
          onClick={onOpenNewMemberModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Member</span>
        </button>

        {/* System Date Pill / Simulation Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDateSwitcherOpen(!isDateSwitcherOpen)}
            title="System Reference Date (Simulate Expiries)"
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-md text-[11px] font-medium bg-[#1a1a1a] text-gray-400 border border-[#262626] hover:text-white transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono">{formatDate(systemDate)}</span>
          </button>

          {isDateSwitcherOpen && (
            <div className="absolute right-0 mt-2 p-4 bg-[#141414] border border-[#262626] rounded-xl shadow-2xl z-50 w-64 text-xs">
              <p className="font-semibold text-white mb-1">
                Simulate Expiry Date
              </p>
              <p className="text-[11px] text-gray-500 mb-2.5">
                Change system reference date to test automatic notifications & expiry logic.
              </p>
              <input
                type="date"
                value={systemDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSystemDate(e.target.value);
                    setIsDateSwitcherOpen(false);
                  }
                }}
                className="w-full p-2 rounded-md border border-[#262626] bg-[#0a0a0a] text-white text-xs mb-2 font-mono outline-none focus:border-indigo-500"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSystemDate('2026-08-27');
                    setIsDateSwitcherOpen(false);
                  }}
                  className="flex-1 py-1.5 rounded-md bg-[#1a1a1a] hover:bg-[#262626] text-[10px] font-medium text-gray-300 transition-colors"
                >
                  Reset to Current
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-400" />}
        </button>

        {/* Notification Bell Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[#0d0d0d] rounded-full" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#141414] border border-[#262626] rounded-xl shadow-2xl z-50 overflow-hidden font-sans">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-widest font-mono">
                    Expiry Alerts
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualScan}
                    disabled={isScanning}
                    title="Run background reminder scan"
                    className="p-1 rounded text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[11px] font-medium text-indigo-400 hover:underline cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Items */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#262626]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No active notifications. All memberships are up to date!
                  </div>
                ) : (
                  notifications.slice(0, 7).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        setIsNotifOpen(false);
                        onNavigate('members');
                      }}
                      className={`p-3.5 flex items-start gap-3 hover:bg-[#1a1a1a] cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !n.isRead
                            ? n.priority === 'high'
                              ? 'bg-red-500'
                              : 'bg-amber-500'
                            : 'bg-gray-700'
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-1 font-mono">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-[#0d0d0d] border-t border-[#262626] text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    onNavigate('notifications');
                  }}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  View All Notifications & Expiry Log →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
