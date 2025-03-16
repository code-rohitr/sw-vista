import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/middleware/roleCheck';

// Get all roles
export async function GET(request: NextRequest) {
  try {
    const roles = await prisma.userRoles.findMany();
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
    // Check if user has godmode role
    const authResult = await requireRole('godmode')(request);
    if ('isAuthorized' in authResult === false) {
        return authResult;
      }

    const body = await request.json();
    const { role_name, permissions } = body;
    
    // Validate required fields
    if (!role_name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { message: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }
    
    // Check if role already exists
    const existingRole = await prisma.userRoles.findUnique({
      where: { role_name },
    });
    
    if (existingRole) {
      return NextResponse.json(
        { message: 'Role already exists' },
        { status: 400 }
      );
    }
    
    // Create role
    const newRole = await prisma.userRoles.create({
      data: {
        role_name,
        permissions,
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