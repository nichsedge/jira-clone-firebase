import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Temporary in-memory storage until database is working
let projects: any[] = [];

// Schema validation
const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
});

// GET /api/projects - Get all projects
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = createProjectSchema.parse(body);

    const newProject = {
      id: `PROJ-${Math.floor(1000 + Math.random() * 9000)}`,
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    projects.push(newProject);

    return NextResponse.json({
      success: true,
      data: newProject,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}