import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Create super admin user if not exists
  const adminUser = await prisma.user.upsert({
    where: {
      email: 'admin@example.com',
    },
    update: {},
    create: {
      id: 'ADMIN-1',
      name: 'Super Admin',
      email: 'admin@example.com',
      hashedPassword,
      image: 'https://placehold.co/32x32/E9D5FF/6D28D9/png?text=A',
    },
  });


  // Create projects with admin as owner
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
      ownerId: adminUser.id,
    },
  });

  // Create tickets
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  await prisma.ticket.upsert({
    where: {
      id: 'TICKET-8782',
    },
    update: {},
    create: {
      id: 'TICKET-8782',
      title: 'UI bug on login page',
      description: 'The login button is misaligned on mobile devices, making it difficult to click.',
      status: 'OPEN',
      priority: 'HIGH',
      createdAt: yesterday,
      updatedAt: yesterday,
      assigneeId: adminUser.id,
      projectId: proj1.id,
    },
  });

  await prisma.ticket.upsert({
    where: {
      id: 'TICKET-5214',
    },
    update: {},
    create: {
      id: 'TICKET-5214',
      title: 'API endpoint for user data is slow',
      description: 'The /api/users endpoint is taking over 2 seconds to respond, impacting performance.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      createdAt: threeDaysAgo,
      updatedAt: twoDaysAgo,
      assigneeId: adminUser.id,
      projectId: proj1.id,
    },
  });

  console.log('Seeded super admin user:', adminUser);
  console.log('Seeded projects:', proj1, proj2);
  console.log('Seeded tickets');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });