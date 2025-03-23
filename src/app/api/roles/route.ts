import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

// GET all roles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    
    // If entityId is provided, fetch entity roles for that entity
    if (entityId) {
      const entityRoles = await prisma.entityRoles.findMany({
        where: { entity_id: parseInt(entityId) },
        include: {
          entity: true,
          entityType: true,
        },
      });
      
      return NextResponse.json(entityRoles);
    } else {
      // Otherwise, fetch all system roles
      const roles = await prisma.roles.findMany({
        include: {
          rolePermissions: true
        },
      });
      
      return NextResponse.json(roles);
    }
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
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
