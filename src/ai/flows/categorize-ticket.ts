// This is a server-side file that categorizes new tickets using AI.
'use server';

/**
 * @fileOverview An AI agent for categorizing new tickets.
 *
 * - categorizeTicket - A function that categorizes a ticket.
 * - CategorizeTicketInput - The input type for the categorizeTicket function.
 * - CategorizeTicketOutput - The return type for the categorizeTicket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeTicketInputSchema = z.object({
  title: z.string().describe('The title of the ticket.'),
  description: z.string().describe('The detailed description of the ticket.'),
});
export type CategorizeTicketInput = z.infer<typeof CategorizeTicketInputSchema>;

const CategorizeTicketOutputSchema = z.object({
  category: z.string().describe('The predicted category for the ticket.'),
  confidence: z.number().describe('The confidence level of the categorization (0-1).'),
});
export type CategorizeTicketOutput = z.infer<typeof CategorizeTicketOutputSchema>;

export async function categorizeTicket(input: CategorizeTicketInput): Promise<CategorizeTicketOutput> {
  return categorizeTicketFlow(input);
}

const categorizeTicketPrompt = ai.definePrompt({
  name: 'categorizeTicketPrompt',
  input: {schema: CategorizeTicketInputSchema},
  output: {schema: CategorizeTicketOutputSchema},
  prompt: `You are an expert in categorizing support tickets based on their content.

  Given the title and description of a ticket, predict the most appropriate category for it.
  Also, provide a confidence level for your prediction between 0 and 1.

  Title: {{{title}}}
  Description: {{{description}}}
  `,
});

const categorizeTicketFlow = ai.defineFlow(
  {
    name: 'categorizeTicketFlow',
    inputSchema: CategorizeTicketInputSchema,
    outputSchema: CategorizeTicketOutputSchema,
  },
  async input => {
    const {output} = await categorizeTicketPrompt(input);
    return output!;
  }
);
