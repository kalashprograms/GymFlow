import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, NavView } from './Sidebar';
import { Header } from './Header';
import { QuickCheckInModal } from '../common/QuickCheckInModal';
import { NewMemberModal } from '../../views/members/NewMemberModal';
import { api } from '../../services/api';
import { MembershipPlan } from '../../types';

interface AppLayoutProps {
  currentView?: NavView;
  onNavigate?: (view: NavView) => void;
  onOpenNewMemberModal?: () => void;
  onCheckInSuccess?: () => void;
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView: propCurrentView,
  onNavigate: propOnNavigate,
  onOpenNewMemberModal: propOnOpenNewMemberModal,
  onCheckInSuccess,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickCheckInOpen, setIsQuickCheckInOpen] = useState(false);
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  useEffect(() => {
    api.getPlans().then(setPlans).catch(console.error);
  }, []);

  // Compute current active view from location path
  const path = location.pathname.replace('/', '') || 'dashboard';
  const activeView = (propCurrentView || path) as NavView;

  const handleNavigate = (view: NavView) => {
    if (propOnNavigate) {
      propOnNavigate(view);
    } else {
      navigate(`/${view}`);
    }
  };

  const handleOpenNewMember = () => {
    if (propOnOpenNewMemberModal) {
      propOnOpenNewMemberModal();
    } else {
      setIsNewMemberModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans flex transition-colors">
      {/* Sidebar */}
      <Sidebar
        currentView={activeView}
        onNavigate={handleNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header */}
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onNavigate={handleNavigate}
          onOpenNewMemberModal={handleOpenNewMember}
          onOpenQuickCheckInModal={() => setIsQuickCheckInOpen(true)}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Quick Express Check In Global Modal */}
      <QuickCheckInModal
        isOpen={isQuickCheckInOpen}
        onClose={() => setIsQuickCheckInOpen(false)}
        onCheckInSuccess={onCheckInSuccess}
      />

      {/* New Member Global Modal */}
      <NewMemberModal
        isOpen={isNewMemberModalOpen}
        onClose={() => setIsNewMemberModalOpen(false)}
        plans={plans}
        onMemberCreated={() => {
          // If on members or dashboard, window or state will react
          if (location.pathname === '/members' || location.pathname === '/dashboard') {
            window.location.reload();
          }
        }}
      />
    </div>
  );
};
