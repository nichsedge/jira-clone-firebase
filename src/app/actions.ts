
'use server';

import { categorizeTicket } from '@/ai/flows/categorize-ticket';
import { sendEmailNotification } from '@/ai/flows/send-email-notification';
import { type Ticket, type TicketPriority, type User, TicketStatus } from '@/lib/types';
import { allUsers } from '@/data/tickets';
import { z } from 'zod';
import { fetchUnreadEmails } from '@/services/email-service';

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  priority: z.enum(['Low', 'Medium', 'High']),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, "Project is required."),
  reporter: z.custom<User>(),
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
  reporter: z.any(),
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
  
  const { title, description, priority, assigneeId, projectId, reporter } = validatedFields.data;

  if (!reporter || !reporter.id) {
    return { error: 'Invalid reporter.' };
  }

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
      reporter, // The full reporter object is now passed directly
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

  const { id, reporter, ...updateData } = validatedFields.data;
  
  // In a real app, you would fetch the existing ticket from the database.
  // For this example, we're simulating it. The client should pass the full reporter object.
  if (!reporter || !reporter.id) {
      return { error: 'Invalid reporter data provided for update.' };
  }
  
  const updatedTicketData: Partial<Ticket> = {
    ...updateData,
    id,
    assignee: allUsers.find(u => u.id === updateData.assigneeId),
    reporter: reporter as User,
    updatedAt: new Date(),
  };

  // In a real app, you would merge with data from DB. Here we assume client sends all necessary data.
  const updatedTicket: Ticket = {
      id: updatedTicketData.id!,
      title: updatedTicketData.title!,
      description: updatedTicketData.description!,
      status: updatedTicketData.status as TicketStatus,
      priority: updatedTicketData.priority!,
      assignee: updatedTicketData.assignee,
      category: updatedTicketData.category,
      projectId: updatedTicketData.projectId!,
      updatedAt: updatedTicketData.updatedAt!,
      reporter: updatedTicketData.reporter!,
      createdAt: ticket?.createdAt || new Date(), // Should be original creation date
  };

  if (updatedTicket.status === 'Done' && updatedTicket.reporter.email) {
      try {
          await sendEmailNotification({
              ticketId: updatedTicket.id,
              ticketTitle: updatedTicket.title,
              reporterEmail: updatedTicket.reporter.email,
          });
      } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
          return { ticket: updatedTicket, error: "Ticket updated, but failed to send email notification." };
      }
  }


  return { ticket: updatedTicket };
}

export async function deleteTicketAction(values: z.infer<typeof deleteTicketSchema>): Promise<{ id?: string, error?: string }> {
    const validatedFields = deleteTicketSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields.",
        };
    }

    return { id: validatedFields.data.id };
}


export async function syncEmailsAction(existingUsers: User[]): Promise<{ tickets?: Ticket[], newUsers?: User[], error?: string, count: number }> {
    try {
        const emails = await fetchUnreadEmails();
        const ticketEmails = emails.filter(email => email.subject?.includes('[TICKET]'));

        if (ticketEmails.length === 0) {
            return { tickets: [], newUsers: [], count: 0 };
        }

        const newTickets: Ticket[] = [];
        const newUsers: User[] = [];
        const mutableUsers = [...existingUsers];

        for (const email of ticketEmails) {
            const title = email.subject?.replace("[TICKET]", "").trim() || "New Ticket from Email";
            const description = email.text || "No description provided.";
            
            const fromEmail = email.from?.value[0]?.address;
            if (!fromEmail) {
                console.warn("Skipping email without a 'from' address:", email.messageId);
                continue;
            }

            let reporter = mutableUsers.find(u => u.email === fromEmail);

            if (!reporter) {
                const fromName = email.from?.value[0]?.name || fromEmail.split('@')[0] || "Email User";
                const newUserId = `USER-${Math.floor(1000 + Math.random() * 9000)}`;
                reporter = {
                    id: newUserId,
                    name: fromName,
                    email: fromEmail,
                    avatarUrl: `https://placehold.co/32x32/E9D5FF/6D28D9/png?text=${fromName.charAt(0).toUpperCase()}`,
                };
                newUsers.push(reporter);
                mutableUsers.push(reporter); // Add to the list for subsequent checks in the same batch
            }

            const now = new Date();

            const newTicket: Ticket = {
              id: `TICKET-${Math.floor(1000 + Math.random() * 9000)}`,
              title,
              description,
              status: 'To Do',
              category: "From Email",
              priority: 'Medium',
              createdAt: now,
              updatedAt: now,
              reporter: reporter,
              projectId: 'PROJ-1', // Default project
            };
            newTickets.push(newTicket);
        }

        return { tickets: newTickets, newUsers: newUsers, count: newTickets.length };
    } catch (error) {
        console.error('Email sync failed:', error);
        return { error: 'Failed to sync emails.', count: 0 };
    }
}
