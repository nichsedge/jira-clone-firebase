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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

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
        return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
      }
    } else {
      // Fetch all tickets for user's accessible projects
      whereClause.project = {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { id: session.user.id } } }
        ]
      };
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        project: true,
        assignee: true,
      },
      orderBy: { createdAt: 'desc' },
    });

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
    const { title, description, status, priority, projectId, assigneeId } = body;

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
        status: status || 'OPEN',
        priority: priority || 'MEDIUM',
        projectId,
        assigneeId: assigneeId || null,
      },
      include: {
        project: true,
        assignee: true,
      },
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
    const { id, title, description, status, priority, assigneeId } = body;

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
        status,
        priority,
        assigneeId,
        updatedAt: new Date(),
      },
      include: {
        project: true,
        assignee: true,
      },
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}