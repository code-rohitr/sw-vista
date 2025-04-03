import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { hasEntityAccess } from '@/lib/auth';

// GET /api/entities/[id]/roles/[roleId] - Get a specific role for an entity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; roleId: string } }
) {
  try {
    const entityId = parseInt(params.id);
    const roleId = parseInt(params.roleId);

    if (isNaN(entityId) || isNaN(roleId)) {
      return NextResponse.json(
        { message: 'Invalid entity ID or role ID' },
        { status: 400 }
      );
    }

    // Check if user has permission to view entity roles
    const authResult = await requirePermission('view', '/api/entities/roles', 'id')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Check if user has access to this entity
    const hasAccess = await hasEntityAccess(authResult.user.id, entityId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to view roles of this entity' },
        { status: 403 }
      );
    }

    // Get the specific role
    const role = await prisma.entityRoles.findFirst({
      where: {
        entity_id: entityId,
        id: roleId,
      },
      include: {
        template: true,
        entityRolePermissions: {
          include: {
            permission: true,
            resource: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching entity role:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity role' },
      { status: 500 }
    );
  }
}

// PUT /api/entities/[id]/roles/[roleId] - Update a role for an entity
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; roleId: string } }
) {
  try {
    const entityId = parseInt(params.id);
    const roleId = parseInt(params.roleId);

    if (isNaN(entityId) || isNaN(roleId)) {
      return NextResponse.json(
        { message: 'Invalid entity ID or role ID' },
        { status: 400 }
      );
    }

    // Check if user has permission to manage entity roles
    const authResult = await requirePermission('manage', '/api/entities/roles', 'id')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Check if user has access to this entity
    const hasAccess = await hasEntityAccess(authResult.user.id, entityId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to manage roles of this entity' },
        { status: 403 }
      );
    }

    // Get request body
    const { name, description, template_id, permissions } = await request.json();

    // Validate input
    if (!name || !template_id) {
      return NextResponse.json(
        { message: 'Role name and template ID are required' },
        { status: 400 }
      );
    }

    // Check if template exists
    const template = await prisma.roleTemplate.findUnique({
      where: { id: template_id },
    });

    if (!template) {
      return NextResponse.json(
        { message: 'Invalid role template' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await prisma.entityRoles.findFirst({
      where: {
        entity_id: entityId,
        id: roleId,
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }

    // Update role
    const role = await prisma.entityRoles.update({
      where: {
        id: roleId,
      },
      data: {
        name,
        description,
        template_id,
      },
      include: {
        template: true,
        entityRolePermissions: {
          include: {
            permission: true,
            resource: true,
          },
        },
      },
    });

    // If permissions are provided, update them
    if (permissions && Array.isArray(permissions)) {
      // Delete existing permissions
      await prisma.entityRolePermissions.deleteMany({
        where: {
          entity_role_id: roleId,
        },
      });

      // Add new permissions
      await Promise.all(
        permissions.map(async (permission) => {
          await prisma.entityRolePermissions.create({
            data: {
              entity_role_id: roleId,
              permission_id: permission.permission_id,
              resource_id: permission.resource_id,
            },
          });
        })
      );
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        entity_id: entityId,
        action: 'update_role',
        details: JSON.stringify({ role_id: roleId, name, template_id, permissions })
      }
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error updating entity role:', error);
    return NextResponse.json(
      { message: 'Failed to update entity role' },
      { status: 500 }
    );
  }
}

// DELETE /api/entities/[id]/roles/[roleId] - Delete a role from an entity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; roleId: string } }
) {
  try {
    const entityId = parseInt(params.id);
    const roleId = parseInt(params.roleId);

    if (isNaN(entityId) || isNaN(roleId)) {
      return NextResponse.json(
        { message: 'Invalid entity ID or role ID' },
        { status: 400 }
      );
    }

    // Check if user has permission to manage entity roles
    const authResult = await requirePermission('manage', '/api/entities/roles', 'id')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Check if user has access to this entity
    const hasAccess = await hasEntityAccess(authResult.user.id, entityId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to manage roles of this entity' },
        { status: 403 }
      );
    }

    // Check if role exists
    const role = await prisma.entityRoles.findFirst({
      where: {
        entity_id: entityId,
        id: roleId,
      },
    });

    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if role has any members
    const members = await prisma.entityMembers.findFirst({
      where: {
        entity_role_id: roleId,
      },
    });

    if (members) {
      return NextResponse.json(
        { message: 'Cannot delete role with active members' },
        { status: 400 }
      );
    }

    // Delete role permissions first
    await prisma.entityRolePermissions.deleteMany({
      where: {
        entity_role_id: roleId,
      },
    });

    // Delete role
    await prisma.entityRoles.delete({
      where: {
        id: roleId,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        entity_id: entityId,
        action: 'delete_role',
        details: JSON.stringify({ role_id: roleId, name: role.name })
      }
    });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity role:', error);
    return NextResponse.json(
      { message: 'Failed to delete entity role' },
      { status: 500 }
    );
  }
} 