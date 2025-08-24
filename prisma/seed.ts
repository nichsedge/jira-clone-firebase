import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice.johnson.demo@example.com' },
    update: {},
    create: {
      email: 'alice.johnson.demo@example.com',
      name: 'Alice Johnson',
      avatarUrl: 'https://placehold.co/32x32/E9D5FF/6D28D9/png?text=A',
      role: 'USER',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob.williams.demo@example.com' },
    update: {},
    create: {
      email: 'bob.williams.demo@example.com',
      name: 'Bob Williams',
      avatarUrl: 'https://placehold.co/32x32/D1FAE5/065F46/png?text=B',
      role: 'USER',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'charlie.brown.demo@example.com' },
    update: {},
    create: {
      email: 'charlie.brown.demo@example.com',
      name: 'Charlie Brown',
      avatarUrl: 'https://placehold.co/32x32/FDE68A/F59E0B/png?text=C',
      role: 'ADMIN',
    },
  });

  console.log('✅ Users created:', user1.name, user2.name, user3.name);

  // Create projects
  const project1 = await prisma.project.upsert({
    where: { id: 'PROJ-1' },
    update: {},
    create: {
      id: 'PROJ-1',
      name: 'ProFlow App',
      description: 'The main application development project.',
      ownerId: user1.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'PROJ-2' },
    update: {},
    create: {
      id: 'PROJ-2',
      name: 'Marketing Website',
      description: 'Project for the new marketing website.',
      ownerId: user2.id,
    },
  });

  console.log('✅ Projects created:', project1.name, project2.name);

  // Create ticket statuses
  const statusTodo = await prisma.ticketStatus.upsert({
    where: { name: 'To Do' },
    update: {},
    create: {
      name: 'To Do',
      color: '#f59e0b',
      order: 1,
    },
  });

  const statusInProgress = await prisma.ticketStatus.upsert({
    where: { name: 'In Progress' },
    update: {},
    create: {
      name: 'In Progress',
      color: '#3b82f6',
      order: 2,
    },
  });

  const statusDone = await prisma.ticketStatus.upsert({
    where: { name: 'Done' },
    update: {},
    create: {
      name: 'Done',
      color: '#10b981',
      order: 3,
    },
  });

  console.log('✅ Ticket statuses created');

  // Create ticket priorities
  const priorityLow = await prisma.ticketPriority.upsert({
    where: { name: 'Low' },
    update: {},
    create: {
      name: 'Low',
      level: 1,
      color: '#6b7280',
    },
  });

  const priorityMedium = await prisma.ticketPriority.upsert({
    where: { name: 'Medium' },
    update: {},
    create: {
      name: 'Medium',
      level: 2,
      color: '#f59e0b',
    },
  });

  const priorityHigh = await prisma.ticketPriority.upsert({
    where: { name: 'High' },
    update: {},
    create: {
      name: 'High',
      level: 3,
      color: '#ef4444',
    },
  });

  console.log('✅ Ticket priorities created');

  // Create sample tickets
  const ticket1 = await prisma.ticket.upsert({
    where: { id: 'TICKET-8782' },
    update: {},
    create: {
      id: 'TICKET-8782',
      title: 'UI bug on login page',
      description: 'The login button is misaligned on mobile devices, making it difficult to click.',
      category: 'UI/UX',
      statusId: statusTodo.id,
      priorityId: priorityHigh.id,
      projectId: project1.id,
      reporterId: user2.id,
      assigneeId: user1.id,
    },
  });

  const ticket2 = await prisma.ticket.upsert({
    where: { id: 'TICKET-5214' },
    update: {},
    create: {
      id: 'TICKET-5214',
      title: 'API endpoint for user data is slow',
      description: 'The /api/users endpoint is taking over 2 seconds to respond, impacting performance.',
      category: 'Backend',
      statusId: statusInProgress.id,
      priorityId: priorityHigh.id,
      projectId: project1.id,
      reporterId: user1.id,
      assigneeId: user2.id,
    },
  });

  const ticket3 = await prisma.ticket.upsert({
    where: { id: 'TICKET-1234' },
    update: {},
    create: {
      id: 'TICKET-1234',
      title: 'Add dark mode toggle',
      description: 'Implement a dark mode toggle in the header that persists user preference.',
      category: 'Frontend',
      statusId: statusTodo.id,
      priorityId: priorityMedium.id,
      projectId: project1.id,
      reporterId: user3.id,
      assigneeId: user1.id,
    },
  });

  console.log('✅ Sample tickets created');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });