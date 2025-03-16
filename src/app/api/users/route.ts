import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { requirePermission } from '@/middleware/roleCheck';

// Get all users
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view users
    const authResult = await requirePermission('view', '/api/users')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role_id: true,
        role: true, // Include the role relationship
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Create a new user
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create users
    const authResult = await requirePermission('create', '/api/users')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const body = await request.json();
    const { username, email, password, role_id } = body;
    
    // Validate required fields
    if (!username || !email || !password || !role_id) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'Username or email already exists' },
        { status: 400 }
      );
    }
    
    // Check if role exists
    const role = await prisma.roles.findUnique({
      where: { id: role_id },
    });
    
    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const newUser = await prisma.users.create({
      data: {
        username,
        email,
        password_hash,
        role_id,
      },
      include: {
        role: true, // Include the role in the response
      },
    });
    
    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = newUser;
    
    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'user',
        entity_id: newUser.id,
        action: 'create_user',
      }
    });
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Error creating user' },
      { status: 500 }
    );
  }
}
