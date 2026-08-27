import React, { useState } from 'react';
import { api } from '../../services/api';
import { Dumbbell, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

interface ForgotPasswordViewProps {
  onNavigateLogin?: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onNavigateLogin: propOnNavigateLogin }) => {
  const navigate = useNavigate();
  const onNavigateLogin = () => {
    if (propOnNavigateLogin) propOnNavigateLogin();
    else navigate('/login');
  };
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await api.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white font-sans">
            Reset Your Password
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-sans">
            Enter your registered email address to receive reset instructions.
          </p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 sm:p-8 shadow-2xl">
          {isSubmitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white font-sans">Reset Link Dispatched</h3>
              <p className="text-xs text-gray-400 font-sans">
                We've dispatched a password reset link to <strong className="text-white">{email}</strong>.
              </p>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full mt-4 py-2 px-4 rounded-md bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1.5 font-sans">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@gymflow.io"
                    className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all cursor-pointer disabled:opacity-50 font-sans"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white pt-2 cursor-pointer transition-colors font-sans"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
