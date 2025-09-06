import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Database Contents ===');
  
  try {
    // Check statuses using raw SQL
    const statusCount: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "statuses"`;
    console.log('\nStatuses count:', statusCount[0].count || 0);
    
    // Check tickets using raw SQL
    const ticketCount: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "tickets"`;
    console.log('\nTickets count:', ticketCount[0].count || 0);
    
    // Check projects using raw SQL
    const projectCount: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "projects"`;
    console.log('\nProjects count:', projectCount[0].count || 0);
    
    // Check users using raw SQL
    const userCount: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "users"`;
    console.log('\nUsers count:', userCount[0].count || 0);
    
  } catch (error) {
    console.error('Database query error:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });