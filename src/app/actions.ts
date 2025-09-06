'use server';

import { type Ticket, type TicketPriority, type User, type EmailSettings } from '@/lib/types';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { sendMail } from '@/services/email-sender';
import { fetchUnreadEmails } from '@/services/email-service';
import { getEmailSettings } from '@/lib/email-settings';
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

const displayPriorityMap: Record<string, string> = {
  'LOW': 'Low',
  'MEDIUM': 'Medium',
  'HIGH': 'High',
};

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  statusId: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, "Project is required."),
  reporter: z.custom<User>(),
});

const updateTicketSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  statusId: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  assigneeId: z.string().optional(),
  category: z.string().optional(),
  projectId: z.string().optional(),
  reporter: z.any().optional(),
  createdAt: z.string(),
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
  
  const { title, description, statusId, priority, assigneeId, projectId, reporter } = validatedFields.data;

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

    let statusConnect = { id: 'status-todo' }; // Default to To Do
    if (statusId) {
      const status = await prisma.status.findUnique({
        where: { id: statusId },
      });
      if (status) {
        statusConnect = { id: statusId };
      }
    }

    const now = new Date();
    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description: description || undefined,
        status: { connect: statusConnect } as any,
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
      status: newTicket.status as any,
      category: 'General',
      priority: priority as any,
      createdAt: newTicket.createdAt,
      updatedAt: newTicket.updatedAt,
      assignee: newTicket.assignee ? { id: newTicket.assignee.id, name: newTicket.assignee.name || 'Unknown', email: newTicket.assignee.email || '', image: newTicket.assignee.image || '', priority: 'MEDIUM' } : undefined,
      reporter: reporter,
      projectId: newTicket.projectId,
      project: newTicket.project, // Include project
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
    console.error('Validation errors:', validatedFields.error.errors);
    console.error('Input values:', values);
    return {
      error: `Invalid fields: ${validatedFields.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`,
    };
  }

  const { id, title, description, status, priority, assigneeId, category, projectId, createdAt, emailSettings } = validatedFields.data;
  
  // Get existing ticket data for base information
  const existingTicket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      assignee: true,
      status: true,
      project: true
    } as any,
  });

  if (!existingTicket) {
    return { error: 'Ticket not found' };
  }

  // Check project access
  const project = await prisma.project.findFirst({
    where: {
      id: projectId || existingTicket.projectId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { id: session.user.id } } }
      ]
    },
  });

  if (!project) {
    return { error: 'Project not found or unauthorized' };
  }

  // Validate assignee exists if provided
  let validAssigneeId = existingTicket.assigneeId;
  if (assigneeId !== undefined) {
    if (assigneeId === null || assigneeId === '') {
      validAssigneeId = null;
    } else {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      });
      if (!assignee) {
        console.warn(`Assignee not found: ${assigneeId}, clearing assignment`);
        validAssigneeId = null;
      } else {
        validAssigneeId = assigneeId;
      }
    }
  }

  let statusToConnect = null;
  if (status) {
    const statusToUpdate = await prisma.status.findFirst({
      where: { name: status },
    });
    if (!statusToUpdate) {
      return { error: `Status "${status}" not found.` };
    }
    statusToConnect = statusToUpdate;
  }

  const updateFields: any = {
    updatedAt: new Date(),
  };

  if (title !== undefined) {
    updateFields.title = title;
  }
  if (description !== undefined) {
    updateFields.description = description;
  }
  if (statusToConnect) {
    updateFields.statusId = statusToConnect.id;
  }
  if (priority !== undefined) {
    updateFields.priority = priorityMap[priority] as any;
  }
  if (validAssigneeId !== undefined) {
    updateFields.assigneeId = validAssigneeId;
  }
  if (category !== undefined) {
    updateFields.category = category;
  }
  if (projectId !== undefined) {
    updateFields.projectId = projectId;
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

  const frontendStatus = updatedTicket.status as any;
  const currentPriority = existingTicket.priority;
  const providedReporter = validatedFields.data.reporter;
  const reporterData = providedReporter && providedReporter.id ? providedReporter : {
    id: 'SYSTEM',
    name: 'System',
    email: '',
    image: '',
    priority: 'MEDIUM' as const
  };
  const ticketData: Ticket = {
    id: updatedTicket.id,
    title: title !== undefined ? title : updatedTicket.title || '',
    description: description !== undefined ? description : updatedTicket.description || '',
    status: frontendStatus,
    category: category !== undefined ? category : existingTicket.category || 'General',
    priority: (priority !== undefined ? priority : displayPriorityMap[currentPriority] || 'Medium') as any,
    assignee: updatedTicket.assignee ? { id: updatedTicket.assignee.id, name: updatedTicket.assignee.name || 'Unknown', email: updatedTicket.assignee.email || '', image: updatedTicket.assignee.image || '', priority: 'MEDIUM' } : undefined,
    reporter: reporterData,
    projectId: updatedTicket.projectId,
    project: updatedTicket.project,
    createdAt: new Date(createdAt),
    updatedAt: updatedTicket.updatedAt,
  };

  // Email notification if status is DONE (skip if no reporter email)
  if (frontendStatus?.name === 'Done' && emailSettings?.smtp) {
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

      // Use a default email or skip if no reporter email available
      await sendMail({
        to: 'support@proflow.com', // Default support email
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
    if (updateData.statusId) {
      statusToConnect = { id: updateData.statusId };
    } else if (updateData.status) {
      const statusToUpdate = await prisma.status.findFirst({
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
      updateFields.statusId = 'id' in statusToConnect ? statusToConnect.id : statusToConnect;
    }
    if (updateData.priority !== undefined) {
      updateFields.priority = priorityMap[updateData.priority] as any;
    }
    if (validAssigneeId !== undefined) {
      updateFields.assigneeId = validAssigneeId;
    }
    if (updateData.category !== undefined) {
      updateFields.category = updateData.category;
    }
    if (updateData.projectId !== undefined) {
      // Validate access to new project
      const newProject = await prisma.project.findFirst({
        where: {
          id: updateData.projectId,
          OR: [
            { ownerId: session.user.id },
            { members: { some: { id: session.user.id } } }
          ]
        },
      });
      if (!newProject) {
        return { error: 'New project not found or unauthorized' };
      }
      updateFields.projectId = updateData.projectId;
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

    const frontendStatus = updatedTicket.status as any;
    const currentPriority = currentTicket.priority;
    const ticketData: Ticket = {
      id: updatedTicket.id,
      title: updateData.title !== undefined ? updateData.title : updatedTicket.title || '',
      description: updateData.description !== undefined ? updateData.description : updatedTicket.description || '',
      status: frontendStatus,
      category: updateData.category || 'General',
      priority: (updateData.priority !== undefined ? updateData.priority : displayPriorityMap[currentPriority] || 'Medium') as any,
      assignee: updatedTicket.assignee ? { id: updatedTicket.assignee.id, name: updatedTicket.assignee.name || 'Unknown', email: updatedTicket.assignee.email || '', image: updatedTicket.assignee.image || '', priority: 'MEDIUM' } : undefined,
      reporter,
      projectId: updatedTicket.projectId,
      project: updatedTicket.project, // Include project
      createdAt: new Date(createdAt),
      updatedAt: updatedTicket.updatedAt,
    };

    // Email notification if status is DONE and reporter email exists
    if (frontendStatus?.name === 'Done' && validatedFields.data.reporter?.email && emailSettings?.smtp) {
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
          to: validatedFields.data.reporter.email,
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
    console.error('Update ticket error details:', error);
    if (error instanceof Error) {
      return { error: `Failed to update ticket: ${error.message}` };
    }
    return { error: 'Failed to update ticket: Unknown error' };
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
    console.log('syncEmailsAction: Unauthorized access');
    return { error: 'Unauthorized', count: 0 };
  }

  console.log('syncEmailsAction: Started for user', session.user.id);
  console.log('syncEmailsAction: Received', existingUsers?.length || 0, 'existing users');
  console.log('syncEmailsAction: Email settings provided:', {
    imap: emailSettings?.imap ? { host: emailSettings.imap.host, user: emailSettings.imap.user, hasPass: !!emailSettings.imap.pass } : 'MISSING',
    smtp: emailSettings?.smtp ? { host: emailSettings.smtp.host, user: emailSettings.smtp.user } : 'MISSING'
  });

  try {
    // Fallback to database settings if client-side settings are incomplete
    let finalEmailSettings = emailSettings;
    if (!finalEmailSettings?.imap?.host || !finalEmailSettings.imap.user) {
      console.log('syncEmailsAction: Client settings incomplete, loading from database');
      const dbSettings = await getEmailSettings();
      if (dbSettings) {
        finalEmailSettings = dbSettings;
        console.log('syncEmailsAction: Loaded complete settings from DB');
      } else {
        return { error: 'No email settings available. Please save your email credentials first.', count: 0 };
      }
    }

    if (!finalEmailSettings?.imap?.host || !finalEmailSettings.imap.port || !finalEmailSettings.imap.user || !finalEmailSettings.imap.pass) {
      console.log('syncEmailsAction: IMAP settings still incomplete after fallback:', finalEmailSettings?.imap);
      return { error: 'IMAP settings are not configured. Please save your email credentials first.', count: 0 };
    }

    console.log('syncEmailsAction: Using IMAP config:', {
      host: finalEmailSettings.imap.host,
      port: finalEmailSettings.imap.port,
      user: finalEmailSettings.imap.user,
      hasPass: !!finalEmailSettings.imap.pass,
      tls: finalEmailSettings.imap.tls
    });

    const emails = await fetchUnreadEmails(finalEmailSettings.imap);
    console.log('syncEmailsAction: Fetched', emails.length, 'unread emails');
    
    const ticketEmails = emails.filter(email => email.subject?.includes('[TICKET]'));
    console.log('syncEmailsAction: Found', ticketEmails.length, 'ticket emails');

    if (ticketEmails.length === 0) {
        console.log('syncEmailsAction: No ticket emails found');
        return { tickets: [], newUsers: [], count: 0 };
    }

    const newTickets: Ticket[] = [];
    const newUsers: User[] = [];

    for (const email of ticketEmails) {
        console.log('syncEmailsAction: Processing ticket email:', email.subject?.substring(0, 50));
        
        const title = email.subject?.replace("[TICKET]", "").trim() || "New Ticket from Email";
        const description = email.text || "No description provided.";
        
        const fromEmail = email.from?.value[0]?.address;
        if (!fromEmail) {
            console.warn("syncEmailsAction: Skipping email without a 'from' address:", email.messageId);
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
              image: createdReporter.image || '',
              priority: 'MEDIUM',
            };

            const newUser: User = reporterFrontend;
            newUsers.push(newUser);
            console.log('syncEmailsAction: Created new user:', newUser.id);
        } else {
            reporterFrontend = {
              id: reporter.id,
              name: reporter.name || 'Unknown',
              email: reporter.email || '',
              image: reporter.image || '',
              priority: 'MEDIUM',
            };
            console.log('syncEmailsAction: Using existing user:', reporterFrontend.id);
        }

        const now = new Date();

        const toDoStatus = await prisma.status.findFirst({
          where: { name: 'To Do' },
        });

        if (!toDoStatus) {
          console.error('syncEmailsAction: Default status "To Do" not found during email sync.');
          continue; // Skip this email if default status is not found
        }

        const newTicket = await prisma.ticket.create({
          data: {
            title,
            description: description || undefined,
            status: { connect: { id: toDoStatus.id } } as any,
            priority: 'MEDIUM' as any,
            project: { connect: { id: 'PROJ-1' } } as any,
            updatedAt: now,
          },
          include: {
            project: true,
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            },
            status: true, // Include status to map back to frontend type
          },
        });
        
        const ticket: Ticket = {
          id: newTicket.id,
          title: newTicket.title || '',
          description: newTicket.description || '',
          status: newTicket.status as any,
          category: "From Email",
          priority: (displayPriorityMap[newTicket.priority] || 'medium') as TicketPriority,
          createdAt: now,
          updatedAt: now,
          reporter: reporterFrontend,
          projectId: newTicket.projectId,
          project: newTicket.project, // Include project
          assignee: newTicket.assignee ? {
            id: (newTicket.assignee as any).id,
            name: (newTicket.assignee as any).name || 'Unknown',
            email: (newTicket.assignee as any).email || '',
            image: (newTicket.assignee as any).image || '',
            priority: 'MEDIUM'
          } : undefined,
        };
        newTickets.push(ticket);
        console.log('syncEmailsAction: Created ticket:', ticket.id);
    }

    console.log('syncEmailsAction: Sync completed -', newTickets.length, 'tickets,', newUsers.length, 'new users');
    return { tickets: newTickets, newUsers, count: newTickets.length };
  } catch (error) {
      console.error('syncEmailsAction: Email sync failed:', error);
      if (error instanceof Error) {
          return { error: `Failed to sync emails: ${error.message}`, count: 0 };
      }
      return { error: 'Failed to sync emails due to an unknown error.', count: 0 };
  }
}
