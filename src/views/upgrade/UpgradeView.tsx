import React, { useState } from 'react';
import { Check, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import { cn } from '../../lib/utils';

export const UpgradeView: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const tiers = [
    {
      name: 'Bronze',
      icon: Shield,
      desc: 'Perfect for small or new gyms just getting started.',
      monthlyPrice: 29,
      yearlyPrice: 24,
      features: [
        'Up to 100 Members',
        'Basic Member Management',
        'Manual Expiry Tracking',
        'Standard Email Support',
      ],
      color: 'text-amber-600',
      bgColor: 'bg-amber-600/10',
      borderColor: 'border-amber-600/20',
      buttonClass: 'bg-[#262626] hover:bg-[#333] text-white',
    },
    {
      name: 'Silver',
      icon: Zap,
      desc: 'Ideal for growing fitness centers needing more automation.',
      monthlyPrice: 49,
      yearlyPrice: 39,
      features: [
        'Up to 300 Members',
        'Attendance Tracking',
        'Basic AI Copilot Prompts',
        'Payment History Logs',
        'Priority Email Support',
      ],
      color: 'text-gray-300',
      bgColor: 'bg-gray-400/10',
      borderColor: 'border-gray-400/20',
      buttonClass: 'bg-[#262626] hover:bg-[#333] text-white',
    },
    {
      name: 'Gold',
      icon: Sparkles,
      desc: 'Everything a professional gym needs to scale and automate.',
      monthlyPrice: 99,
      yearlyPrice: 79,
      isPopular: true,
      features: [
        'Unlimited Members',
        'Full AI Retention Copilot',
        'Automated WhatsApp Reminders',
        'Advanced Revenue Analytics',
        '24/7 Priority Support',
      ],
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/50',
      buttonClass: 'bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold',
    },
    {
      name: 'Platinum',
      icon: Crown,
      desc: 'White-glove solution for franchises and premium clubs.',
      monthlyPrice: 199,
      yearlyPrice: 159,
      features: [
        'Unlimited Everything',
        'White-label Branding (No GymFlow Logo)',
        'Custom Feature Requests',
        'Dedicated Account Manager',
        'API Access & Integrations',
      ],
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Upgrade to Premium
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          Scale your gym management with powerful automation, advanced AI retention insights, and unlimited member tracking. Choose the plan that fits your growth.
        </p>

        {/* Billing Toggle */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex bg-[#141414] border border-[#262626] rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-4 py-1.5 text-xs font-medium rounded-full transition-all',
                billingCycle === 'monthly'
                  ? 'bg-[#262626] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'px-4 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1',
                billingCycle === 'yearly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Yearly billing
              <span
                className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1',
                  billingCycle === 'yearly'
                    ? 'bg-indigo-400/20 text-indigo-100'
                    : 'bg-indigo-500/20 text-indigo-400'
                )}
              >
                SAVE 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
          const Icon = tier.icon;
          return (
            <div
              key={tier.name}
              className={cn(
                'relative flex flex-col p-6 rounded-2xl border bg-[#141414] transition-all duration-200 hover:border-gray-500/30',
                tier.isPopular ? tier.borderColor : 'border-[#262626]'
              )}
            >
              {tier.isPopular && (
                <div className="absolute -top-3 left-0 right-0 mx-auto w-max px-3 py-1 rounded-full bg-yellow-500 text-yellow-950 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  Most Popular
                </div>
              )}

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className={cn('text-lg font-bold', tier.color)}>{tier.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 h-8">{tier.desc}</p>
                </div>
                <div className={cn('p-2.5 rounded-xl shrink-0', tier.bgColor)}>
                  <Icon className={cn('w-5 h-5', tier.color)} />
                </div>
              </div>

              <div className="mb-6 flex items-baseline text-white">
                <span className="text-4xl font-bold tracking-tight">${price}</span>
                <span className="text-sm text-gray-500 ml-1 font-medium">/mo</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-400">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex gap-3">
                    <Check className={cn('w-4 h-4 shrink-0', tier.color)} />
                    <span className="leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={cn(
                  'w-full py-2.5 rounded-lg text-sm transition-all',
                  tier.buttonClass
                )}
              >
                Get Started with {tier.name}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
