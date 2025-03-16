import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/middleware/roleCheck';

// Get all permissions
export async function GET(request: NextRequest) {
  try {
    const roles = await prisma.userRoles.findMany();
    
    // Extract unique permissions from all roles
    const allPermissions = new Set<string>();
    roles.forEach(role => {
      role.permissions.forEach(permission => {
        allPermissions.add(permission);
      });
    });
    
    return NextResponse.json(Array.from(allPermissions));
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { message: 'Error fetching permissions' },
      { status: 500 }
    );
  }
}

// Add a permission to a role
export async function POST(request: NextRequest) {
  try {
    // Check if user has godmode role
    const authResult = await requireRole('godmode')(request);
    
    // Check if the result is a NextResponse (error case)
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const body = await request.json();
    const { role_id, permission } = body;
    
    // Validate required fields
    if (!role_id || !permission) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if role exists
    const role = await prisma.userRoles.findUnique({
      where: { id: parseInt(role_id) },
    });
    
    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Check if permission already exists in the role
    if (role.permissions.includes(permission)) {
      return NextResponse.json(
        { message: 'Permission already exists in this role' },
        { status: 400 }
      );
    }
    
    // Add permission to role
    const updatedRole = await prisma.userRoles.update({
      where: { id: parseInt(role_id) },
      data: {
        permissions: {
          set: [...role.permissions, permission],
        },
      },
    });
    
    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'role',
        entity_id: role.id,
        action: 'add_permission',
      }
    });
    
    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error('Error adding permission:', error);
    return NextResponse.json(
      { message: 'Error adding permission' },
      { status: 500 }
    );
  }
}