import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@/lib/permissions';

// Schema validation
const updateRoleSchema = z.object({
  role: z.enum([UserRole.USER, UserRole.ADMIN, UserRole.GUEST], {
    errorMap: () => ({ message: 'Invalid role. Must be USER, ADMIN, or GUEST' }),
  }),
});

// PUT /api/users/[id]/role - Update user role
const updateUserRoleHandler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const userId = params.id;
    const body = await request.json();

    const validatedData = updateRoleSchema.parse(body);
    const { role } = validatedData;

    // In a real implementation, you would:
    // 1. Check if the current user has permission to update roles
    // 2. Validate that the user exists
    // 3. Update the user role in the database
    // 4. Log the role change for audit purposes

    // For now, we'll simulate the update
    console.log(`Updating user ${userId} role to ${role}`);

    // TODO: Implement actual database update
    // const updatedUser = await prisma.user.update({
    //   where: { id: userId },
    //   data: { role },
    // });

    // Simulate successful update
    const updatedUser = {
      id: userId,
      role,
      name: 'Updated User', // This would come from the database
      email: 'user@example.com',
    };

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });

  } catch (error) {
    console.error('Error updating user role:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to update user role',
          code: 'UPDATE_FAILED',
        },
      },
      { status: 500 }
    );
  }
};

export const PUT = updateUserRoleHandler;