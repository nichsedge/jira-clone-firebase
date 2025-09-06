'use server';

import { type Ticket, type TicketPriority, type User, type EmailSettings } from '@/lib/types';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { sendMail } from '@/services/email-sender';
import { fetchUnreadEmails } from '@/services/email-service';
import bcrypt from 'bcryptjs';
import type { Session } from 'next-auth';

const prisma = new PrismaClient();

interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}


const priorityMap: Record<string, string> = {
  'Low': 'LOW',
  'Medium': 'MEDIUM',
  'High': 'HIGH',
};

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
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  assigneeId: z.string().optional(),
  category: z.string().optional(),
  projectId: z.string().optional(),
  reporter: z.any(),
  createdAt: z.date(),
  emailSettings: z.any().optional(),
});

const deleteTicketSchema = z.object({
  id: z.string(),
});

export async function createTicketAction(values: z.infer<typeof createTicketSchema>): Promise<{ ticket?: Ticket, error?: string }> {
  const session = await getServerSession(authOptions) as ExtendedSession;
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

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
    // Check project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } }
        ]
      },
    });

    if (!project) {
      return { error: 'Project not found or unauthorized' };
    }

    const toDoStatus = await (prisma as any).status.findFirst({
      where: { name: 'To Do' },
    });

    if (!toDoStatus) {
      return { error: 'Default status "To Do" not found.' };
    }

    const now = new Date();
    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        status: { connect: { id: toDoStatus.id } } as any,
        priority: priorityMap[priority] as any,
        project: { connect: { id: projectId } } as any,
        ...(assigneeId && { assignee: { connect: { id: assigneeId } } as any }),
        updatedAt: now,
      },
      include: {
        project: true,
        assignee: true,
        status: true,
      } as any,
    });

    // Map back to frontend type if needed
    const ticket: Ticket = {
      id: newTicket.id,
      title: newTicket.title || '',
      description: newTicket.description || '',
      status: (newTicket as any).status?.name || 'To Do', // Use status name from included status
      category: 'General',
      priority: priority as any,
      createdAt: newTicket.createdAt,
      updatedAt: newTicket.updatedAt,
      assignee: (newTicket as any).assignee ? { id: (newTicket as any).assignee.id, name: (newTicket as any).assignee.name || 'Unknown', email: (newTicket as any).assignee.email || '', avatarUrl: (newTicket as any).assignee.image || '' } : undefined,
      reporter: reporter,
      projectId: newTicket.projectId,
      project: (newTicket as any).project, // Include project
    };

    return { ticket };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create ticket.' };
  }
}

export async function updateTicketAction(values: z.infer<typeof updateTicketSchema>): Promise<{ ticket?: Ticket, error?: string }> {
  const session = await getServerSession(authOptions) as ExtendedSession;
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = updateTicketSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields.",
    };
  }

  const { id, reporter, createdAt, emailSettings, ...updateData } = validatedFields.data;
  
  if (!reporter || !reporter.id) {
      return { error: 'Invalid reporter data provided for update.' };
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { project: true, assignee: true },
    });

    if (!ticket) {
      return { error: 'Ticket not found' };
    }

    // Check project access
    const project = await prisma.project.findFirst({
      where: {
        id: ticket.projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } }
        ]
      },
    });

    if (!project) {
      return { error: 'Project not found or unauthorized' };
    }

    // Get current ticket data for partial updates
    const currentTicket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        assignee: true,
        status: true,
        project: true
      } as any,
    });

    if (!currentTicket) {
      return { error: 'Ticket not found' };
    }

    // Validate assignee exists if provided
    let validAssigneeId = currentTicket.assigneeId;
    if (updateData.assigneeId !== undefined) {
      if (updateData.assigneeId === null || updateData.assigneeId === '') {
        validAssigneeId = null;
      } else {
        const assignee = await prisma.user.findUnique({
          where: { id: updateData.assigneeId },
        });
        if (!assignee) {
          console.warn(`Assignee not found: ${updateData.assigneeId}, clearing assignment`);
          validAssigneeId = null;
        } else {
          validAssigneeId = updateData.assigneeId;
        }
      }
    }

    let statusToConnect = null;
    if (updateData.status) {
      const statusToUpdate = await (prisma as any).status.findFirst({
        where: { name: updateData.status },
      });
      if (!statusToUpdate) {
        return { error: `Status "${updateData.status}" not found.` };
      }
      statusToConnect = statusToUpdate;
    }

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (updateData.title !== undefined) {
      updateFields.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      updateFields.description = updateData.description;
    }
    if (statusToConnect) {
      updateFields.statusId = statusToConnect.id;
    }
    if (updateData.priority !== undefined) {
      updateFields.priority = priorityMap[updateData.priority] as any;
    }
    if (validAssigneeId !== undefined) {
      updateFields.assigneeId = validAssigneeId;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateFields,
      include: {
        project: true,
        assignee: true,
        status: true,
      } as any,
    });

    const frontendStatus = (updatedTicket.status as any)?.name || (currentTicket.status as any)?.name || 'Unknown';
    console.log('Mapped status for ticket', id, ': DB status=', (updatedTicket.status as any)?.name, 'Frontend status=', frontendStatus, 'Type of frontend status:', typeof frontendStatus);
    const ticketData: Ticket = {
      id: updatedTicket.id,
      title: updateData.title !== undefined ? updateData.title : updatedTicket.title || '',
      description: updateData.description !== undefined ? updateData.description : updatedTicket.description || '',
      status: frontendStatus,
      category: updateData.category || 'General',
      priority: (updateData.priority !== undefined ? updateData.priority : (currentTicket.priority === 'LOW' ? 'Low' : currentTicket.priority === 'MEDIUM' ? 'Medium' : 'High')) as any,
      assignee: (updatedTicket.assignee as any) ? { id: (updatedTicket.assignee as any).id, name: (updatedTicket.assignee as any).name || 'Unknown', email: (updatedTicket.assignee as any).email || '', avatarUrl: (updatedTicket.assignee as any).image || '' } : undefined,
      reporter,
      projectId: updatedTicket.projectId,
      project: (updatedTicket.project as any), // Include project
      createdAt,
      updatedAt: updatedTicket.updatedAt,
    };

    // Email notification if status is DONE and reporter email exists
    if ((updatedTicket as any).status?.name === 'Done' && reporter.email && emailSettings?.smtp) {
      try {
        const subject = `Ticket Resolved: ${ticketData.id} - ${ticketData.title}`;
        const textBody = `Hello,\n\nYour support ticket "${ticketData.title}" with ID ${ticketData.id} has been marked as resolved.\n\nThank you for using our support system.\n\nThe ProFlow Team`;
        const htmlBody = `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2>Ticket Resolved: ${ticketData.id}</h2>
            <p>Hello,</p>
            <p>Your support ticket "<strong>${ticketData.title}</strong>" has been marked as resolved.</p>
            <p>If you feel the issue is not resolved, please reply to this email to reopen the ticket.</p>
            <br/>
            <p>Thank you,</p>
            <p><strong>The ProFlow Team</strong></p>
          </div>
        `;

        await sendMail({
          to: reporter.email,
          subject: subject,
          text: textBody,
          html: htmlBody,
        }, emailSettings.smtp);
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        return { ticket: ticketData, error: "Ticket updated, but failed to send email notification." };
      }
    }

    return { ticket: ticketData };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update ticket.' };
  }
}

export async function deleteTicketAction(values: z.infer<typeof deleteTicketSchema>): Promise<{ id?: string, error?: string }> {
  const session = await getServerSession(authOptions) as ExtendedSession;
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = deleteTicketSchema.safeParse(values);

  if (!validatedFields.success) {
      return {
          error: "Invalid fields.",
      };
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: validatedFields.data.id },
      include: { project: true },
    });

    if (!ticket) {
      return { error: 'Ticket not found' };
    }

    // Check project access
    const project = await prisma.project.findFirst({
      where: {
        id: ticket.projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } }
        ]
      },
    });

    if (!project) {
      return { error: 'Project not found or unauthorized' };
    }

    await prisma.ticket.delete({
      where: { id: validatedFields.data.id },
    });

    return { id: validatedFields.data.id };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete ticket.' };
  }
}

export async function syncEmailsAction(existingUsers: User[], emailSettings: EmailSettings): Promise<{ tickets?: Ticket[], newUsers?: User[], error?: string, count: number }> {
  const session = await getServerSession(authOptions) as ExtendedSession;
  if (!session?.user?.id) {
    return { error: 'Unauthorized', count: 0 };
  }

  try {
      if (!emailSettings?.imap) {
          return { error: 'IMAP settings are not configured.', count: 0 };
      }
      const emails = await fetchUnreadEmails(emailSettings.imap);
      const ticketEmails = emails.filter(email => email.subject?.includes('[TICKET]'));

      if (ticketEmails.length === 0) {
          return { tickets: [], newUsers: [], count: 0 };
      }

      const newTickets: Ticket[] = [];
      const newUsers: User[] = [];

      for (const email of ticketEmails) {
          const title = email.subject?.replace("[TICKET]", "").trim() || "New Ticket from Email";
          const description = email.text || "No description provided.";
          
          const fromEmail = email.from?.value[0]?.address;
          if (!fromEmail) {
              console.warn("Skipping email without a 'from' address:", email.messageId);
              continue;
          }

          let reporter = await prisma.user.findUnique({
            where: { email: fromEmail },
          });

          let reporterFrontend: User;

          if (!reporter) {
              // Create new user (for demo, no password, or set default; in real, send email for setup)
              const fromName = email.from?.value[0]?.name || fromEmail.split('@')[0] || "Email User";
              const hashedPassword = await bcrypt.hash('defaultPassword123', 12); // Temp default
              const createdReporter = await prisma.user.create({
                data: {
                  name: fromName,
                  email: fromEmail,
                  hashedPassword,
                  image: `https://placehold.co/32x32/E9D5FF/6D28D9/png?text=${fromName.charAt(0).toUpperCase()}`,
                },
              });

              reporterFrontend = {
                id: createdReporter.id,
                name: createdReporter.name || 'Unknown',
                email: createdReporter.email || fromEmail,
                avatarUrl: createdReporter.image || '',
              };

              const newUser: User = reporterFrontend;
              newUsers.push(newUser);
          } else {
              reporterFrontend = {
                id: reporter.id,
                name: reporter.name || 'Unknown',
                email: reporter.email || '',
                avatarUrl: reporter.image || '',
              };
          }

          const now = new Date();

          const toDoStatus: Status | null = await (prisma as any).status.findFirst({
            where: { name: 'To Do' },
          });

          if (!toDoStatus) {
            console.error('Default status "To Do" not found during email sync.');
            continue; // Skip this email if default status is not found
          }

          const newTicket = await prisma.ticket.create({
            data: {
              title,
              description,
              status: { connect: { id: toDoStatus.id } } as any,
              priority: 'MEDIUM',
              project: { connect: { id: 'PROJ-1' } } as any,
              updatedAt: now,
            },
            include: {
              project: true,
              assignee: true,
              status: true, // Include status to map back to frontend type
            } as any,
          });
          
          const ticket: Ticket = {
            id: newTicket.id,
            title: newTicket.title || '',
            description: newTicket.description || '',
            status: (newTicket as any).status?.name || 'To Do', // Use status name from included status
            category: "From Email",
            priority: 'Medium' as TicketPriority,
            createdAt: now,
            updatedAt: now,
            reporter: reporterFrontend,
            projectId: newTicket.projectId,
            project: (newTicket as any).project, // Include project
            assignee: (newTicket as any).assignee ? { id: (newTicket as any).assignee.id, name: (newTicket as any).assignee.name || 'Unknown', email: (newTicket as any).assignee.email || '', avatarUrl: (newTicket as any).assignee.image || '' } : undefined,
          };
          newTickets.push(ticket);
      }

      return { tickets: newTickets, newUsers, count: newTickets.length };
  } catch (error) {
      console.error('Email sync failed:', error);
      if (error instanceof Error) {
          return { error: `Failed to sync emails: ${error.message}`, count: 0 };
      }
      return { error: 'Failed to sync emails due to an unknown error.', count: 0 };
  }
}
