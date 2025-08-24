// Utility to migrate data from localStorage to database
import { prisma } from './prisma';
import { initialTickets, initialProjects, allUsers } from '@/data/tickets';

const TICKETS_STORAGE_KEY = 'proflow-tickets';
const USERS_STORAGE_KEY = 'proflow-users';
const PROJECTS_STORAGE_KEY = 'proflow-projects';

export interface MigrationResult {
  ticketsMigrated: number;
  usersMigrated: number;
  projectsMigrated: number;
  errors: string[];
}

export async function migrateFromLocalStorage(): Promise<MigrationResult> {
  const result: MigrationResult = {
    ticketsMigrated: 0,
    usersMigrated: 0,
    projectsMigrated: 0,
    errors: [],
  };

  try {
    // Only run migration if we're in a browser environment
    if (typeof window === 'undefined') {
      result.errors.push('Migration must be run in browser environment');
      return result;
    }

    console.log('🔄 Starting localStorage migration...');

    // Migrate users
    await migrateUsers(result);

    // Migrate projects
    await migrateProjects(result);

    // Migrate tickets (depends on users and projects)
    await migrateTickets(result);

    console.log('✅ Migration completed:', result);
    return result;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

async function migrateUsers(result: MigrationResult) {
  try {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    let usersToMigrate = [];

    if (storedUsers) {
      usersToMigrate = JSON.parse(storedUsers);
    } else {
      // Use initial users if no stored data
      usersToMigrate = allUsers;
    }

    for (const user of usersToMigrate) {
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            avatarUrl: user.avatarUrl,
          },
          create: {
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role || 'USER',
          },
        });
        result.usersMigrated++;
      } catch (error) {
        result.errors.push(`Failed to migrate user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ Migrated ${result.usersMigrated} users`);
  } catch (error) {
    result.errors.push(`User migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function migrateProjects(result: MigrationResult) {
  try {
    const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    let projectsToMigrate = [];

    if (storedProjects) {
      projectsToMigrate = JSON.parse(storedProjects);
    } else {
      // Use initial projects if no stored data
      projectsToMigrate = initialProjects;
    }

    for (const project of projectsToMigrate) {
      try {
        // Find the project owner (first user in database)
        const owner = await prisma.user.findFirst({
          orderBy: { createdAt: 'asc' }
        });

        if (!owner) {
          result.errors.push(`No users found for project ${project.name}`);
          continue;
        }

        await prisma.project.upsert({
          where: { id: project.id },
          update: {
            name: project.name,
            description: project.description,
          },
          create: {
            id: project.id,
            name: project.name,
            description: project.description,
            ownerId: owner.id,
          },
        });
        result.projectsMigrated++;
      } catch (error) {
        result.errors.push(`Failed to migrate project ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ Migrated ${result.projectsMigrated} projects`);
  } catch (error) {
    result.errors.push(`Project migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function migrateTickets(result: MigrationResult) {
  try {
    const storedTickets = localStorage.getItem(TICKETS_STORAGE_KEY);
    let ticketsToMigrate = [];

    if (storedTickets) {
      ticketsToMigrate = JSON.parse(storedTickets).map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
    } else {
      // Use initial tickets if no stored data
      ticketsToMigrate = initialTickets;
    }

    // Get database references
    const users = await prisma.user.findMany();
    const projects = await prisma.project.findMany();
    const statuses = await prisma.ticketStatus.findMany();
    const priorities = await prisma.ticketPriority.findMany();

    const userMap = new Map(users.map(u => [u.email, u]));
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const statusMap = new Map(statuses.map(s => [s.name, s]));
    const priorityMap = new Map(priorities.map(p => [p.name, p]));

    for (const ticket of ticketsToMigrate) {
      try {
        // Find reporter
        let reporter = userMap.get(ticket.reporter.email);
        if (!reporter && users.length > 0) {
          reporter = users[0]; // Default to first user
        }

        // Find assignee
        let assignee = null;
        if (ticket.assignee) {
          assignee = userMap.get(ticket.assignee.email);
        }

        // Find project
        let project = projectMap.get(ticket.projectId);
        if (!project && projects.length > 0) {
          project = projects[0]; // Default to first project
        }

        // Find status
        let status = statusMap.get(ticket.status);
        if (!status && statuses.length > 0) {
          status = statuses[0]; // Default to first status
        }

        // Find priority
        let priority = priorityMap.get(ticket.priority);
        if (!priority && priorities.length > 0) {
          priority = priorities[0]; // Default to first priority
        }

        if (!reporter || !project || !status || !priority) {
          result.errors.push(`Missing references for ticket ${ticket.id}`);
          continue;
        }

        await prisma.ticket.upsert({
          where: { id: ticket.id },
          update: {
            title: ticket.title,
            description: ticket.description,
            category: ticket.category,
            statusId: status.id,
            priorityId: priority.id,
            projectId: project.id,
            reporterId: reporter.id,
            assigneeId: assignee?.id || null,
          },
          create: {
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            category: ticket.category,
            statusId: status.id,
            priorityId: priority.id,
            projectId: project.id,
            reporterId: reporter.id,
            assigneeId: assignee?.id || null,
          },
        });

        result.ticketsMigrated++;
      } catch (error) {
        result.errors.push(`Failed to migrate ticket ${ticket.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ Migrated ${result.ticketsMigrated} tickets`);
  } catch (error) {
    result.errors.push(`Ticket migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Clear localStorage after successful migration
export function clearLocalStorage() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TICKETS_STORAGE_KEY);
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    console.log('🧹 Cleared localStorage after migration');
  }
}