import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserCheck,
  FileSpreadsheet,
  Bell,
  Settings,
  User,
  Sparkles,
  Dumbbell,
  CalendarCheck2,
  ChevronRight,
  LogOut,
  Flame,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export type NavView =
  | 'dashboard'
  | 'members'
  | 'plans'
  | 'attendance'
  | 'payments'
  | 'reports'
  | 'notifications'
  | 'calendar'
  | 'ai'
  | 'upgrade'
  | 'settings'
  | 'profile';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { gym, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members' as NavView, label: 'Members', icon: Users },
    { id: 'plans' as NavView, label: 'Membership Plans', icon: CreditCard },
    { id: 'attendance' as NavView, label: 'Attendance', icon: UserCheck },
    { id: 'payments' as NavView, label: 'Payments & Billing', icon: Flame },
    { id: 'reports' as NavView, label: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'upgrade' as NavView, label: 'Upgrade to PRO', icon: Zap, highlight: true },
    {
      id: 'notifications' as NavView,
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'calendar' as NavView, label: 'Expiry Calendar', icon: CalendarCheck2 },
    { id: 'ai' as NavView, label: 'AI Copilot', icon: Sparkles, highlight: true },
  ];

  const bottomNavItems = [
    { id: 'settings' as NavView, label: 'Settings', icon: Settings },
    { id: 'profile' as NavView, label: 'Gym Profile', icon: User },
  ];

  const handleNavClick = (view: NavView) => {
    onNavigate(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-[#0d0d0d] border-r border-[#262626] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#262626]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-white">
                    GymFlow
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700/40 font-mono font-medium">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">
                  {gym?.name || 'IronPulse Fitness'}
                </p>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1">
            <p className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 font-mono">
              Navigation
            </p>

            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group cursor-pointer',
                    isActive
                      ? 'bg-[#1a1a1a] text-white font-semibold shadow-xs'
                      : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white',
                    item.highlight && !isActive && 'text-indigo-400'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive
                          ? 'text-white opacity-90'
                          : item.highlight
                          ? 'text-indigo-400'
                          : 'opacity-50 group-hover:opacity-100 group-hover:text-white'
                      )}
                    />
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.2 rounded-full',
                        item.badgeColor || 'bg-red-500 text-white'
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : item.highlight ? (
                    <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-800/40 px-1.5 py-0.2 rounded uppercase">
                      {item.id === 'upgrade' ? 'PRO' : 'AI'}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Nav & Gym Info */}
        <div className="p-4 space-y-2 border-t border-[#262626]">
          <p className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-mono">
            System
          </p>

          {bottomNavItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-[#1a1a1a] text-white font-semibold'
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                )}
              >
                <Icon className="w-4 h-4 opacity-50" />
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}

          {/* User Profile Mini Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-indigo-900 text-indigo-200 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-700/50">
                  {user?.name?.[0] || 'MS'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium text-white truncate">
                    {user?.name || 'Mike Sullivan'}
                  </p>
                  <p className="text-[10px] text-gray-500 capitalize italic">
                    {user?.role?.replace('_', ' ') || 'Gym Owner'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
