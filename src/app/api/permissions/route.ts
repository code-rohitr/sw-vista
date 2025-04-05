import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

// Get all permissions
export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await prisma.permissions.findMany();

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// Create a new permission
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create permissions
    await requirePermission(user.id, 'create', 'permissions');

    const body = await request.json();
    const { name, action } = body;

    if (!name || !action) {
      return NextResponse.json(
        { message: 'Name and action are required' },
        { status: 400 }
      );
    }

    const permission = await prisma.permissions.create({
      data: {
        name,
        action,
      },
    });

    // Log the action
    await prisma.auditLogs.create({
      data: {
        user_id: user.id,
        entity_type: 'permissions',
        action: 'create',
        details: {
          permission_id: permission.id,
          name: permission.name,
          action: permission.action,
        },
      },
    });

    return NextResponse.json(permission);
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { message: 'Failed to create permission' },
      { status: 500 }
    );
  }
}

// Update a permission
export async function PATCH(request: NextRequest) {
  try {
    // Check if user has permission to manage permissions
    const authResult = await requirePermission('manage', '/api/permissions')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get the current user from the auth result
    const userId = authResult.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const { id, name, action, scope, resourceId } = await request.json();

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      );
    }

    // Check if permission exists
    const existingPermission = await prisma.permissions.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // If name is being updated, check if it already exists
    if (name && name !== existingPermission.name) {
      const nameExists = await prisma.permissions.findUnique({
        where: { name },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: `Permission with name '${name}' already exists` },
          { status: 400 }
        );
      }
    }

    // Update permission
    try {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (action) updateData.action = action;
      if (scope) updateData.scope = scope;

      const updatedPermission = await prisma.permissions.update({
        where: { id },
        data: updateData,
        include: {
          permissionResources: {
            include: {
              resource: true,
            },
          },
        },
      });

      // If resourceId is provided, update the resource
      if (resourceId) {
        // Delete existing resource connections
        await prisma.permissionResources.deleteMany({
          where: { permission_id: id },
        });

        // Create new resource connection
        await prisma.permissionResources.create({
          data: {
            permission_id: id,
            resource_id: resourceId,
          },
        });
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity_type: 'PERMISSION',
          user_id: userId,
          details: { 
            permission_id: id,
            name: name,
            action: action,
            scope: scope
          },
        },
      });

      return NextResponse.json(updatedPermission);
    } catch (error) {
      console.error('Error updating permission:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json(
          { error: `Permission with name '${name}' already exists` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update permission' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}

// Delete a permission
export async function DELETE(request: NextRequest) {
  try {
    // Check if user has permission to manage permissions
    const authResult = await requirePermission('manage', '/api/permissions')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get the current user from the auth result
    const userId = authResult.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Get permission ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      );
    }

    // Check if permission exists
    const existingPermission = await prisma.permissions.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Delete permission
    try {
      // First delete all related permission resources
      await prisma.permissionResources.deleteMany({
        where: { permission_id: id },
      });

      // Then delete the permission
      await prisma.permissions.delete({
        where: { id },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entity_type: 'PERMISSION',
          user_id: userId,
          details: { 
            permission_id: id,
            name: existingPermission.name,
            action: existingPermission.action,
            scope: existingPermission.scope
          },
        },
      });

      return NextResponse.json({ message: 'Permission deleted successfully' });
    } catch (error) {
      console.error('Error deleting permission:', error);
      return NextResponse.json(
        { error: 'Failed to delete permission' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
} 