import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

// Get permissions for a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to view role permissions
    const authResult = await requirePermission('view', '/api/roles')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const id = parseInt(params.id);
    
    // Check if role exists
    const role = await prisma.roles.findUnique({
      where: { id },
    });
    
    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Get role permissions with permission and resource details
    const rolePermissions = await prisma.rolePermissions.findMany({
      where: { role_id: id },
      include: {
        permission: true,
        resource: true,
      },
    });
    
    return NextResponse.json(rolePermissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json(
      { message: 'Error fetching role permissions' },
      { status: 500 }
    );
  }
}

// Add a permission to a role for a specific resource
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to update roles
    const authResult = await requirePermission('update', '/api/roles')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const roleId = parseInt(params.id);
    const body = await request.json();
    const { permission_id, resource_id } = body;
    
    // Validate required fields
    if (!permission_id || !resource_id) {
      return NextResponse.json(
        { message: 'Permission ID and resource ID are required' },
        { status: 400 }
      );
    }
    
    // Check if role exists
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
    });
    
    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
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
    
    // Check if role permission already exists
    const existingRolePermission = await prisma.rolePermissions.findUnique({
      where: {
        role_id_permission_id_resource_id: {
          role_id: roleId,
          permission_id,
          resource_id,
        },
      },
    });
    
    if (existingRolePermission) {
      return NextResponse.json(
        { message: 'Role permission already exists' },
        { status: 400 }
      );
    }
    
    // Create role permission
    const rolePermission = await prisma.rolePermissions.create({
      data: {
        role_id: roleId,
        permission_id,
        resource_id,
      },
      include: {
        permission: true,
        resource: true,
      },
    });
    
    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'role_permission',
        entity_id: rolePermission.id,
        action: 'create_role_permission',
      }
    });
    
    return NextResponse.json(rolePermission, { status: 201 });
  } catch (error) {
    console.error('Error adding role permission:', error);
    return NextResponse.json(
      { message: 'Error adding role permission' },
      { status: 500 }
    );
  }
}

// Remove a permission from a role for a specific resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to update roles
    const authResult = await requirePermission('update', '/api/roles')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const roleId = parseInt(params.id);
    
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
    
    // Check if role permission exists
    const rolePermission = await prisma.rolePermissions.findUnique({
      where: {
        role_id_permission_id_resource_id: {
          role_id: roleId,
          permission_id: parseInt(permissionId),
          resource_id: parseInt(resourceId),
        },
      },
    });
    
    if (!rolePermission) {
      return NextResponse.json(
        { message: 'Role permission not found' },
        { status: 404 }
      );
    }
    
    // Delete role permission
    await prisma.rolePermissions.delete({
      where: {
        id: rolePermission.id,
      },
    });
    
    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'role_permission',
        entity_id: rolePermission.id,
        action: 'delete_role_permission',
      }
    });
    
    return NextResponse.json({ message: 'Role permission deleted successfully' });
  } catch (error) {
    console.error('Error removing role permission:', error);
    return NextResponse.json(
      { message: 'Error removing role permission' },
      { status: 500 }
    );
  }
}
