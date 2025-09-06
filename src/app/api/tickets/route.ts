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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    console.log(`DEBUG: Request projectId: ${projectId || 'none'}`);

    let whereClause: any = {};
    if (projectId) {
      whereClause.projectId = projectId;
      // Check access to specific project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: session.user.id },
            { members: { some: { id: session.user.id } } }
          ]
        },
      });
      if (!project) {
        console.log(`DEBUG: User ${session.user.id} has no access to project ${projectId}`);
        return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
      }
      console.log(`DEBUG: User has access to project ${projectId}`);
    } else {
      // Fetch all tickets for user's accessible projects
      whereClause.project = {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } }
        ]
      };
      console.log(`DEBUG: whereClause for all projects:`, JSON.stringify(whereClause, null, 2));
    }

    console.log(`DEBUG: Final whereClause:`, JSON.stringify(whereClause, null, 2));

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        project: true,
        assignee: true,
        status: true,
      } as any,
      orderBy: { createdAt: 'desc' },
    });

    console.log(`DEBUG: Found ${tickets.length} tickets for user ${session.user.id}`);
    console.log(`DEBUG: Ticket IDs:`, tickets.map(t => t.id).join(', '));

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, statusId, priority, projectId, assigneeId } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and Project ID are required' }, { status: 400 });
    }

    // Check project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } }
        ]
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        statusId: statusId || null,
        priority: priority || 'MEDIUM',
        projectId,
        assigneeId: assigneeId || null,
      },
      include: {
        project: true,
        assignee: true,
        status: true,
      } as any,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, statusId, priority, assigneeId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check project access
    const project = await prisma.project.findFirst({
      where: {
        id: ticket.projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } }
        ]
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        title,
        description,
        statusId,
        priority,
        assigneeId,
        updatedAt: new Date(),
      },
      include: {
        project: true,
        assignee: true,
        status: true,
      } as any,
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}