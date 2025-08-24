import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Temporary in-memory storage until database is working
let users: any[] = [];

// Schema validation
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  avatarUrl: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  avatarUrl: z.string().optional(),
});

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = createUserSchema.parse(body);

    // Check if user with this email already exists
    const existingUser = users.find(user => user.email === validatedData.email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const newUser = {
      id: `USER-${Math.floor(1000 + Math.random() * 9000)}`,
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(newUser);

    return NextResponse.json({
      success: true,
      data: newUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}