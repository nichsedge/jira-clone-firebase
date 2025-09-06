import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Create super admin user if not exists
  const adminUser = await prisma.user.upsert({
    where: {
      email: process.env.IMAP_USER,
    },
    update: {},
    create: {
      id: 'ADMIN-1',
      name: 'Super Admin',
      email: process.env.IMAP_USER,
      hashedPassword,
      image: 'https://placehold.co/32x32/E9D5FF/6D28D9/png?text=A',
      imapHost: process.env.IMAP_HOST,
      imapPort: parseInt(process.env.IMAP_PORT || '993'),
      imapUser: process.env.IMAP_USER,
      imapPass: process.env.IMAP_PASS,
      imapUseTls: process.env.IMAP_USE_TLS === 'true',
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT || '465'),
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
    },
  });

  // Create additional users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'developer@example.com' },
      update: {},
      create: {
        id: 'USER-1',
        name: 'John Developer',
        email: 'developer@example.com',
        hashedPassword: await bcrypt.hash('password123', 12),
        image: 'https://placehold.co/32x32/10B981/FFFFFF/png?text=J',
      },
    }),
    prisma.user.upsert({
      where: { email: 'designer@example.com' },
      update: {},
      create: {
        id: 'USER-2',
        name: 'Jane Designer',
        email: 'designer@example.com',
        hashedPassword: await bcrypt.hash('password123', 12),
        image: 'https://placehold.co/32x32/EF4444/FFFFFF/png?text=J',
      },
    }),
    prisma.user.upsert({
      where: { email: 'tester@example.com' },
      update: {},
      create: {
        id: 'USER-3',
        name: 'Bob Tester',
        email: 'tester@example.com',
        hashedPassword: await bcrypt.hash('password123', 12),
        image: 'https://placehold.co/32x32/F59E0B/FFFFFF/png?text=B',
      },
    }),
  ]);

  // Create projects with different owners
  const proj1 = await prisma.project.upsert({
    where: {
      id: 'PROJ-1',
    },
    update: {},
    create: {
      id: 'PROJ-1',
      name: 'ProFlow App',
      description: 'The main application development project.',
      ownerId: adminUser.id,
    },
  });

  const proj2 = await prisma.project.upsert({
    where: {
      id: 'PROJ-2',
    },
    update: {},
    create: {
      id: 'PROJ-2',
      name: 'Marketing Website',
      description: 'Project for the new marketing website.',
      ownerId: users[0].id, // John Developer
    },
  });

  const proj3 = await prisma.project.upsert({
    where: {
      id: 'PROJ-3',
    },
    update: {},
    create: {
      id: 'PROJ-3',
      name: 'Mobile App',
      description: 'React Native mobile application development.',
      ownerId: users[1].id, // Jane Designer
    },
  });

  // Add all users as members to all projects for demo access
  // Update PROJ-1 to include all users as members
  await prisma.project.update({
    where: { id: proj1.id },
    data: {
      members: {
        connect: [
          { id: users[0].id },
          { id: users[1].id },
          { id: users[2].id },
        ],
      },
    },
  });

  // Update PROJ-2 to include all users as members
  await prisma.project.update({
    where: { id: proj2.id },
    data: {
      members: {
        connect: [
          { id: adminUser.id },
          { id: users[1].id },
          { id: users[2].id },
        ],
      },
    },
  });

  // Update PROJ-3 to include all users as members
  await prisma.project.update({
    where: { id: proj3.id },
    data: {
      members: {
        connect: [
          { id: adminUser.id },
          { id: users[0].id },
          { id: users[2].id },
        ],
      },
    },
  });

  console.log('Added project memberships for demo access');

  // Create status records with predictable IDs
  const todoStatus = await prisma.status.upsert({
    where: { id: 'status-todo' },
    update: {},
    create: {
      id: 'status-todo',
      name: 'To Do',
      color: '#6B7280', // gray
    },
  });

  const openStatus = await prisma.status.upsert({
    where: { id: 'status-open' },
    update: {},
    create: {
      id: 'status-open',
      name: 'Open',
      color: '#3B82F6', // blue
    },
  });

  const inProgressStatus = await prisma.status.upsert({
    where: { id: 'status-in-progress' },
    update: {},
    create: {
      id: 'status-in-progress',
      name: 'In Progress',
      color: '#F59E0B', // orange
    },
  });

  const doneStatus = await prisma.status.upsert({
    where: { id: 'status-done' },
    update: {},
    create: {
      id: 'status-done',
      name: 'Done',
      color: '#10B981', // green
    },
  });

  const statuses = [todoStatus, openStatus, inProgressStatus, doneStatus];

  // Create comprehensive tickets across different projects and statuses
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const ticketsData = [
    {
      id: 'TICKET-8782',
      title: 'UI bug on login page',
      description: 'The login button is misaligned on mobile devices, making it difficult to click.',
      statusId: todoStatus.id, // TO DO
      priority: 'HIGH' as const,
      createdAt: yesterday,
      updatedAt: yesterday,
      assigneeId: adminUser.id,
      projectId: proj1.id,
    },
    {
      id: 'TICKET-5214',
      title: 'API endpoint for user data is slow',
      description: 'The /api/users endpoint is taking over 2 seconds to respond, impacting performance.',
      statusId: openStatus.id, // OPEN
      priority: 'HIGH' as const,
      createdAt: threeDaysAgo,
      updatedAt: twoDaysAgo,
      assigneeId: users[0].id,
      projectId: proj1.id,
    },
    {
      id: 'TICKET-3921',
      title: 'Design new dashboard layout',
      description: 'Create wireframes and mockups for the new dashboard interface with improved UX.',
      statusId: inProgressStatus.id, // IN_PROGRESS
      priority: 'MEDIUM' as const,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
      assigneeId: users[1].id,
      projectId: proj2.id,
    },
    {
      id: 'TICKET-7483',
      title: 'Implement user authentication',
      description: 'Add JWT-based authentication with role-based access control for different user types.',
      statusId: doneStatus.id, // DONE
      priority: 'HIGH' as const,
      createdAt: oneWeekAgo,
      updatedAt: yesterday,
      assigneeId: users[0].id,
      projectId: proj1.id,
    },
    {
      id: 'TICKET-1592',
      title: 'Fix mobile responsiveness issues',
      description: 'Resolve CSS issues causing layout breaks on various mobile screen sizes.',
      statusId: inProgressStatus.id, // IN_PROGRESS
      priority: 'MEDIUM' as const,
      createdAt: threeDaysAgo,
      updatedAt: twoDaysAgo,
      assigneeId: users[2].id,
      projectId: proj3.id,
    },
    {
      id: 'TICKET-6347',
      title: 'Database optimization',
      description: 'Review and optimize database queries to improve overall application performance.',
      statusId: doneStatus.id, // DONE
      priority: 'LOW' as const,
      createdAt: oneWeekAgo,
      updatedAt: threeDaysAgo,
      assigneeId: adminUser.id,
      projectId: proj1.id,
    },
    {
      id: 'TICKET-2819',
      title: 'Add project analytics dashboard',
      description: 'Implement analytics dashboard showing project progress, team performance, and key metrics.',
      statusId: openStatus.id, // OPEN
      priority: 'HIGH' as const,
      createdAt: yesterday,
      updatedAt: yesterday,
      assigneeId: users[0].id,
      projectId: proj2.id,
    },
    {
      id: 'TICKET-4765',
      title: 'User profile customization',
      description: 'Allow users to customize their profile with avatar, bio, and notification preferences.',
      statusId: doneStatus.id, // DONE
      priority: 'MEDIUM' as const,
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      assigneeId: users[1].id,
      projectId: proj1.id,
    },
  ];

  for (const ticketData of ticketsData) {
    await prisma.ticket.upsert({
      where: { id: ticketData.id },
      update: {},
      create: ticketData,
    });
  }

  console.log('Seeded super admin user:', adminUser);
  console.log('Seeded additional users:', users);
  console.log('Seeded projects:', proj1, proj2, proj3);
  console.log('Seeded statuses:', statuses);
  console.log(`Seeded ${ticketsData.length} tickets`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });