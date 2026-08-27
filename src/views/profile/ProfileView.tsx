import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ProfileView: React.FC = () => {
  const { gym, updateGymState, user } = useAuth();

  const [name, setName] = useState(gym?.name || 'IronPulse Fitness Club');
  const [ownerName, setOwnerName] = useState(gym?.ownerName || user?.name || 'Marcus Vance');
  const [phone, setPhone] = useState(gym?.phone || '+1 (555) 234-5678');
  const [email, setEmail] = useState(gym?.email || 'contact@ironpulsefitness.com');
  const [address, setAddress] = useState(gym?.address || '742 Evergreen Terrace, Suite 400');
  const [city, setCity] = useState(gym?.city || 'Austin');
  const [state, setState] = useState(gym?.state || 'Texas');
  const [country, setCountry] = useState(gym?.country || 'United States');
  const [logo, setLogo] = useState(
    gym?.logo || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=80'
  );
  const [openingHours, setOpeningHours] = useState('05:30 AM - 11:00 PM (Daily)');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.updateProfile({
        name,
        ownerName,
        phone,
        email,
        address,
        city,
        state,
        country,
        logo,
      });

      if (res.gym) {
        updateGymState(res.gym);
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);

      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
          Gym Profile & Public Branding
        </h1>
        <p className="text-xs text-gray-500 mt-0.5 font-sans">
          Manage gym location, contact details, official invoices header, and logo
        </p>
      </div>

      {isSaved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Gym profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 font-sans">
        {/* Branding & Logo Header */}
        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-white">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span>Branding & Logo</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <img
              src={logo}
              alt="Gym Logo"
              className="w-20 h-20 rounded-xl object-cover border border-[#262626] shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-xs font-medium text-gray-300 block">
                Logo Image URL
              </label>
              <input
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-gray-500">
                This logo appears at the top of all customer payment receipts and invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-white">
            <Building className="w-4 h-4 text-indigo-400" />
            <span>Business Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Gym Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Owner / Managing Director *
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Contact Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Official Support Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Location & Address */}
        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-white">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <span>Facility Address</span>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                State / Province
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
