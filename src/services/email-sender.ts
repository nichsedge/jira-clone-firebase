// This is a server-side file for sending emails.
'use server';

import nodemailer from 'nodemailer';
import type { EmailCredentials } from '@/lib/types';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends an email using dynamically provided credentials.
 * @param mailOptions - The options for the email.
 * @param credentials - The SMTP credentials.
 * @returns A promise that resolves when the email is sent.
 */
export async function sendMail({ to, subject, text, html }: MailOptions, credentials: EmailCredentials) {
  if (!credentials || !credentials.host || !credentials.port || !credentials.user || !credentials.pass) {
     const errorMessage = `Email service is not configured. Please provide all required SMTP credentials.`;
     console.error(errorMessage);
     throw new Error(errorMessage);
  }

  const transporter = nodemailer.createTransport({
    host: credentials.host,
    port: credentials.port,
    secure: credentials.port === 465, // true for 465, false for other ports
    auth: {
      user: credentials.user,
      pass: credentials.pass,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"ProFlow Support" <${credentials.user}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email. Please check your SMTP credentials.');
  }
}
