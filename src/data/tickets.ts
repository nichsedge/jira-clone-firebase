
import { type Ticket, type User, type Project } from '@/lib/types';

export const allUsers: User[] = [
  { id: 'USER-1', name: 'Alice Johnson', email: 'alice.johnson.demo@example.com', avatarUrl: 'https://placehold.co/32x32/E9D5FF/6D28D9/png?text=A' },
  { id: 'USER-2', name: 'Bob Williams', email: 'bob.williams.demo@example.com', avatarUrl: 'https://placehold.co/32x32/D1FAE5/065F46/png?text=B' },
];

export const initialProjects: Project[] = [
    { id: 'PROJ-1', name: 'ProFlow App', description: 'The main application development project.'},
    { id: 'PROJ-2', name: 'Marketing Website', description: 'Project for the new marketing website.' },
];


export const initialTickets: Ticket[] = [
  {
    id: 'TICKET-8782',
    title: "UI bug on login page",
    description: "The login button is misaligned on mobile devices, making it difficult to click.",
    status: 'To Do',
    category: 'UI/UX',
    priority: 'High',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    assignee: allUsers[0],
    reporter: allUsers[1],
    projectId: 'PROJ-1',
  },
  {
    id: 'TICKET-5214',
    title: "API endpoint for user data is slow",
    description: "The /api/users endpoint is taking over 2 seconds to respond, impacting performance.",
    status: 'In Progress',
    category: 'Backend',
    priority: 'High',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    assignee: allUsers[1],
    reporter: allUsers[0],
    projectId: 'PROJ-1',
  },
];
