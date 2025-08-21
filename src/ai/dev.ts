import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-ticket.ts';
import '@/ai/flows/send-email-notification.ts';
