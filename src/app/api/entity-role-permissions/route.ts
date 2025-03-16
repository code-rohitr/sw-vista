import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

/**
 * GET /api/entity-role-permissions
 * Get all entity role permissions or filter by entity role ID
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view entity role permissions
    const authResult = await requirePermission('view', '/api/entity-role-permissions')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get query parameters
    const url = new URL(request.url);
    const entityRoleId = url.searchParams.get('entityRoleId');

    // Build query
    const query: any = {
      include: {
        entityRole: {
          include: {
            entityType: true,
          },
        },
        permission: true,
        resource: true,
      },
    };

    // Add entity role filter if provided
    if (entityRoleId) {
      query.where = {
        entity_role_id: parseInt(entityRoleId),
      };
    }

    // Get entity role permissions
    const entityRolePermissions = await prisma.entityRolePermissions.findMany(query);

    return NextResponse.json(entityRolePermissions);
  } catch (error) {
    console.error('Error fetching entity role permissions:', error);
    return NextResponse.json(
      { message: 'Error fetching entity role permissions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entity-role-permissions
 * Assign a permission to an entity role for a specific resource
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create entity role permissions
    const authResult = await requirePermission('create', '/api/entity-role-permissions')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get request body
    const body = await request.json();
    const { entity_role_id, permission_id, resource_id } = body;

    // Validate required fields
    if (!entity_role_id || !permission_id || !resource_id) {
      return NextResponse.json(
        { message: 'Entity role ID, permission ID, and resource ID are required' },
        { status: 400 }
      );
    }

    // Check if entity role exists
    const entityRole = await prisma.entityRoles.findUnique({
      where: { id: entity_role_id },
    });

    if (!entityRole) {
      return NextResponse.json(
        { message: 'Entity role not found' },
        { status: 404 }
      );
    }

    // Check if permission exists
    const permission = await prisma.permissions.findUnique({
      where: { id: permission_id },
    });

    if (!permission) {
      return NextResponse.json(
        { message: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if resource exists
    const resource = await prisma.resources.findUnique({
      where: { id: resource_id },
    });

    if (!resource) {
      return NextResponse.json(
        { message: 'Resource not found' },
        { status: 404 }
      );
    }

    // Check if entity role permission already exists
    const existingEntityRolePermission = await prisma.entityRolePermissions.findUnique({
      where: {
        entity_role_id_permission_id_resource_id: {
          entity_role_id,
          permission_id,
          resource_id,
        },
      },
    });

    if (existingEntityRolePermission) {
      return NextResponse.json(
        { message: 'Entity role permission already exists' },
        { status: 400 }
      );
    }

    // Create entity role permission
    const entityRolePermission = await prisma.entityRolePermissions.create({
      data: {
        entity_role_id,
        permission_id,
        resource_id,
      },
    });

    // Log action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity_role_permission',
        entity_id: entityRolePermission.id,
        action: 'create_entity_role_permission',
      },
    });

    return NextResponse.json(entityRolePermission, { status: 201 });
  } catch (error) {
    console.error('Error creating entity role permission:', error);
    return NextResponse.json(
      { message: 'Error creating entity role permission' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/entity-role-permissions
 * Remove a permission from an entity role for a specific resource
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check if user has permission to delete entity role permissions
    const authResult = await requirePermission('delete', '/api/entity-role-permissions')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get query parameters
    const url = new URL(request.url);
    const entityRoleId = url.searchParams.get('entityRoleId');
    const permissionId = url.searchParams.get('permissionId');
    const resourceId = url.searchParams.get('resourceId');

    // Validate required parameters
    if (!entityRoleId || !permissionId || !resourceId) {
      return NextResponse.json(
        { message: 'Entity role ID, permission ID, and resource ID are required' },
        { status: 400 }
      );
    }

    // Check if entity role permission exists
    const entityRolePermission = await prisma.entityRolePermissions.findUnique({
      where: {
        entity_role_id_permission_id_resource_id: {
          entity_role_id: parseInt(entityRoleId),
          permission_id: parseInt(permissionId),
          resource_id: parseInt(resourceId),
        },
      },
    });

    if (!entityRolePermission) {
      return NextResponse.json(
        { message: 'Entity role permission not found' },
        { status: 404 }
      );
    }

    // Delete entity role permission
    await prisma.entityRolePermissions.delete({
      where: {
        id: entityRolePermission.id,
      },
    });

    // Log action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity_role_permission',
        entity_id: entityRolePermission.id,
        action: 'delete_entity_role_permission',
      },
    });

    return NextResponse.json({ message: 'Entity role permission deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity role permission:', error);
    return NextResponse.json(
      { message: 'Error deleting entity role permission' },
      { status: 500 }
    );
  }
}
