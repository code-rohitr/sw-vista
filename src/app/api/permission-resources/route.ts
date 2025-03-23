import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

/**
 * GET /api/permission-resources
 * Get all permission-resource relationships or filter by permission ID
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view permission resources
    const authResult = await requirePermission('view', '/api/permission-resources')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get query parameters
    const url = new URL(request.url);
    const permissionId = url.searchParams.get('permissionId');

    // Build query
    const query: any = {
      include: {
        permission: true,
        resource: true,
      },
    };

    // Add permission filter if provided
    if (permissionId) {
      query.where = {
        permission_id: parseInt(permissionId),
      };
    }

    // Get permission resources
    const permissionResources = await prisma.permissionResources.findMany(query);

    return NextResponse.json(permissionResources);
  } catch (error) {
    console.error('Error fetching permission resources:', error);
    return NextResponse.json(
      { message: 'Error fetching permission resources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/permission-resources
 * Create a new permission-resource relationship
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create permission resources
    const authResult = await requirePermission('create', '/api/permission-resources')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get request body
    const body = await request.json();
    const { permission_id, resource_id } = body;

    // Validate required fields
    if (!permission_id || !resource_id) {
      return NextResponse.json(
        { message: 'Permission ID and resource ID are required' },
        { status: 400 }
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

    // Check if permission-resource relationship already exists
    const existingPermissionResource = await prisma.permissionResources.findUnique({
      where: {
        permission_id_resource_id: {
          permission_id,
          resource_id,
        },
      },
    });

    if (existingPermissionResource) {
      return NextResponse.json(
        { message: 'Permission-resource relationship already exists' },
        { status: 400 }
      );
    }

    // Create permission-resource relationship
    const permissionResource = await prisma.permissionResources.create({
      data: {
        permission_id,
        resource_id,
      },
      include: {
        permission: true,
        resource: true,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'permission_resource',
        entity_id: permissionResource.id,
        action: 'create_permission_resource',
      },
    });

    return NextResponse.json(permissionResource, { status: 201 });
  } catch (error) {
    console.error('Error creating permission resource:', error);
    return NextResponse.json(
      { message: 'Error creating permission resource' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/permission-resources
 * Delete a permission-resource relationship
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check if user has permission to delete permission resources
    const authResult = await requirePermission('delete', '/api/permission-resources')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get query parameters
    const url = new URL(request.url);
    const permissionId = url.searchParams.get('permissionId');
    const resourceId = url.searchParams.get('resourceId');

    // Validate required parameters
    if (!permissionId || !resourceId) {
      return NextResponse.json(
        { message: 'Permission ID and resource ID are required' },
        { status: 400 }
      );
    }

    // Check if permission-resource relationship exists
    const permissionResource = await prisma.permissionResources.findUnique({
      where: {
        permission_id_resource_id: {
          permission_id: parseInt(permissionId),
          resource_id: parseInt(resourceId),
        },
      },
    });

    if (!permissionResource) {
      return NextResponse.json(
        { message: 'Permission-resource relationship not found' },
        { status: 404 }
      );
    }

    // Delete permission-resource relationship
    await prisma.permissionResources.delete({
      where: {
        id: permissionResource.id,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'permission_resource',
        entity_id: permissionResource.id,
        action: 'delete_permission_resource',
      },
    });

    return NextResponse.json({ message: 'Permission-resource relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting permission resource:', error);
    return NextResponse.json(
      { message: 'Error deleting permission resource' },
      { status: 500 }
    );
  }
}
