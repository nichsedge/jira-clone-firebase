// Audit logging system for tracking all changes and user actions
import { Prisma } from '../generated/prisma';

export enum AuditAction {
  // Ticket actions
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_UPDATED = 'TICKET_UPDATED',
  TICKET_DELETED = 'TICKET_DELETED',
  TICKET_STATUS_CHANGED = 'TICKET_STATUS_CHANGED',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  TICKET_UNASSIGNED = 'TICKET_UNASSIGNED',

  // Project actions
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',

  // User actions
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',

  // System actions
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  DATA_MIGRATION = 'DATA_MIGRATION',
}

export enum AuditEntityType {
  TICKET = 'TICKET',
  PROJECT = 'PROJECT',
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export interface AuditLogEntry {
  id?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  userId?: string;
  userName?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

export interface AuditQuery {
  userId?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLogEntry[] = [];
  private maxLogs: number = 1000; // In production, use a proper database

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  // Log an action
  async log(entry: AuditLogEntry): Promise<string> {
    const auditEntry = {
      ...entry,
      id: entry.id || `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: entry.timestamp || new Date(),
    };

    // In development, store in memory
    this.logs.push(auditEntry);

    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In production, this would save to database
    console.log('🔍 Audit Log:', {
      action: auditEntry.action,
      entity: `${auditEntry.entityType}:${auditEntry.entityId}`,
      user: auditEntry.userName || auditEntry.userId,
      timestamp: auditEntry.timestamp,
    });

    return auditEntry.id!;
  }

  // Query audit logs
  async query(query: AuditQuery): Promise<AuditLogEntry[]> {
    let filteredLogs = [...this.logs];

    if (query.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
    }

    if (query.entityType) {
      filteredLogs = filteredLogs.filter(log => log.entityType === query.entityType);
    }

    if (query.entityId) {
      filteredLogs = filteredLogs.filter(log => log.entityId === query.entityId);
    }

    if (query.action) {
      filteredLogs = filteredLogs.filter(log => log.action === query.action);
    }

    if (query.dateFrom) {
      filteredLogs = filteredLogs.filter(log =>
        log.timestamp && log.timestamp >= query.dateFrom!
      );
    }

    if (query.dateTo) {
      filteredLogs = filteredLogs.filter(log =>
        log.timestamp && log.timestamp <= query.dateTo!
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;

    return filteredLogs.slice(offset, offset + limit);
  }

  // Get audit trail for a specific entity
  async getEntityHistory(entityType: AuditEntityType, entityId: string): Promise<AuditLogEntry[]> {
    return this.query({
      entityType,
      entityId,
      limit: 100,
    });
  }

  // Get user activity
  async getUserActivity(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    return this.query({
      userId,
      limit,
    });
  }

  // Get recent activity
  async getRecentActivity(limit: number = 20): Promise<AuditLogEntry[]> {
    return this.query({ limit });
  }

  // Helper methods for common audit actions
  async logTicketCreated(ticket: any, userId?: string, userName?: string) {
    return this.log({
      action: AuditAction.TICKET_CREATED,
      entityType: AuditEntityType.TICKET,
      entityId: ticket.id,
      userId,
      userName,
      newValues: {
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        projectId: ticket.projectId,
      },
      metadata: {
        category: ticket.category,
      },
    });
  }

  async logTicketUpdated(
    ticketId: string,
    oldValues: any,
    newValues: any,
    userId?: string,
    userName?: string
  ) {
    return this.log({
      action: AuditAction.TICKET_UPDATED,
      entityType: AuditEntityType.TICKET,
      entityId: ticketId,
      userId,
      userName,
      oldValues,
      newValues,
    });
  }

  async logTicketStatusChanged(
    ticketId: string,
    oldStatus: string,
    newStatus: string,
    userId?: string,
    userName?: string
  ) {
    return this.log({
      action: AuditAction.TICKET_STATUS_CHANGED,
      entityType: AuditEntityType.TICKET,
      entityId: ticketId,
      userId,
      userName,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
    });
  }

  async logUserRoleChanged(
    userId: string,
    oldRole: string,
    newRole: string,
    changedByUserId?: string,
    changedByUserName?: string
  ) {
    return this.log({
      action: AuditAction.USER_ROLE_CHANGED,
      entityType: AuditEntityType.USER,
      entityId: userId,
      userId: changedByUserId,
      userName: changedByUserName,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
    });
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Helper functions
export function getActionDescription(action: AuditAction): string {
  const descriptions: Record<AuditAction, string> = {
    [AuditAction.TICKET_CREATED]: 'Created new ticket',
    [AuditAction.TICKET_UPDATED]: 'Updated ticket',
    [AuditAction.TICKET_DELETED]: 'Deleted ticket',
    [AuditAction.TICKET_STATUS_CHANGED]: 'Changed ticket status',
    [AuditAction.TICKET_ASSIGNED]: 'Assigned ticket',
    [AuditAction.TICKET_UNASSIGNED]: 'Unassigned ticket',
    [AuditAction.PROJECT_CREATED]: 'Created new project',
    [AuditAction.PROJECT_UPDATED]: 'Updated project',
    [AuditAction.PROJECT_DELETED]: 'Deleted project',
    [AuditAction.USER_CREATED]: 'Created new user',
    [AuditAction.USER_UPDATED]: 'Updated user',
    [AuditAction.USER_DELETED]: 'Deleted user',
    [AuditAction.USER_ROLE_CHANGED]: 'Changed user role',
    [AuditAction.USER_LOGIN]: 'User logged in',
    [AuditAction.USER_LOGOUT]: 'User logged out',
    [AuditAction.SYSTEM_BACKUP]: 'System backup performed',
    [AuditAction.SYSTEM_MAINTENANCE]: 'System maintenance',
    [AuditAction.DATA_MIGRATION]: 'Data migration performed',
  };

  return descriptions[action] || action;
}

export function getEntityTypeDisplayName(entityType: AuditEntityType): string {
  const names: Record<AuditEntityType, string> = {
    [AuditEntityType.TICKET]: 'Ticket',
    [AuditEntityType.PROJECT]: 'Project',
    [AuditEntityType.USER]: 'User',
    [AuditEntityType.SYSTEM]: 'System',
  };

  return names[entityType] || entityType;
}