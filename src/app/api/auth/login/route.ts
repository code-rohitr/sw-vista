import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCredentials, generateToken, getRolePermissions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Verify credentials using the auth utility
    const user = await verifyCredentials(username, password);

    if (!user) {
      // We don't know which user failed, so we can't log it specifically
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Get the user's role permissions
    const rolePermissions = await getRolePermissions(user.role_id);

    // Generate JWT token with user ID, username, and role ID
    const token = generateToken({
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      role_name: user.role.name,
    });

    // Log successful login
    await prisma.auditLogs.create({
      data: {
        user_id: user.id,
        entity_type: 'auth',
        entity_id: user.id,
        action: 'LOGIN',
      },
    });

    // Extract basic permissions for the frontend
    const basicPermissions = rolePermissions.reduce((acc, rp) => {
      const resourceName = rp.resource.name;
      const permissionName = rp.permission.name;
      
      if (!acc[resourceName]) {
        acc[resourceName] = [];
      }
      
      acc[resourceName].push(permissionName);
      return acc;
    }, {} as Record<string, string[]>);

    // Return user data, token, and basic permissions
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        role_id: user.role_id,
      },
      permissions: basicPermissions,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
