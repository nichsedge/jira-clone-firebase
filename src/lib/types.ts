export type TicketPriority = 'low' | 'medium' | 'high';

export type User = {
  id: string;
  name: string;
  image?: string | null;
  email?: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
};

export interface Status {
  id: string;
  name: string;
  color: string;
}

export type TicketStatus = Status | string;

export type Ticket = {
  id: string;
  title: string;
  description?: string | null;
  status?: TicketStatus;
  category?: string;
  priority: TicketPriority;
  createdAt: Date;
  updatedAt: Date;
  assignee?: User;
  reporter?: User;
  projectId: string;
  project?: Project;
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
