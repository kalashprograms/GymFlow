import React, { useState } from 'react';
import { Modal } from './Modal';
import { Member, Gym } from '../../types';
import { formatDate, getDaysRemaining } from '../../lib/utils';
import { MessageSquare, Copy, ExternalLink, Check, Sparkles } from 'lucide-react';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  gym: Gym | null;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  member,
  gym,
}) => {
  if (!member) return null;

  const daysLeft = getDaysRemaining(member.membershipExpiryDate);
  const gymName = gym?.name || 'IronPulse Fitness';

  // Template options
  const templates = [
    {
      id: 'today',
      title: 'Expires Today',
      text: `Hi ${member.fullName}! 🏋️‍♂️ Your ${member.planName || 'Gym'} membership at ${gymName} expires TODAY (${formatDate(member.membershipExpiryDate)}). Renew today at the front desk or via UPI to keep your streak uninterrupted!`,
    },
    {
      id: 'tomorrow',
      title: 'Expires Tomorrow',
      text: `Hey ${member.fullName}! Friendly reminder that your ${member.planName || 'Gym'} membership at ${gymName} expires tomorrow on ${formatDate(member.membershipExpiryDate)}. Stop by the front desk to renew seamlessly!`,
    },
    {
      id: '3days',
      title: '3 Days Remaining',
      text: `Hello ${member.fullName}! Your gym membership at ${gymName} will expire in 3 days (${formatDate(member.membershipExpiryDate)}). Early renewal comes with 1 free guest pass!`,
    },
    {
      id: '7days',
      title: '7 Days Remaining',
      text: `Hi ${member.fullName}! Just a quick heads up: your membership at ${gymName} is valid until ${formatDate(member.membershipExpiryDate)}. We love having you workout with us!`,
    },
    {
      id: 'expired_offer',
      title: 'Win-Back Discount (10% Off)',
      text: `Hey ${member.fullName}! We miss you at ${gymName}! 💪 As a loyal member, renew this week and get an instant 10% discount on any Quarterly or Half-Yearly plan. Let's get back to those gains!`,
    },
  ];

  const defaultTemplateIndex = daysLeft === 0 ? 0 : daysLeft === 1 ? 1 : daysLeft > 1 && daysLeft <= 3 ? 2 : daysLeft <= 7 && daysLeft > 3 ? 3 : 4;
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(defaultTemplateIndex);
  const [customMessage, setCustomMessage] = useState(templates[defaultTemplateIndex]?.text || '');
  const [copied, setCopied] = useState(false);

  const handleSelectTemplate = (idx: number) => {
    setSelectedTemplateIndex(idx);
    setCustomMessage(templates[idx].text);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    // Sanitize phone number (strip spaces, dashes, brackets)
    const cleanPhone = (member.whatsAppNumber || member.phoneNumber || '').replace(/[^\d+]/g, '').replace('+', '');
    const encoded = encodeURIComponent(customMessage);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Expiry Reminder"
      subtitle={`Recipient: ${member.fullName} (${member.whatsAppNumber || member.phoneNumber})`}
      maxWidth="lg"
    >
      <div className="space-y-4 font-sans">
        {/* Template Selector Chips */}
        <div>
          <label className="text-xs font-mono text-gray-500 block mb-2 uppercase tracking-wider">
            SELECT MESSAGE TEMPLATE
          </label>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((tpl, i) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(i)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors cursor-pointer font-sans ${
                  selectedTemplateIndex === i
                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                    : 'bg-[#141414] border-[#262626] text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* Message Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">
              MESSAGE PREVIEW
            </label>
            <span className="text-[11px] font-mono text-gray-500">
              {customMessage.length} characters
            </span>
          </div>
          <textarea
            rows={5}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full text-xs sm:text-sm p-3.5 rounded-md border border-[#262626] bg-[#1a1a1a] text-white focus:outline-none focus:border-indigo-500 font-sans resize-none"
          />
        </div>

        {/* Member Status Pill Banner */}
        <div className="p-3 bg-[#0d0d0d] border border-[#262626] rounded-md flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-2 text-gray-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Plan: <strong className="text-white font-medium">{member.planName}</strong></span>
          </div>
          <span className="text-gray-400 font-mono">
            Expiry Date: <strong className="text-white font-medium">{formatDate(member.membershipExpiryDate)}</strong>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md border border-[#262626] bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard' : 'Copy Message'}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            Open WhatsApp Web
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
