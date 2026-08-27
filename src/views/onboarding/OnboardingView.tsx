import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Dumbbell,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

import { useNavigate } from 'react-router-dom';

interface OnboardingViewProps {
  onComplete?: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete: propOnComplete }) => {
  const navigate = useNavigate();
  const onComplete = () => {
    if (propOnComplete) propOnComplete();
    else navigate('/dashboard');
  };
  const { gym, user, updateGymState } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [gymName, setGymName] = useState(gym?.name || 'IronPulse Fitness Club');
  const [ownerName, setOwnerName] = useState(gym?.ownerName || user?.name || 'Marcus Vance');
  const [phone, setPhone] = useState(gym?.phone || '+1 (555) 234-5678');
  const [email, setEmail] = useState(gym?.email || user?.email || 'contact@ironpulsefitness.com');
  const [address, setAddress] = useState(gym?.address || '742 Evergreen Terrace, Suite 400');
  const [city, setCity] = useState(gym?.city || 'Austin');
  const [state, setState] = useState(gym?.state || 'Texas');
  const [country, setCountry] = useState(gym?.country || 'United States');
  const [currency, setCurrency] = useState(gym?.currency || 'USD');
  const [taxRate, setTaxRate] = useState(gym?.taxRate?.toString() || '8.25');
  const [logo, setLogo] = useState(
    gym?.logo || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=80'
  );

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    setIsLoading(true);
    try {
      const res = await api.completeOnboarding({
        gymName,
        ownerName,
        phone,
        email,
        address,
        city,
        state,
        country,
        logo,
        currency,
        taxRate: Number(taxRate) || 0,
      });

      if (res.gym) {
        updateGymState(res.gym);
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25 mb-3">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Set Up Your Gym Profile
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Step {step} of 3 • Let's configure your branding and billing details
          </p>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-center gap-2 mt-4 max-w-xs mx-auto">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-blue-500' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-400 mb-2">
                  <Building className="w-4 h-4" />
                  <span>Basic Gym & Owner Information</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">
                    Gym Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    placeholder="e.g. IronPulse Fitness Club"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Marcus Vance"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">
                    Contact Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@ironpulsefitness.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>Physical Address & Location</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="742 Evergreen Terrace, Suite 400"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Austin"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Texas"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="United States"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-400 mb-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Branding & Currency</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">
                    Gym Logo URL (or sample preset)
                  </label>
                  <input
                    type="url"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                  {logo && (
                    <div className="mt-2 flex items-center gap-3 p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                      <img
                        src={logo}
                        alt="Logo preview"
                        className="w-10 h-10 rounded-lg object-cover border border-zinc-700"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs text-zinc-400">Logo preview</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      Currency Symbol
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-blue-500 font-sans"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="8.25"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-800 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                ← Back
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {step === 3 ? (
                isLoading ? 'Launching GymFlow...' : 'Complete Setup & Launch'
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
