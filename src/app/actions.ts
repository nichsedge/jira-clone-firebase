
'use server';

import { categorizeTicket } from '@/ai/flows/categorize-ticket';
import { type Ticket, type TicketPriority, type User } from '@/lib/types';
import { initialTickets } from '@/data/tickets'; // To get users
import { z } from 'zod';
import { fetchUnreadEmails, ParsedMail } from '@/services/email-service';

const allUsers = initialTickets.flatMap(t => t.assignee ? [t.assignee] : []).reduce((acc, user) => {
  if (!acc.find(u => u.id === user.id)) {
    acc.push(user);
  }
  return acc;
}, [] as User[]);


const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  priority: z.enum(['Low', 'Medium', 'High']),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, "Project is required."),
});

const updateTicketSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  status: z.enum(['To Do', 'In Progress', 'Done']),
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
  
  const { title, description, priority, assigneeId, projectId } = validatedFields.data;

  try {
    const { category } = await categorizeTicket({ title, description });
    
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
      reporter: { id: 'USER-1', name: 'Alice Johnson', avatarUrl: 'https://placehold.co/32x32/E9D5FF/6D28D9/png?text=A' }, // Dummy reporter
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
  // We won't have the full user objects here, so we'll just return the ID for the assignee.
  const updatedTicketData = {
    ...validatedFields.data,
    assignee: allUsers.find(u => u.id === validatedFields.data.assigneeId)
  };


  // We are not persisting the full ticket object to keep it simple
  // so we will just return the validated data.
  // In a real app you would fetch the full ticket object from DB and return it.
  
  return { ticket: { ...updatedTicketData, createdAt: new Date(), updatedAt: new Date(), reporter: { id: 'USER-1', name: 'Alice Johnson', avatarUrl: 'https://placehold.co/32x32/E9D5FF/6D28D9/png?text=A' } } as Ticket };

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
