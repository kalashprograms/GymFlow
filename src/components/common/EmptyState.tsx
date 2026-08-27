import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  action,
}) => {
  const finalLabel = actionLabel || action?.label;
  const finalOnClick = onAction || action?.onClick;
  const ActionIcon = action?.icon;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#262626] rounded-xl bg-[#0d0d0d] my-4 font-sans">
      <div className="w-12 h-12 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center text-gray-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-white font-sans">
        {title}
      </h4>
      <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6 font-sans">
        {description}
      </p>
      {finalLabel && finalOnClick && (
        <button
          type="button"
          onClick={finalOnClick}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors cursor-pointer"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {finalLabel}
        </button>
      )}
    </div>
  );
};
