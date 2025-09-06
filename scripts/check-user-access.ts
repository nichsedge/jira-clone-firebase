import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== User Access Check ===');
  
  try {
    // Check all users and their project relationships
    
    const users = await prisma.user.findMany({
      include: {
        projects: {
          include: {
            tickets: true,
            members: true
          }
        }
      }
    });
    
    console.log('\nAll Users and their project access:');
    
    for (const user of users) {
      console.log(`\nUser: ${user.name || user.email} (ID: ${user.id})`);
      console.log(`  Owned Projects (${user.projects.length}):`);
      user.projects.forEach((project) => {
        console.log(`    - ${project.name} (ID: ${project.id}) - ${project.tickets.length} tickets`);
        console.log(`      Members: ${project.members.map(m => m.name || m.email).join(', ')}`);
      });
      
      // Check member projects (projects where user is member but not owner)
      const memberProjects = await prisma.project.findMany({
        where: {
          members: {
            some: {
              id: user.id
            }
          },
          ownerId: {
            not: user.id
          }
        },
        include: {
          tickets: true
        }
      });
      
      if (memberProjects.length > 0) {
        console.log(`  Member Projects (${memberProjects.length}):`);
        memberProjects.forEach((project) => {
          console.log(`    - ${project.name} (ID: ${project.id}) - ${project.tickets.length} tickets`);
        });
      }
    }
    
    // Check total tickets distribution
    const allTickets = await prisma.ticket.findMany({
      include: {
        project: {
          include: {
            owner: true,
            members: true
          }
        }
      }
    });
    
    console.log(`\n=== Tickets Distribution ===`);
    console.log(`Total tickets: ${allTickets.length}`);
    allTickets.forEach((ticket) => {
      console.log(`Ticket "${ticket.title}" (ID: ${ticket.id}) in project "${ticket.project.name}" owned by ${ticket.project.owner.name || ticket.project.owner.email}`);
    });
    
  } catch (error) {
    console.error('Error checking user access:', error);
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