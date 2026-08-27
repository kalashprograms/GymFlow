import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

interface LoginViewProps {
  onNavigateRegister?: () => void;
  onNavigateForgotPassword?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onNavigateRegister: propOnNavigateRegister,
  onNavigateForgotPassword: propOnNavigateForgotPassword,
}) => {
  const navigate = useNavigate();
  const onNavigateRegister = () => {
    if (propOnNavigateRegister) propOnNavigateRegister();
    else navigate('/register');
  };
  const onNavigateForgotPassword = () => {
    if (propOnNavigateForgotPassword) propOnNavigateForgotPassword();
    else navigate('/forgot-password');
  };
  const { login } = useAuth();
  const [email, setEmail] = useState('owner@gymflow.io');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('owner@gymflow.io');
    setPassword('password123');
    setIsLoading(true);
    try {
      await login('owner@gymflow.io', 'password123', true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
            Welcome to GymFlow
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 font-sans">
            Never forget a membership renewal again.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1.5 font-sans">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@gymflow.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-300 font-sans">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none font-sans">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#262626] bg-[#1a1a1a] text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember this device</span>
              </label>

              <span className="text-[11px] text-gray-500 font-mono">Role: Gym Owner</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Login Helper */}
          <div className="mt-6 pt-5 border-t border-[#262626]">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2 px-3 rounded-md bg-[#1a1a1a] hover:bg-[#262626] text-xs font-medium text-gray-300 border border-[#262626] flex items-center justify-center gap-2 transition-colors cursor-pointer font-sans"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>1-Click Demo Sign In (Marcus Vance)</span>
            </button>
          </div>
        </div>

        {/* Register footer link */}
        <p className="text-center text-xs text-gray-500 mt-6 font-sans">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={onNavigateRegister}
            className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            Register GymFlow Free
          </button>
        </p>

        {/* Security watermark */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-gray-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-bit Encrypted SaaS Platform</span>
        </div>
      </motion.div>
    </div>
  );
};
