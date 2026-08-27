import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MembershipPlan } from '../../types';
import { formatCurrency } from '../../lib/utils';
import {
  CreditCard,
  Plus,
  Check,
  Edit,
  Trash2,
  Users,
  Sparkles,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { PlanModal } from './PlanModal';
import { EmptyState } from '../../components/common/EmptyState';

export const PlansView: React.FC = () => {
  const { gym } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlanToEdit, setSelectedPlanToEdit] = useState<MembershipPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPlans();
      setPlans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleDeletePlan = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${name}"?`)) return;
    try {
      await api.deletePlan(id);
      loadPlans();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Membership Plans & Pricing
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Configure subscription tiers, duration cycles, and included gym perks
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedPlanToEdit(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 bg-[#141414] border border-[#262626] rounded-xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          title="No Membership Plans"
          description="Create your first membership plan (e.g. Monthly Standard, Annual VIP) to start enrolling members."
          actionLabel="Create Plan"
          onAction={() => {
            setSelectedPlanToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, index) => {
            const isFeatured = index === 1; // Highlight second plan as most popular
            return (
              <div
                key={plan.id}
                className={`rounded-xl p-5 sm:p-6 bg-[#141414] border transition-all flex flex-col justify-between relative shadow-sm hover:border-gray-600 ${
                  isFeatured
                    ? 'border-indigo-500/60 ring-1 ring-indigo-500/40'
                    : 'border-[#262626]'
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-[10px] font-mono text-white uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                )}

                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-medium text-white">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 font-sans">
                        {plan.durationMonths} Month{plan.durationMonths > 1 ? 's' : ''} duration
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        plan.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-[#1a1a1a] text-gray-500 border border-[#262626]'
                      }`}
                    >
                      {plan.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-4 pb-4 border-b border-[#262626]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-semibold text-white font-mono tracking-tight">
                        {formatCurrency(plan.price, gym?.currency || '$')}
                      </span>
                      <span className="text-xs text-gray-500 font-sans">
                        / {plan.durationMonths === 1 ? 'month' : `${plan.durationMonths} mos`}
                      </span>
                    </div>
                    {plan.durationMonths > 1 && (
                      <p className="text-[11px] text-gray-500 mt-1 font-mono">
                        ~{formatCurrency(Math.round(plan.price / plan.durationMonths), gym?.currency || '$')}/mo effective
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className="text-xs text-gray-400 mt-3 italic">
                      "{plan.description}"
                    </p>
                  )}

                  {/* Features List */}
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                      Included Amenities:
                    </p>
                    {plan.features?.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-6 pt-4 border-t border-[#262626] flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-mono">
                    ID: <strong className="text-gray-400">{plan.id.slice(0, 7)}</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanToEdit(plan);
                        setIsModalOpen(true);
                      }}
                      title="Edit Plan"
                      className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id, plan.name)}
                      title="Delete Plan"
                      className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Modal */}
      <PlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planToEdit={selectedPlanToEdit}
        onSaved={loadPlans}
      />
    </div>
  );
};
