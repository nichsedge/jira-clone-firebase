

export type TicketStatus = string;
export type TicketPriority = 'Low' | 'Medium' | 'High';

import { UserRole } from './permissions';

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  email?: string;
  role?: UserRole;
  createdAt?: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
};

export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  category?: string;
  priority: TicketPriority;
  createdAt: Date;
  updatedAt: Date;
  assignee?: User;
  reporter: User;
  projectId: string;
};

export interface EmailCredentials {
    user: string;
    pass: string;
    host: string;
    port: number;
    tls: boolean;
}

export interface EmailSettings {
    smtp: EmailCredentials;
    imap: EmailCredentials;
}
