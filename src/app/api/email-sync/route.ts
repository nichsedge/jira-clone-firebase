import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { fetchUnreadEmails } from '@/services/email-service';
import type { ParsedMail } from '@/services/email-service';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('Email sync: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Email sync started for user:', session.user.id);

    // Get user email credentials from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        imapHost: true,
        imapPort: true,
        imapUser: true,
        imapPass: true,
        imapUseTls: true,
      },
    });

    if (!user || !user.imapHost || !user.imapPort || !user.imapUser || !user.imapPass) {
      console.log('Email sync: Missing email configuration for user', session.user.id);
      console.log('User config:', {
        imapHost: user?.imapHost || 'MISSING',
        imapPort: user?.imapPort || 'MISSING',
        imapUser: user?.imapUser || 'MISSING',
        hasImapPass: !!user?.imapPass,
        imapUseTls: user?.imapUseTls || 'MISSING',
      });
      return NextResponse.json(
        { error: 'Email configuration not set up for this user' },
        { status: 400 }
      );
    }

    const credentials = {
      host: user.imapHost,
      port: user.imapPort,
      user: user.imapUser,
      pass: user.imapPass,
      tls: user.imapUseTls ?? true,
    };

    console.log('Email sync: Using credentials for user', session.user.id);
    console.log('IMAP config:', {
      host: credentials.host,
      port: credentials.port,
      user: credentials.user,
      hasPass: !!credentials.pass,
      tls: credentials.tls,
    });

    // Fetch unread emails
    console.log('Email sync: Starting fetchUnreadEmails...');
    const emails: ParsedMail[] = await fetchUnreadEmails(credentials);
    console.log(`Email sync: Fetched ${emails.length} unread emails`);

    // Create tickets or notifications from emails (simplified - you may want more sophisticated parsing)
    const createdTickets = [];
    for (const email of emails) {
      // Parse email subject and content to create ticket data
      const subject = email.subject || 'No Subject';
      const body = email.text || email.html || 'No content';
      
      // Check if this email already exists as a ticket (basic deduplication by messageId)
      const existingTicket = await prisma.ticket.findUnique({
        where: {
          id: `EMAIL-${email.messageId?.replace(/[<>\s]/g, '') || Date.now().toString()}`,
        },
      });

      if (!existingTicket) {
        const ticket = await prisma.ticket.create({
          data: {
            id: `EMAIL-${email.messageId?.replace(/[<>\s]/g, '') || Date.now().toString()}`,
            title: subject.length > 100 ? `${subject.substring(0, 97)}...` : subject,
            description: `Email from ${email.from?.text || 'Unknown'}:\n\n${body.substring(0, 1000)}`,
            statusId: 'status-open', // Default to open status
            priority: 'MEDIUM',
            projectId: session.user.id, // Use user ID as project for now, or create a default project
            assigneeId: session.user.id,
            category: 'EMAIL',
          },
        });
        createdTickets.push(ticket);
        console.log(`Created ticket from email: ${ticket.id}`);
      } else {
        console.log(`Email already processed as ticket: ${existingTicket.id}`);
      }
    }

    console.log(`Email sync completed: Processed ${emails.length} emails, created ${createdTickets.length} new tickets`);

    return NextResponse.json({
      success: true,
      processed: emails.length,
      created: createdTickets.length,
      tickets: createdTickets,
    });

  } catch (error) {
    console.error('Email sync error for user', session?.user?.id || 'unknown', ':', error);
    return NextResponse.json(
      { error: 'Failed to sync emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}