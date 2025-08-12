export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  category?: string;
  priority: 'Low' | 'Medium' | 'High';
  createdAt: Date;
};
