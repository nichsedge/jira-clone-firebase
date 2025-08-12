'use server';

import { categorizeTicket } from '@/ai/flows/categorize-ticket';
import { type Ticket } from '@/lib/types';
import { z } from 'zod';

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
});

export async function createTicketAction(values: { title: string, description: string }): Promise<{ ticket?: Ticket, error?: string }> {
  const validatedFields = createTicketSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields.",
    };
  }
  
  const { title, description } = validatedFields.data;

  try {
    const { category } = await categorizeTicket({ title, description });
    
    // In a real app, you would save to a database here.
    // For this example, we're returning the data to be handled client-side.
    const newTicket: Ticket = {
      id: `TICKET-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      description,
      status: 'To Do',
      category,
      priority: 'Medium',
      createdAt: new Date(),
      // Dummy data for new fields
      reporter: { id: 'USER-1', name: 'Alice Johnson', avatarUrl: 'https://placehold.co/32x32/E9D5FF/6D28D9/png?text=A' },
    };

    return { ticket: newTicket };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create ticket with AI categorization.' };
  }
}
