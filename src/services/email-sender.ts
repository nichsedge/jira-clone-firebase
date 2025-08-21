// This is a server-side file for sending emails.
'use server';

import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const smtpConfig = {
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
};

const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Sends an email.
 * @param mailOptions - The options for the email.
 * @returns A promise that resolves when the email is sent.
 */
export async function sendMail({ to, subject, text, html }: MailOptions) {
  const from = process.env.SMTP_USER;

  if (!from) {
    throw new Error('SMTP_USER environment variable is not set.');
  }

  try {
    const info = await transporter.sendMail({
      from: `"ProFlow Support" <${from}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email.');
  }
}
