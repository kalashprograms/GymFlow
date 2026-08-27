import { db } from './db';
import { SmartNotification, NotificationType } from '../src/types';

export class ReminderEngine {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private referenceDate = '2026-08-27'; // System reference date

  constructor() {
    // Run initial scan on startup
    setTimeout(() => {
      this.runDailyCheck();
    }, 2000);

    // Schedule check every 6 hours
    this.intervalId = setInterval(() => {
      this.runDailyCheck();
    }, 6 * 60 * 60 * 1000);
  }

  public setReferenceDate(dateStr: string) {
    this.referenceDate = dateStr;
    return this.runDailyCheck();
  }

  public getReferenceDate(): string {
    return this.referenceDate;
  }

  public runDailyCheck(): { generatedCount: number; updatedExpiredCount: number; scannedMembers: number } {
    if (this.isRunning) {
      return { generatedCount: 0, updatedExpiredCount: 0, scannedMembers: 0 };
    }

    this.isRunning = true;
    let generatedCount = 0;
    let updatedExpiredCount = 0;
    let scannedMembers = 0;

    try {
      const today = new Date(this.referenceDate);
      today.setHours(0, 0, 0, 0);

      // Default gym id
      const gymId = 'gym_ironpulse_01';
      const members = db.getMembers(gymId);
      const existingNotifs = db.getNotifications(gymId);
      const settings = db.getSettings(gymId);

      scannedMembers = members.length;

      members.forEach(member => {
        if (member.status === 'deleted' || member.status === 'frozen') {
          return;
        }

        const expiry = new Date(member.membershipExpiryDate);
        expiry.setHours(0, 0, 0, 0);

        // Difference in full days (positive = future, negative = past)
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // 1. Auto-update status to 'expired' if past expiry date and still marked active
        if (diffDays < 0 && member.status === 'active') {
          db.updateMember(member.id, { status: 'expired' });
          updatedExpiredCount++;
        }

        // 2. Check notification trigger intervals: 7 days, 3 days, 1 day, 0 (today), -7 (7 days ago)
        let notifType: NotificationType | null = null;
        let title = '';
        let message = '';
        let priority: 'high' | 'medium' | 'low' = 'medium';

        if (diffDays === 7) {
          notifType = 'expiry_7d';
          title = 'Membership Expires in 7 Days';
          message = `${member.fullName}'s ${member.planName || 'membership'} will expire in 7 days on ${member.membershipExpiryDate}.`;
          priority = 'low';
        } else if (diffDays === 3) {
          notifType = 'expiry_3d';
          title = 'Membership Expires in 3 Days';
          message = `${member.fullName}'s membership expires in 3 days on ${member.membershipExpiryDate}. Early renewal discount recommended.`;
          priority = 'medium';
        } else if (diffDays === 1) {
          notifType = 'expiry_1d';
          title = 'Membership Expires Tomorrow';
          message = `${member.fullName}'s membership expires tomorrow (${member.membershipExpiryDate}). Send renewal reminder today.`;
          priority = 'high';
        } else if (diffDays === 0) {
          notifType = 'expiry_today';
          title = 'Membership Expires Today';
          message = `${member.fullName}'s membership expires today (${member.membershipExpiryDate})! Collect renewal or freeze status.`;
          priority = 'high';
        } else if (diffDays === -7) {
          notifType = 'expired_7d';
          title = 'Expired 7 Days Ago - Win-back Followup';
          message = `${member.fullName}'s membership expired 7 days ago on ${member.membershipExpiryDate}. Reach out with a win-back offer.`;
          priority = 'medium';
        }

        if (notifType) {
          // Check if notification already exists for this member, type, and date to avoid duplicates
          const alreadyExists = existingNotifs.some(n =>
            n.memberId === member.id &&
            n.type === notifType &&
            n.createdAt.startsWith(this.referenceDate)
          );

          if (!alreadyExists) {
            const newNotif: SmartNotification = {
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              gymId,
              memberId: member.id,
              memberName: member.fullName,
              title,
              message,
              type: notifType,
              isRead: false,
              priority,
              createdAt: new Date().toISOString(),
              actionUrl: `/members?id=${member.id}`,
            };
            db.addNotification(newNotif);
            generatedCount++;
          }
        }
      });
    } catch (err) {
      console.error('Error in ReminderEngine runDailyCheck:', err);
    } finally {
      this.isRunning = false;
    }

    return { generatedCount, updatedExpiredCount, scannedMembers };
  }

  public destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

export const reminderEngine = new ReminderEngine();
