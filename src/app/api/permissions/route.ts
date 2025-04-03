import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { verifyToken } from '@/lib/jwt';
import { Prisma } from '@prisma/client';

// Get all permissions
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view permissions
    const authResult = await requirePermission('view', '/api/permissions')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Fetch all permissions with their resources
    const permissions = await prisma.permissions.findMany({
      include: {
        permissionResources: {
          include: {
            resource: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to match the expected format
    const transformedPermissions = permissions.map(permission => ({
      id: permission.id,
      name: permission.name,
      action: permission.action,
      scope: permission.scope,
      resource: permission.permissionResources[0]?.resource || null,
    }));

    return NextResponse.json(transformedPermissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// Create a new permission
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create permissions
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

    const { name, action, scope, resourceId } = await request.json();

    // Validate required fields
    if (!name || !action || !scope || !resourceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if permission with this name already exists
    const existingPermission = await prisma.permissions.findUnique({
      where: { name },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: `Permission with name '${name}' already exists` },
        { status: 400 }
      );
    }

    // Create permission
    try {
      const newPermission = await prisma.permissions.create({
        data: {
          name,
          action,
          scope,
          creator: {
            connect: {
              id: userId,
            },
          },
          permissionResources: {
            create: {
              resource: {
                connect: {
                  id: resourceId,
                },
              },
            },
          },
        },
        include: {
          permissionResources: {
            include: {
              resource: true,
            },
          },
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity_type: 'PERMISSION',
          user_id: userId,
          details: { 
            permission_id: newPermission.id,
            name: name,
            action: action,
            scope: scope
          },
        },
      });

      return NextResponse.json(newPermission);
    } catch (error) {
      console.error('Error creating permission:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json(
          { error: `Permission with name '${name}' already exists` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create permission' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Failed to create permission' },
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