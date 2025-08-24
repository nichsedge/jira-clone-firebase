// Email notification system for ticket updates and alerts
import { sendMail } from '@/services/email-sender';
import { auditLogger } from './audit';
import { User, Ticket } from '@/lib/types';

export enum NotificationType {
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_UPDATED = 'TICKET_UPDATED',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  TICKET_STATUS_CHANGED = 'TICKET_STATUS_CHANGED',
  TICKET_DUE_SOON = 'TICKET_DUE_SOON',
  TICKET_OVERDUE = 'TICKET_OVERDUE',
  USER_MENTIONED = 'USER_MENTIONED',
  PROJECT_INVITATION = 'PROJECT_INVITATION',
}

export interface NotificationContext {
  ticket?: Ticket;
  user?: User;
  project?: any;
  changes?: Record<string, { old: any; new: any }>;
  mentionedUsers?: User[];
  dueDate?: Date;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text: string;
  type: NotificationType;
  context: NotificationContext;
}

export class EmailNotificationService {
  private static instance: EmailNotificationService;
  private isEnabled: boolean;

  static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  constructor() {
    this.isEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';
  }

  // Send notification for ticket creation
  async notifyTicketCreated(ticket: Ticket, creator: User) {
    if (!this.isEnabled) return;

    const context: NotificationContext = { ticket, user: creator };

    // Notify project members (excluding creator)
    const projectMembers = await this.getProjectMembers(ticket.projectId);
    const recipients = projectMembers.filter(member => member.id !== creator.id);

    for (const recipient of recipients) {
      const notification = this.createTicketCreatedNotification(recipient, ticket, creator);
      await this.sendNotification(notification);
    }

    // Log notification event (using existing audit action)
    console.log('📧 Email notification sent:', {
      type: NotificationType.TICKET_CREATED,
      ticketId: ticket.id,
      recipients: recipients.length,
    });
  }

  // Send notification for ticket updates
  async notifyTicketUpdated(
    ticket: Ticket,
    updater: User,
    changes: Record<string, { old: any; new: any }>
  ) {
    if (!this.isEnabled) return;

    const context: NotificationContext = { ticket, user: updater, changes };

    // Notify assignee if changed
    if (changes.assigneeId) {
      const newAssignee = await this.getUserById(changes.assigneeId.new);
      if (newAssignee && newAssignee.id !== updater.id) {
        const notification = this.createTicketAssignedNotification(newAssignee, ticket, updater);
        await this.sendNotification(notification);
      }
    }

    // Notify reporter if status changed to resolved
    if (changes.status && changes.status.new === 'Done' && ticket.reporter.email) {
      const notification = this.createTicketResolvedNotification(ticket.reporter, ticket, updater);
      await this.sendNotification(notification);
    }

    // Notify watchers/mentioned users
    const mentionedUsers = this.extractMentionedUsers(changes);
    for (const user of mentionedUsers) {
      if (user.id !== updater.id && user.email) {
        const notification = this.createUserMentionedNotification(user, ticket, updater);
        await this.sendNotification(notification);
      }
    }
  }

  // Send notification for ticket assignment
  async notifyTicketAssigned(ticket: Ticket, assignee: User, assigner: User) {
    if (!this.isEnabled || !assignee.email) return;

    const notification = this.createTicketAssignedNotification(assignee, ticket, assigner);
    await this.sendNotification(notification);
  }

  // Send notification for due date reminders
  async notifyTicketDueSoon(ticket: Ticket, user: User, daysUntilDue: number) {
    if (!this.isEnabled || !user.email) return;

    const notification = this.createDueDateNotification(user, ticket, daysUntilDue);
    await this.sendNotification(notification);
  }

  // Send notification for overdue tickets
  async notifyTicketOverdue(ticket: Ticket, user: User, daysOverdue: number) {
    if (!this.isEnabled || !user.email) return;

    const notification = this.createOverdueNotification(user, ticket, daysOverdue);
    await this.sendNotification(notification);
  }

  // Create notification for ticket creation
  private createTicketCreatedNotification(
    recipient: User,
    ticket: Ticket,
    creator: User
  ): EmailNotification {
    const subject = `New Ticket: ${ticket.title}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">New Ticket Created</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${ticket.title}</h3>
          <p style="margin: 0 0 15px 0; color: #64748b;">${ticket.description}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
            <div>
              <strong>Priority:</strong> ${ticket.priority}
            </div>
            <div>
              <strong>Status:</strong> ${ticket.status}
            </div>
            <div>
              <strong>Created by:</strong> ${creator.name}
            </div>
            <div>
              <strong>Project:</strong> ${ticket.projectId}
            </div>
          </div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/tickets/${ticket.id}"
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Ticket
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          You're receiving this because you're a member of the project.
        </p>
      </div>
    `;

    const textBody = `
      New Ticket: ${ticket.title}

      ${ticket.description}

      Priority: ${ticket.priority}
      Status: ${ticket.status}
      Created by: ${creator.name}
      Project: ${ticket.projectId}

      View ticket: ${process.env.NEXTAUTH_URL}/tickets/${ticket.id}
    `;

    return {
      to: recipient.email!,
      subject,
      html: htmlBody,
      text: textBody,
      type: NotificationType.TICKET_CREATED,
      context: { ticket, user: creator },
    };
  }

  // Create notification for ticket assignment
  private createTicketAssignedNotification(
    recipient: User,
    ticket: Ticket,
    assigner: User
  ): EmailNotification {
    const subject = `Ticket Assigned: ${ticket.title}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Ticket Assigned to You</h2>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin: 0 0 10px 0;">${ticket.title}</h3>
          <p style="margin: 0 0 15px 0; color: #334155;">${ticket.description}</p>
          <p style="margin: 0; color: #059669; font-weight: 500;">
            Assigned by ${assigner.name}
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/tickets/${ticket.id}"
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Ticket
          </a>
        </div>
      </div>
    `;

    const textBody = `
      Ticket Assigned: ${ticket.title}

      ${ticket.description}

      Assigned by: ${assigner.name}

      View ticket: ${process.env.NEXTAUTH_URL}/tickets/${ticket.id}
    `;

    return {
      to: recipient.email!,
      subject,
      html: htmlBody,
      text: textBody,
      type: NotificationType.TICKET_ASSIGNED,
      context: { ticket, user: assigner },
    };
  }

  // Create notification for ticket resolution
  private createTicketResolvedNotification(
    recipient: User,
    ticket: Ticket,
    resolver: User
  ): EmailNotification {
    const subject = `Ticket Resolved: ${ticket.title}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Ticket Resolved</h2>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin: 0 0 10px 0;">${ticket.title}</h3>
          <p style="margin: 0 0 15px 0; color: #334155;">${ticket.description}</p>
          <p style="margin: 0; color: #059669; font-weight: 500;">
            Resolved by ${resolver.name}
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/tickets/${ticket.id}"
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Resolution
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
          If you feel the issue is not resolved, please reply to this email to reopen the ticket.
        </p>
      </div>
    `;

    const textBody = `
      Ticket Resolved: ${ticket.title}

      ${ticket.description}

      Resolved by: ${resolver.name}

      View resolution: ${process.env.NEXTAUTH_URL}/tickets/${ticket.id}

      If you feel the issue is not resolved, please reply to reopen the ticket.
    `;

    return {
      to: recipient.email!,
      subject,
      html: htmlBody,
      text: textBody,
      type: NotificationType.TICKET_STATUS_CHANGED,
      context: { ticket, user: resolver },
    };
  }

  // Create notification for user mentions
  private createUserMentionedNotification(
    recipient: User,
    ticket: Ticket,
    mentioner: User
  ): EmailNotification {
    const subject = `You were mentioned in: ${ticket.title}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">You were mentioned</h2>
        <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
          <h3 style="margin: 0 0 10px 0;">${ticket.title}</h3>
          <p style="margin: 0 0 15px 0; color: #581c87;">${ticket.description}</p>
          <p style="margin: 0; color: #7c3aed; font-weight: 500;">
            Mentioned by ${mentioner.name}
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/tickets/${ticket.id}"
             style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Ticket
          </a>
        </div>
      </div>
    `;

    const textBody = `
      You were mentioned in: ${ticket.title}

      ${ticket.description}

      Mentioned by: ${mentioner.name}

      View ticket: ${process.env.NEXTAUTH_URL}/tickets/${ticket.id}
    `;

    return {
      to: recipient.email!,
      subject,
      html: htmlBody,
      text: textBody,
      type: NotificationType.USER_MENTIONED,
      context: { ticket, user: mentioner },
    };
  }

  // Create due date notification
  private createDueDateNotification(
    recipient: User,
    ticket: Ticket,
    daysUntilDue: number
  ): EmailNotification {
    const subject = `Ticket Due Soon: ${ticket.title}`;
    const urgency = daysUntilDue <= 1 ? 'high' : 'medium';
    const color = urgency === 'high' ? '#ef4444' : '#f59e0b';

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${color};">Ticket Due ${daysUntilDue === 0 ? 'Today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}</h2>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
          <h3 style="margin: 0 0 10px 0;">${ticket.title}</h3>
          <p style="margin: 0 0 15px 0; color: #92400e;">${ticket.description}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong>Priority:</strong> ${ticket.priority}
            </div>
            <div>
              <strong>Status:</strong> ${ticket.status}
            </div>
          </div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/tickets/${ticket.id}"
             style="background: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Ticket
          </a>
        </div>
      </div>
    `;

    const textBody = `
      Ticket Due ${daysUntilDue === 0 ? 'Today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}: ${ticket.title}

      ${ticket.description}

      Priority: ${ticket.priority}
      Status: ${ticket.status}

      View ticket: ${process.env.NEXTAUTH_URL}/tickets/${ticket.id}
    `;

    return {
      to: recipient.email!,
      subject,
      html: htmlBody,
      text: textBody,
      type: NotificationType.TICKET_DUE_SOON,
      context: { ticket, user: recipient, dueDate: ticket.createdAt },
    };
  }

  // Create overdue notification
  private createOverdueNotification(
    recipient: User,
    ticket: Ticket,
    daysOverdue: number
  ): EmailNotification {
    const subject = `Overdue Ticket: ${ticket.title}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Overdue Ticket Alert</h2>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin: 0 0 10px 0;">${ticket.title}</h3>
          <p style="margin: 0 0 15px 0; color: #dc2626;">${ticket.description}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong>Priority:</strong> ${ticket.priority}
            </div>
            <div>
              <strong>Status:</strong> ${ticket.status}
            </div>
            <div>
              <strong>Days Overdue:</strong> ${daysOverdue}
            </div>
          </div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/tickets/${ticket.id}"
             style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Address Ticket
          </a>
        </div>
        <p style="color: #dc2626; font-size: 14px; text-align: center; margin-top: 30px;">
          ⚠️ This ticket is overdue and may need immediate attention.
        </p>
      </div>
    `;

    const textBody = `
      Overdue Ticket Alert: ${ticket.title}

      ${ticket.description}

      Priority: ${ticket.priority}
      Status: ${ticket.status}
      Days Overdue: ${daysOverdue}

      View ticket: ${process.env.NEXTAUTH_URL}/tickets/${ticket.id}

      ⚠️ This ticket is overdue and may need immediate attention.
    `;

    return {
      to: recipient.email!,
      subject,
      html: htmlBody,
      text: textBody,
      type: NotificationType.TICKET_OVERDUE,
      context: { ticket, user: recipient },
    };
  }

  // Send notification
  private async sendNotification(notification: EmailNotification) {
    try {
      // Get email settings (you would implement this based on your email service)
      const emailSettings = await this.getEmailSettings();

      if (!emailSettings) {
        console.warn('Email notifications disabled - no email settings configured');
        return;
      }

      await sendMail(
        {
          to: notification.to,
          subject: notification.subject,
          text: notification.text,
          html: notification.html,
        },
        emailSettings
      );

      console.log(`✅ Email notification sent: ${notification.type} to ${notification.to}`);
    } catch (error) {
      console.error(`❌ Failed to send email notification:`, error);
      // You might want to implement retry logic or queue failed notifications
    }
  }

  // Helper methods (implement based on your system)
  private async getProjectMembers(projectId: string): Promise<User[]> {
    // Implement based on your project membership system
    return [];
  }

  private async getUserById(userId: string): Promise<User | null> {
    // Implement based on your user system
    return null;
  }

  private extractMentionedUsers(changes: Record<string, { old: any; new: any }>): User[] {
    // Extract mentioned users from changes (e.g., from ticket descriptions or comments)
    return [];
  }

  private async getEmailSettings() {
    // Implement based on your email settings system
    return {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      tls: true,
    };
  }
}

// Export singleton instance
export const emailNotificationService = EmailNotificationService.getInstance();

// Helper functions for easy access
export const notify = {
  ticketCreated: (ticket: Ticket, creator: User) =>
    emailNotificationService.notifyTicketCreated(ticket, creator),

  ticketUpdated: (ticket: Ticket, updater: User, changes: Record<string, { old: any; new: any }>) =>
    emailNotificationService.notifyTicketUpdated(ticket, updater, changes),

  ticketAssigned: (ticket: Ticket, assignee: User, assigner: User) =>
    emailNotificationService.notifyTicketAssigned(ticket, assignee, assigner),

  ticketDueSoon: (ticket: Ticket, user: User, daysUntilDue: number) =>
    emailNotificationService.notifyTicketDueSoon(ticket, user, daysUntilDue),

  ticketOverdue: (ticket: Ticket, user: User, daysOverdue: number) =>
    emailNotificationService.notifyTicketOverdue(ticket, user, daysOverdue),
};