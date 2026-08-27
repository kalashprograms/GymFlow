// src/lib/utils.ts
export function calculateExpiryDate(startDateStr: string, durationMonths: number, durationDays?: number): string {
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  
  if (durationMonths && durationMonths > 0) {
    const originalDay = date.getDate();
    date.setMonth(date.getMonth() + durationMonths);
    // Handle month-end rollover (e.g. Feb 30 -> Mar 2)
    if (date.getDate() !== originalDay) {
      date.setDate(0);
    }
  }

  if (durationDays && durationDays > 0) {
    date.setDate(date.getDate() + durationDays);
  }

  return date.toISOString().split('T')[0];
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number, currency = '$'): string {
  return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDaysRemaining(expiryDateStr: string, referenceDateStr = '2026-08-27'): number {
  const expiry = new Date(expiryDateStr);
  const ref = new Date(referenceDateStr);
  expiry.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - ref.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(expiryDateStr: string, referenceDateStr = '2026-08-27'): {
  label: string;
  badgeClass: string;
  days: number;
} {
  const days = getDaysRemaining(expiryDateStr, referenceDateStr);

  if (days < 0) {
    return {
      label: `Expired ${Math.abs(days)}d ago`,
      badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400',
      days,
    };
  }
  if (days === 0) {
    return {
      label: 'Expires Today',
      badgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 font-semibold animate-pulse',
      days,
    };
  }
  if (days === 1) {
    return {
      label: 'Expires Tomorrow',
      badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 font-medium',
      days,
    };
  }
  if (days <= 7) {
    return {
      label: `${days} days left`,
      badgeClass: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400',
      days,
    };
  }
  return {
    label: `${days} days left`,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400',
    days,
  };
}
