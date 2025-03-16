import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/middleware/roleCheck';

// Get a specific role by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    const role = await prisma.userRoles.findUnique({
      where: { id },
    });
    
    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { message: 'Error fetching role' },
      { status: 500 }
    );
  }
}

// Update a role
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
    const { role_name, permissions } = body;
    
    // Check if role exists
    const existingRole = await prisma.userRoles.findUnique({
      where: { id },
    });
    
    if (!existingRole) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Update role
    const updatedRole = await prisma.userRoles.update({
      where: { id },
      data: {
        role_name: role_name || existingRole.role_name,
        permissions: permissions || existingRole.permissions,
      },
    });
    
    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'role',
        entity_id: id,
        action: 'update_role',
      }
    });
    
    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { message: 'Error updating role' },
      { status: 500 }
    );
  }
}

// Delete a role
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
    
    // Check if role exists
    const existingRole = await prisma.userRoles.findUnique({
      where: { id },
    });
    
    if (!existingRole) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Delete role
    await prisma.userRoles.delete({
      where: { id },
    });
    
    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'role',
        entity_id: id,
        action: 'delete_role',
      }
    });
    
    return NextResponse.json(
      { message: 'Role deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { message: 'Error deleting role' },
      { status: 500 }
    );
  }
}