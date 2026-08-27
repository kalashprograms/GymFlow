import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';
import { MembershipPlan } from '../../types';
import { CreditCard, DollarSign, Clock, Check, Sparkles, Plus, Trash2 } from 'lucide-react';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: MembershipPlan | null;
  onSaved: () => void;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  planToEdit,
  onSaved,
}) => {
  const isEditing = !!planToEdit;

  const [name, setName] = useState('');
  const [durationMonths, setDurationMonths] = useState('1');
  const [durationDays, setDurationDays] = useState('0');
  const [price, setPrice] = useState('65');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'Full Gym Floor Access',
    'Locker Room & Showers',
    'Free Wi-Fi',
  ]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (planToEdit) {
      setName(planToEdit.name);
      setDurationMonths(planToEdit.durationMonths.toString());
      setDurationDays((planToEdit.durationDays || 0).toString());
      setPrice(planToEdit.price.toString());
      setDescription(planToEdit.description || '');
      setFeatures(planToEdit.features || []);
      setIsActive(planToEdit.isActive);
    } else {
      setName('');
      setDurationMonths('1');
      setDurationDays('0');
      setPrice('65');
      setDescription('');
      setFeatures(['Full Gym Floor Access', 'Locker Room & Showers', 'Free Wi-Fi']);
      setIsActive(true);
    }
  }, [isOpen, planToEdit]);

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([...features, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a plan name');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (isEditing && planToEdit) {
        await api.updatePlan(planToEdit.id, {
          name,
          durationMonths: Number(durationMonths) || 1,
          durationDays: Number(durationDays) || 0,
          price: Number(price) || 0,
          description,
          features,
          isActive,
        });
      } else {
        await api.createPlan({
          name,
          durationMonths: Number(durationMonths) || 1,
          durationDays: Number(durationDays) || 0,
          price: Number(price) || 0,
          description,
          features,
          isActive,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save membership plan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Membership Plan' : 'Create Membership Plan'}
      subtitle="Define pricing, duration, and included perks"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
            Plan Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quarterly Pro, Annual VIP"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm font-sans"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Duration (Months) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm font-sans"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Price ($) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="165"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm font-sans font-bold"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Best for consistent gym-goers who want full studio perks..."
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs sm:text-sm resize-none"
          />
        </div>

        {/* Plan Features Checklist */}
        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
            Included Amenities & Perks
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newFeatureText}
              onChange={(e) => setNewFeatureText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFeature();
                }
              }}
              placeholder="Add perk (e.g. Steam & Sauna, 2 PT sessions)..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs"
            />
            <button
              type="button"
              onClick={handleAddFeature}
              className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer"
            >
              Add
            </button>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {features.map((feat, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-zinc-800 dark:text-zinc-200">{feat}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(i)}
                  className="text-zinc-400 hover:text-rose-500 p-0.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="planIsActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded-md border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="planIsActive" className="text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
            Plan is active and available for new member signups
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
