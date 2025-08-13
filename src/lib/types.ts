
export type TicketStatus = string;
export type TicketPriority = 'Low' | 'Medium' | 'High';

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
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
