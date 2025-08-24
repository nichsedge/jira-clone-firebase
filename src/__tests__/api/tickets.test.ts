/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { createTicketSchema, updateTicketSchema } from '@/app/api/tickets/route';

// Mock the real-time features and audit logger for testing
jest.mock('@/lib/realtime', () => ({
  broadcastEvent: {
    ticketCreated: jest.fn(),
    ticketUpdated: jest.fn(),
    ticketDeleted: jest.fn(),
  },
}));

jest.mock('@/lib/audit', () => ({
  auditLogger: {
    logTicketCreated: jest.fn(),
  },
}));

// Mock Next.js middleware
jest.mock('@/lib/api-middleware', () => ({
  withMiddleware: (handler: any) => handler,
  createApiResponse: (data: any, status = 200) => ({
    status,
    json: () => Promise.resolve({
      success: true,
      data,
    }),
  }),
  apiMiddleware: jest.fn(),
}));

jest.mock('@/lib/error-handler', () => ({
  withErrorHandling: (handler: any) => handler,
  createValidationError: (message: string) => ({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
    },
  }),
}));

describe('Ticket Schema Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTicketSchema', () => {
    it('should validate valid ticket data', () => {
      const validData = {
        title: 'Valid Ticket Title',
        description: 'Valid description for the ticket',
        priority: 'High',
        projectId: 'PROJ-1',
        reporterId: 'USER-1',
      };

      const result = createTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        description: 'Valid description',
        priority: 'High',
        projectId: 'PROJ-1',
        reporterId: 'USER-1',
      };

      const result = createTicketSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Title is required');
    });

    it('should reject title too long', () => {
      const invalidData = {
        title: 'A'.repeat(201),
        description: 'Valid description',
        priority: 'High',
        projectId: 'PROJ-1',
        reporterId: 'USER-1',
      };

      const result = createTicketSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Title must be less than 200 characters');
    });

    it('should reject invalid priority', () => {
      const invalidData = {
        title: 'Valid Title',
        description: 'Valid description',
        priority: 'Invalid',
        projectId: 'PROJ-1',
        reporterId: 'USER-1',
      };

      const result = createTicketSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        title: 'Valid Title',
        // Missing description, priority, projectId, reporterId
      };

      const result = createTicketSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe('updateTicketSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        title: 'Updated Ticket Title',
        description: 'Updated description',
        priority: 'Low',
        status: 'In Progress',
      };

      const result = updateTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialData = {
        title: 'Just updating title',
      };

      const result = updateTicketSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid priority in updates', () => {
      const invalidData = {
        priority: 'Invalid',
      };

      const result = updateTicketSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty title in updates', () => {
      const invalidData = {
        title: '',
      };

      const result = updateTicketSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});