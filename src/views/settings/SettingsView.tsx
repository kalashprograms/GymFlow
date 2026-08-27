import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { formatDate } from '../../lib/utils';
import {
  Settings,
  Calendar,
  Bell,
  MessageSquare,
  DollarSign,
  Shield,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SettingsView: React.FC = () => {
  const { gym, updateGymState } = useAuth();
  const { systemDate, setSystemDate, triggerScan } = useNotifications();

  const [dateInput, setDateInput] = useState(systemDate);
  const [currency, setCurrency] = useState(gym?.currency || 'USD');
  const [taxRate, setTaxRate] = useState(gym?.taxRate?.toString() || '8.25');
  const [enableWhatsAppAutoReminder, setEnableWhatsAppAutoReminder] = useState(true);
  const [reminderDaysNotice, setReminderDaysNotice] = useState('7, 3, 1, 0');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.updateSettings({
        currency,
        taxRate: Number(taxRate) || 0,
        enableWhatsAppAutoReminder,
        reminderDaysNotice,
      });

      if (res.gym) {
        updateGymState(res.gym);
      }

      setSystemDate(dateInput);
      await triggerScan();

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);

      confetti({
        particleCount: 40,
        spread: 60,
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
          System & Business Settings
        </h1>
        <p className="text-xs text-gray-500 mt-0.5 font-sans">
          Configure automated expiry notifications, simulation clock, tax rules, and currency
        </p>
      </div>

      {isSaved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Settings saved successfully! Expiry scheduler re-synchronized.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6 font-sans">
        {/* Section 1: System Date Clock (Simulation Mode) */}
        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-white">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>System Reference Clock & Expiry Simulator</span>
          </div>
          <p className="text-xs text-gray-400">
            GymFlow evaluates membership validity and triggers 7-day, 3-day, 1-day, and same-day notifications based on this date.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Current System Reference Date
              </label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDateInput('2026-08-27')}
                  className="px-3 py-2 rounded-md bg-[#1a1a1a] border border-[#262626] text-gray-300 text-xs font-mono hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
                >
                  Aug 27 (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setDateInput('2026-08-31')}
                  className="px-3 py-2 rounded-md bg-[#1a1a1a] border border-[#262626] text-gray-300 text-xs font-mono hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
                >
                  Aug 31 (End)
                </button>
                <button
                  type="button"
                  onClick={() => setDateInput('2026-09-05')}
                  className="px-3 py-2 rounded-md bg-[#1a1a1a] border border-[#262626] text-gray-300 text-xs font-mono hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
                >
                  Sep 05 (Future)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Automated Notification Rules */}
        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-white">
            <Bell className="w-4 h-4 text-indigo-400" />
            <span>Automated Expiry Trigger Rules</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d0d] border border-[#262626]">
              <div>
                <p className="text-xs font-medium text-white">
                  WhatsApp Reminder Generator
                </p>
                <p className="text-[11px] text-gray-500">
                  Pre-generate customized WhatsApp renewal messages for instant 1-click dispatch
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableWhatsAppAutoReminder}
                onChange={(e) => setEnableWhatsAppAutoReminder(e.target.checked)}
                className="w-4 h-4 rounded border-[#262626] bg-[#1a1a1a] text-indigo-600 focus:ring-0 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Notification Intervals (Days before Expiry)
              </label>
              <input
                type="text"
                value={reminderDaysNotice}
                onChange={(e) => setReminderDaysNotice(e.target.value)}
                placeholder="7, 3, 1, 0"
                className="w-full px-3.5 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-gray-500 mt-1 font-sans">
                Comma separated days: 7 (one week before), 3 (three days before), 1 (tomorrow), 0 (today).
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Financial & Currency */}
        <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-white">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Currency & Sales Tax</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Base Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="CAD">CAD (C$ - Canadian Dollar)</option>
                <option value="AUD">AUD (A$ - Australian Dollar)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="8.25"
                className="w-full px-3.5 py-2 rounded-md border border-[#262626] bg-[#1a1a1a] text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-indigo-500"
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
            <span>{isLoading ? 'Saving Changes...' : 'Save System Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
