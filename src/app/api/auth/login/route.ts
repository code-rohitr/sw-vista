import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCredentials } from '@/lib/auth';
import { generateToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

interface EntityRolePermission {
  permission: {
    name: string;
  };
  resource: {
    name: string;
  };
}

interface EntityRole {
  id: string;
  name: string;
  entityRolePermissions: EntityRolePermission[];
}

interface Entity {
  id: string;
  name: string;
  entityType: {
    id: string;
    name: string;
  };
}

interface EntityMembership {
  id: string;
  entity: Entity;
  entityRole: EntityRole;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Verify credentials using the auth utility
    const user = await verifyCredentials(username, password);

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate JWT token with admin status
    const token = generateToken({
      id: user.id,
      username: user.username,
      isSystemAdmin: user.isSystemAdmin
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'auth',
        action: 'LOGIN',
        details: { username: user.username }
      }
    });

    // Create the response
    const response = NextResponse.json({ 
      user: {
        ...user,
        isSystemAdmin: user.isSystemAdmin
      }, 
      token 
    });

    // Set the token as a cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
