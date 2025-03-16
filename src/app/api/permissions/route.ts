import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

// Get all permissions
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view permissions
    const authResult = await requirePermission('view', '/api/permissions')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const permissions = await prisma.permissions.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { message: 'Error fetching permissions' },
      { status: 500 }
    );
  }
}

// Create a new permission
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create permissions
    const authResult = await requirePermission('create', '/api/permissions')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const body = await request.json();
    const { name, description, action } = body;
    
    // Validate required fields
    if (!name || !action) {
      return NextResponse.json(
        { message: 'Name and action are required' },
        { status: 400 }
      );
    }
    
    // Check if permission already exists
    const existingPermission = await prisma.permissions.findUnique({
      where: { name },
    });
    
    if (existingPermission) {
      return NextResponse.json(
        { message: 'Permission already exists' },
        { status: 400 }
      );
    }
    
    // Create permission
    const newPermission = await prisma.permissions.create({
      data: {
        name,
        description,
        action,
      },
    });
    
    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'permission',
        entity_id: newPermission.id,
        action: 'create_permission',
      }
    });
    
    return NextResponse.json(newPermission, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { message: 'Error creating permission' },
      { status: 500 }
    );
  }
}
