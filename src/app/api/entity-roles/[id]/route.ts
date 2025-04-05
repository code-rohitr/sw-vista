import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/middleware/roleCheck';

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

// PUT /api/entity-roles/[id] - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to update roles
    const authResult = await requirePermission('update', '/api/entity-roles')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const { name, description, entity_type_id, entityTypeId } = await request.json();
    
    // Use entity_type_id if provided, otherwise fall back to entityTypeId
    const entityTypeIdToUse = entity_type_id || entityTypeId;

    // Validate required fields
    if (!name || !entityTypeIdToUse) {
      return NextResponse.json(
        { message: 'Name and entity type ID are required' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await prisma.entityRoles.findUnique({
      where: { id: params.id }
    });

    if (!existingRole) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if entity type exists
    const entityType = await prisma.entityTypes.findUnique({
      where: { id: entityTypeIdToUse }
    });

    if (!entityType) {
      return NextResponse.json(
        { message: 'Entity type not found' },
        { status: 404 }
      );
    }

    // Update the role
    const role = await prisma.entityRoles.update({
      where: { id: params.id },
      data: {
        name,
        description,
        entity_type_id: entityTypeIdToUse,
      },
      include: {
        entityType: true,
        entityRolePermissions: {
          include: {
            permission: true,
            resource: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entityRole',
        action: 'update',
        details: JSON.stringify({
          id: params.id,
          name,
          description,
          entityTypeId: entityTypeIdToUse,
        }),
      },
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { message: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/entity-roles/[id] - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to delete roles
    const authResult = await requirePermission('delete', '/api/entity-roles')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Check if role exists
    const existingRole = await prisma.entityRoles.findUnique({
      where: { id: params.id },
      include: {
        entityMembers: true,
        entityRolePermissions: true,
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if role has any members
    if (existingRole.entityMembers.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete role with active members' },
        { status: 400 }
      );
    }

    // Delete role permissions first
    await prisma.entityRolePermissions.deleteMany({
      where: { entity_role_id: params.id },
    });

    // Delete the role
    await prisma.entityRoles.delete({
      where: { id: params.id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entityRole',
        action: 'delete',
        details: JSON.stringify({
          id: params.id,
          name: existingRole.name,
        }),
      },
    });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { message: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
