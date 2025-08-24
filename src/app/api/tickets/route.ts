import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMiddleware, createApiResponse, apiMiddleware } from '@/lib/api-middleware';
import { broadcastEvent } from '@/lib/realtime';
import { auditLogger } from '@/lib/audit';
import { withErrorHandling, createValidationError } from '@/lib/error-handler';

// Temporary in-memory storage until database is working
let tickets: any[] = [];
let users: any[] = [];
let projects: any[] = [];

// Enhanced schema validation with better error messages
export const createTicketSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  priority: z.enum(['Low', 'Medium', 'High'], {
    errorMap: () => ({ message: 'Priority must be Low, Medium, or High' }),
  }),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  reporterId: z.string().min(1, 'Reporter is required'),
  category: z.string().max(100, 'Category must be less than 100 characters').optional(),
  status: z.string().default('To Do'),
});

export const updateTicketSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  status: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High'], {
    errorMap: () => ({ message: 'Priority must be Low, Medium, or High' }),
  }).optional(),
  assigneeId: z.string().optional(),
  category: z.string().max(100, 'Category must be less than 100 characters').optional(),
  projectId: z.string().min(1, 'Project is required').optional(),
});

// GET /api/tickets - Get all tickets
const getTicketsHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const assigneeId = searchParams.get('assigneeId');
  const status = searchParams.get('status');

  let filteredTickets = [...tickets];

  if (projectId) {
    filteredTickets = filteredTickets.filter(ticket => ticket.projectId === projectId);
  }

  if (assigneeId) {
    filteredTickets = filteredTickets.filter(ticket => ticket.assigneeId === assigneeId);
  }

  if (status) {
    filteredTickets = filteredTickets.filter(ticket => ticket.status === status);
  }

  return createApiResponse({ tickets: filteredTickets, count: filteredTickets.length });
};

export const GET = withErrorHandling(withMiddleware(getTicketsHandler, apiMiddleware));

// POST /api/tickets - Create a new ticket
const createTicketHandler = async (request: NextRequest) => {
  const body = await request.json();
  const validatedData = createTicketSchema.parse(body);

  const newTicket = {
    id: `TICKET-${Math.floor(1000 + Math.random() * 9000)}`,
    ...validatedData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  tickets.push(newTicket);

  // Broadcast real-time event
  broadcastEvent.ticketCreated(newTicket, validatedData.reporterId);

  // Log audit event
  await auditLogger.logTicketCreated(newTicket, validatedData.reporterId, 'API User');

  return createApiResponse(newTicket, 201);
};

export const POST = withErrorHandling(withMiddleware(createTicketHandler, apiMiddleware));

// PUT /api/tickets - Update multiple tickets (for drag & drop)
const updateTicketHandler = async (request: NextRequest) => {
  const body = await request.json();
  const { ticketId, updates } = body;

  if (!ticketId || !updates) {
    throw new Error('Ticket ID and updates are required');
  }

  const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);

  if (ticketIndex === -1) {
    throw new Error('Ticket not found');
  }

  const validatedUpdates = updateTicketSchema.parse(updates);

  tickets[ticketIndex] = {
    ...tickets[ticketIndex],
    ...validatedUpdates,
    updatedAt: new Date(),
  };

  // Broadcast real-time event
  broadcastEvent.ticketUpdated(tickets[ticketIndex], request.headers.get('user-id') || undefined);

  return createApiResponse(tickets[ticketIndex]);
};

export const PUT = withErrorHandling(withMiddleware(updateTicketHandler, apiMiddleware));