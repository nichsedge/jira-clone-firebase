
'use server';

import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { EmailSettings } from './types';

const prisma = new PrismaClient();

/**
 * Saves email settings to the database for the authenticated user.
 * @param settings - The email settings to save.
 */
export async function saveEmailSettings(settings: EmailSettings) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    console.log('Saving email settings for user:', session.user.id);
    console.log('IMAP settings:', {
      host: settings.imap.host,
      port: settings.imap.port,
      user: settings.imap.user,
      tls: settings.imap.tls,
    });
    console.log('SMTP settings:', {
      host: settings.smtp.host,
      port: settings.smtp.port,
      user: settings.smtp.user,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(settings.imap.host && { imapHost: settings.imap.host }),
        ...(settings.imap.port && { imapPort: settings.imap.port }),
        ...(settings.imap.user && { imapUser: settings.imap.user }),
        ...(settings.imap.pass && { imapPass: settings.imap.pass }),
        ...(settings.imap.tls !== undefined && { imapUseTls: settings.imap.tls }),
        ...(settings.smtp.host && { smtpHost: settings.smtp.host }),
        ...(settings.smtp.port && { smtpPort: settings.smtp.port }),
        ...(settings.smtp.user && { smtpUser: settings.smtp.user }),
        ...(settings.smtp.pass && { smtpPass: settings.smtp.pass }),
      } as any,
    });

    console.log('Email settings saved successfully for user:', session.user.id);

    return { success: true };
  } catch (error) {
    console.error('Error saving email settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Retrieves email settings from the database for the authenticated user.
 * @returns The email settings or null if not found.
 */
export async function getEmailSettings() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    }) as any;

    if (!user) {
      return null;
    }

    const settings = {
      imap: {
        host: user.imapHost || '',
        port: user.imapPort || 993,
        user: user.imapUser || '',
        pass: user.imapPass || '',
        tls: user.imapUseTls || true,
      },
      smtp: {
        host: user.smtpHost || '',
        port: user.smtpPort || 465,
        user: user.smtpUser || '',
        pass: user.smtpPass || '',
        tls: true, // SMTP TLS is handled differently
      },
    };

    console.log('Retrieved email settings for user:', session.user.id);
    console.log('IMAP settings retrieved:', {
      host: settings.imap.host,
      port: settings.imap.port,
      user: settings.imap.user,
      hasPass: !!settings.imap.pass,
      tls: settings.imap.tls,
    });

    return settings;
  } catch (error) {
    console.error('Error retrieving email settings:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Clears email settings from the database for the authenticated user.
 */
export async function clearEmailSettings() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        imapHost: null,
        imapPort: null,
        imapUser: null,
        imapPass: null,
        imapUseTls: null,
        smtpHost: null,
        smtpPort: null,
        smtpUser: null,
        smtpPass: null,
      } as any,
    });

    return { success: true };
  } catch (error) {
    console.error('Error clearing email settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
