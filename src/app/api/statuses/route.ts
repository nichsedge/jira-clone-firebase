import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

const prisma = new PrismaClient();

interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session?.user?.id) {
      console.log('DEBUG: No session or user ID - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`DEBUG: Logged in user: ${session.user.email || session.user.name} (ID: ${session.user.id})`);

    const statuses = await prisma.status.findMany({
      orderBy: { createdAt: 'asc' },
    });

    console.log(`DEBUG: Found ${statuses.length} statuses for user ${session.user.id}`);
    console.log(`DEBUG: Status IDs:`, statuses.map(s => s.id).join(', '));

    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}