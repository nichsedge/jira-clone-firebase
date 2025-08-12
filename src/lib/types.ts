export type TicketStatus = 'To Do' | 'In Progress' | 'Done';

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
  priority: 'Low' | 'Medium' | 'High';
  createdAt: Date;
  assignee?: User;
  reporter: User;
};
