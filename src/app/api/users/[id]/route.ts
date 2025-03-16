import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/middleware/roleCheck';
import bcrypt from 'bcrypt';

// Get a specific user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
        // Exclude password_hash for security
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Error fetching user' },
      { status: 500 }
    );
  }
}

// Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has godmode role
    const authResult = await requireRole('godmode')(request);
    if ('isAuthorized' in authResult === false) {
        return authResult;
      }

    const id = parseInt(params.id);
    const body = await request.json();
    const { username, email, password, role } = body;
    
    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    // Hash password if provided
    if (password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }
    
    // Update user
    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
    });
    
    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = updatedUser;
    
    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'user',
        entity_id: id,
        action: 'update_user',
      }
    });
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Error updating user' },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has godmode role
    const authResult = await requireRole('godmode')(request);
    if ('isAuthorized' in authResult === false) {
        return authResult;
      }

    const id = parseInt(params.id);
    
    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Delete user
    await prisma.users.delete({
      where: { id },
    });
    
    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'user',
        entity_id: id,
        action: 'delete_user',
      }
    });
    
    return NextResponse.json(
      { message: 'User deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Error deleting user' },
      { status: 500 }
    );
  }
}