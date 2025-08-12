
export type TicketStatus = 'To Do' | 'In Progress' | 'Done';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
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
};
