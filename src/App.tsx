import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Auth Views
import { LoginView } from './views/auth/LoginView';
import { RegisterView } from './views/auth/RegisterView';
import { ForgotPasswordView } from './views/auth/ForgotPasswordView';

// Onboarding
import { OnboardingView } from './views/onboarding/OnboardingView';

// Main Views
import { DashboardView } from './views/dashboard/DashboardView';
import { MembersView } from './views/members/MembersView';
import { PlansView } from './views/plans/PlansView';
import { AttendanceView } from './views/attendance/AttendanceView';
import { PaymentsView } from './views/payments/PaymentsView';
import { ExpiryCalendarView } from './views/calendar/ExpiryCalendarView';
import { NotificationsView } from './views/notifications/NotificationsView';
import { ReportsView } from './views/reports/ReportsView';
import { AIAssistantView } from './views/ai/AIAssistantView';
import { SettingsView } from './views/settings/SettingsView';
import { ProfileView } from './views/profile/ProfileView';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, gym } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span>Starting GymFlow SaaS Engine...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (gym && gym.onboardingCompleted === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { isAuthenticated, gym } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={gym?.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />
          ) : (
            <LoginView />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to={gym?.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />
          ) : (
            <RegisterView />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordView />} />

      {/* Onboarding Wizard */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingView />
          </ProtectedRoute>
        }
      />

      {/* Main SaaS App Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="members" element={<MembersView />} />
        <Route path="plans" element={<PlansView />} />
        <Route path="attendance" element={<AttendanceView />} />
        <Route path="payments" element={<PaymentsView />} />
        <Route path="calendar" element={<ExpiryCalendarView />} />
        <Route path="notifications" element={<NotificationsView />} />
        <Route path="reports" element={<ReportsView />} />
        <Route path="ai" element={<AIAssistantView />} />
        <Route path="settings" element={<SettingsView />} />
        <Route path="profile" element={<ProfileView />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
