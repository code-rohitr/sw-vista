import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

// Get all roles
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view roles
    const authResult = await requirePermission('view', '/api/roles')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const roles = await prisma.roles.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { message: 'Error fetching roles' },
      { status: 500 }
    );
  }
}

// Create a new role
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create roles
    const authResult = await requirePermission('create', '/api/roles')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const body = await request.json();
    const { name, description, is_system_role = false } = body;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'Role name is required' },
        { status: 400 }
      );
    }
    
    // Check if role already exists
    const existingRole = await prisma.roles.findUnique({
      where: { name },
    });
    
    if (existingRole) {
      return NextResponse.json(
        { message: 'Role already exists' },
        { status: 400 }
      );
    }
    
    // Create role
    const newRole = await prisma.roles.create({
      data: {
        name,
        description,
        is_system_role,
      },
    });
    
    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'role',
        entity_id: newRole.id,
        action: 'create_role',
      }
    });
    
    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { message: 'Error creating role' },
      { status: 500 }
    );
  }
}
