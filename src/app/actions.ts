
'use server';

import { categorizeTicket } from '@/ai/flows/categorize-ticket';
import { type Ticket, type TicketPriority, type User, TicketStatus } from '@/lib/types';
import { allUsers } from '@/data/tickets';
import { z } from 'zod';
import { fetchUnreadEmails, ParsedMail } from '@/services/email-service';

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  priority: z.enum(['Low', 'Medium', 'High']),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, "Project is required."),
  reporterId: z.string().min(1, "Reporter is required"),
});

const updateTicketSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  status: z.string().min(1, 'Status is required.'),
  priority: z.enum(['Low', 'Medium', 'High']),
  assigneeId: z.string().optional(),
  category: z.string().optional(),
  projectId: z.string().min(1, "Project is required."),
});

const deleteTicketSchema = z.object({
  id: z.string(),
});


export async function createTicketAction(values: z.infer<typeof createTicketSchema>): Promise<{ ticket?: Ticket, error?: string }> {
  const validatedFields = createTicketSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields.",
    };
  }
  
  const { title, description, priority, assigneeId, projectId, reporterId } = validatedFields.data;

  try {
    const { category } = await categorizeTicket({ title, description });
    
    const reporter = allUsers.find(u => u.id === reporterId);
    if (!reporter) {
        return { error: 'Invalid reporter.' };
    }

    // In a real app, you would save to a database here.
    // For this example, we're returning the data to be handled client-side.
    const now = new Date();
    const newTicket: Ticket = {
      id: `TICKET-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      description,
      status: 'To Do',
      category,
      priority: priority as TicketPriority,
      createdAt: now,
      updatedAt: now,
      assignee: allUsers.find(u => u.id === assigneeId),
      reporter,
      projectId,
    };

    return { ticket: newTicket };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create ticket with AI categorization.' };
  }
}

export async function updateTicketAction(values: z.infer<typeof updateTicketSchema>): Promise<{ ticket?: Ticket, error?: string }> {
  const validatedFields = updateTicketSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields.",
    };
  }

  // In a real app, you would update the database here.
  // For this example, we're just returning the updated data.
  const { id, ...updateData } = validatedFields.data;
  
  // This is a simplified update. In a real app, you'd fetch the existing ticket
  // and merge the fields.
  const updatedTicket: Ticket = {
    id,
    title: updateData.title,
    description: updateData.description,
    status: updateData.status as TicketStatus,
    priority: updateData.priority,
    assignee: allUsers.find(u => u.id === updateData.assigneeId),
    category: updateData.category,
    projectId: updateData.projectId,
    // These would not be updated like this in a real scenario
    createdAt: new Date(), 
    updatedAt: new Date(),
    reporter: allUsers[0], // Assuming a default/mocked reporter
  };

  return { ticket: updatedTicket };
}

export async function deleteTicketAction(values: z.infer<typeof deleteTicketSchema>): Promise<{ id?: string, error?: string }> {
    const validatedFields = deleteTicketSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields.",
        };
    }

    // In a real app, you would delete from the database here.
    return { id: validatedFields.data.id };
}


export async function syncEmailsAction(): Promise<{ tickets?: Ticket[], error?: string, count: number }> {
    try {
        const emails = await fetchUnreadEmails();
        const ticketEmails = emails.filter(email => email.subject?.includes('[TICKET]'));

        if (ticketEmails.length === 0) {
            return { tickets: [], count: 0 };
        }

        const newTickets: Ticket[] = [];

        for (const email of ticketEmails) {
            const title = email.subject?.replace("[TICKET]", "").trim() ?? "New Ticket";
            const description = email.text ?? "No description provided.";
            
            const now = new Date();
            const newTicket: Ticket = {
              id: `TICKET-${Math.floor(1000 + Math.random() * 9000)}`,
              title,
              description,
              status: 'To Do',
              category: "From Email", // Default category
              priority: 'Medium', // Default priority
              createdAt: now,
              updatedAt: now,
              reporter: { id: 'USER-EMAIL', name: email.from?.text ?? "Email User", avatarUrl: 'https://placehold.co/32x32/E9D5FF/6D28D9/png?text=E' },
              projectId: 'PROJ-1', // Default project
            };
            newTickets.push(newTicket);
        }

        return { tickets: newTickets, count: newTickets.length };
    } catch (error) {
        console.error('Email sync failed:', error);
        return { error: 'Failed to sync emails.', count: 0 };
    }
}
