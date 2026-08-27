import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, Lock, Mail, User, Building, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

interface RegisterViewProps {
  onNavigateLogin?: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigateLogin: propOnNavigateLogin }) => {
  const navigate = useNavigate();
  const onNavigateLogin = () => {
    if (propOnNavigateLogin) propOnNavigateLogin();
    else navigate('/login');
  };
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [gymName, setGymName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await register(name, email, password, gymName);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
            Start with GymFlow
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 font-sans">
            Automate membership renewals and grow your fitness business.
          </p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1 font-sans">
                Owner Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Marcus Vance"
                  className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1 font-sans">
                Gym / Studio Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  placeholder="IronPulse Fitness Club"
                  className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1 font-sans">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marcus@ironpulsefitness.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1 font-sans">
                Create Secure Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50 font-sans"
            >
              {isLoading ? (
                'Creating Account...'
              ) : (
                <>
                  <span>Create GymFlow Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6 font-sans">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
};
