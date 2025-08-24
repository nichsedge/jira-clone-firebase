import { NextRequest, NextResponse } from 'next/server';
import { migrateFromLocalStorage, clearLocalStorage } from '@/lib/migrate-localStorage';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting data migration from localStorage to database...');

    // Run the migration
    const result = await migrateFromLocalStorage();

    // Only clear localStorage if migration was successful with no critical errors
    const hasCriticalErrors = result.errors.some(error =>
      error.includes('Migration failed') ||
      error.includes('No users found') ||
      error.includes('Missing references')
    );

    if (!hasCriticalErrors && (result.ticketsMigrated > 0 || result.usersMigrated > 0 || result.projectsMigrated > 0)) {
      // Clear localStorage after successful migration
      clearLocalStorage();
    }

    const success = result.errors.length === 0 ||
      (result.ticketsMigrated > 0 || result.usersMigrated > 0 || result.projectsMigrated > 0);

    return NextResponse.json({
      success,
      data: result,
      message: success
        ? `Migration completed! Migrated ${result.ticketsMigrated} tickets, ${result.usersMigrated} users, and ${result.projectsMigrated} projects.`
        : 'Migration completed with some issues.',
      warnings: result.errors.length > 0 ? result.errors : undefined,
    });

  } catch (error) {
    console.error('❌ Migration endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check migration status
export async function GET() {
  try {
    // Check if there's data in localStorage that needs migration
    let hasLocalStorageData = false;
    let localStorageInfo = {
      tickets: 0,
      users: 0,
      projects: 0,
    };

    if (typeof window !== 'undefined') {
      const tickets = localStorage.getItem('proflow-tickets');
      const users = localStorage.getItem('proflow-users');
      const projects = localStorage.getItem('proflow-projects');

      if (tickets) {
        localStorageInfo.tickets = JSON.parse(tickets).length;
      }
      if (users) {
        localStorageInfo.users = JSON.parse(users).length;
      }
      if (projects) {
        localStorageInfo.projects = JSON.parse(projects).length;
      }

      hasLocalStorageData = localStorageInfo.tickets > 0 || localStorageInfo.users > 0 || localStorageInfo.projects > 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        hasLocalStorageData,
        localStorageInfo,
        message: hasLocalStorageData
          ? `Found ${localStorageInfo.tickets} tickets, ${localStorageInfo.users} users, and ${localStorageInfo.projects} projects in localStorage that can be migrated.`
          : 'No localStorage data found to migrate.',
      },
    });

  } catch (error) {
    console.error('❌ Migration status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check migration status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}