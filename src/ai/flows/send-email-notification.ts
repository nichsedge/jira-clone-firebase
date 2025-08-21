// This is a server-side file that sends an email notification.
'use server';

/**
 * @fileOverview An AI agent for sending email notifications.
 *
 * - sendEmailNotification - A function that sends an email notification when a ticket is resolved.
 * - SendEmailNotificationInput - The input type for the sendEmailNotification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendMail } from '@/services/email-sender';

const SendEmailNotificationInputSchema = z.object({
  ticketId: z.string().describe('The ID of the ticket.'),
  ticketTitle: z.string().describe('The title of the ticket.'),
  reporterEmail: z.string().email().describe('The email address of the reporter.'),
});
export type SendEmailNotificationInput = z.infer<typeof SendEmailNotificationInputSchema>;

export async function sendEmailNotification(input: SendEmailNotificationInput): Promise<void> {
  await sendEmailNotificationFlow(input);
}

const sendEmailNotificationFlow = ai.defineFlow(
  {
    name: 'sendEmailNotificationFlow',
    inputSchema: SendEmailNotificationInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const { ticketId, ticketTitle, reporterEmail } = input;
    
    const subject = `Ticket Resolved: ${ticketId} - ${ticketTitle}`;
    const textBody = `Hello,\n\nYour support ticket "${ticketTitle}" with ID ${ticketId} has been marked as resolved.\n\nThank you for using our support system.\n\nThe ProFlow Team`;
    const htmlBody = `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>Ticket Resolved: ${ticketId}</h2>
        <p>Hello,</p>
        <p>Your support ticket "<strong>${ticketTitle}</strong>" has been marked as resolved.</p>
        <p>If you feel the issue is not resolved, please reply to this email to reopen the ticket.</p>
        <br/>
        <p>Thank you,</p>
        <p><strong>The ProFlow Team</strong></p>
      </div>
    `;

    await sendMail({
      to: reporterEmail,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });
  }
);
