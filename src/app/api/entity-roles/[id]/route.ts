import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/entity-roles/[id] - Get a specific entity role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity role ID' },
        { status: 400 }
      );
    }

    // Get entity role
    const entityRole = await prisma.entityRoles.findUnique({
      where: { id },
      include: {
        entityType: true,
        entity: true,
        entityRolePermissions: {
          include: {
            permission: true,
            resource: true,
          },
        },
      },
    });

    if (!entityRole) {
      return NextResponse.json(
        { message: 'Entity role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entityRole);
  } catch (error) {
    console.error('Error fetching entity role:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity role' },
      { status: 500 }
    );
  }
}

// PUT /api/entity-roles/[id] - Update a specific entity role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is System Admin
    if (!user.isSystemAdmin) {
      return NextResponse.json(
        { message: 'Only System Admins can update entity roles' },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity role ID' },
        { status: 400 }
      );
    }

    // Check if entity role exists
    const existingRole = await prisma.entityRoles.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json(
        { message: 'Entity role not found' },
        { status: 404 }
      );
    }

    // Get request body
    const { name, description } = await request.json();

    // Update entity role
    const updatedRole = await prisma.entityRoles.update({
      where: { id },
      data: {
        name: name || existingRole.name,
        description: description !== undefined ? description : existingRole.description,
      },
      include: {
        entityType: true,
        entity: true,
        entityRolePermissions: {
          include: {
            permission: true,
            resource: true,
          },
        },
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'entity_role',
        entity_id: updatedRole.id,
        action: 'update_entity_role',
      },
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error('Error updating entity role:', error);
    return NextResponse.json(
      { message: 'Failed to update entity role' },
      { status: 500 }
    );
  }
}

// DELETE /api/entity-roles/[id] - Delete a specific entity role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is System Admin
    if (!user.isSystemAdmin) {
      return NextResponse.json(
        { message: 'Only System Admins can delete entity roles' },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity role ID' },
        { status: 400 }
      );
    }

    // Check if entity role exists
    const existingRole = await prisma.entityRoles.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json(
        { message: 'Entity role not found' },
        { status: 404 }
      );
    }

    // Delete entity role
    await prisma.entityRoles.delete({
      where: { id }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'entity_role',
        entity_id: id,
        action: 'delete_entity_role',
      },
    });

    return NextResponse.json({ message: 'Entity role deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity role:', error);
    return NextResponse.json(
      { message: 'Failed to delete entity role' },
      { status: 500 }
    );
  }
}
