import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; roleId: string } }
) {
  try {
    // Check if user has permission to manage role permissions
    const authResult = await requirePermission('manage', '/api/entities/roles/permissions', 'id')(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { permissionIds } = await request.json();

    // Verify the role exists and belongs to the entity
    const role = await prisma.entityRoles.findFirst({
      where: {
        id: params.roleId,
        entityId: params.id,
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Delete existing permissions
    await prisma.entityRolePermissions.deleteMany({
      where: {
        entityRoleId: params.roleId,
      },
    });

    // Create new permissions
    if (permissionIds.length > 0) {
      await prisma.entityRolePermissions.createMany({
        data: permissionIds.map((permissionId: string) => ({
          entityRoleId: params.roleId,
          permissionId,
        })),
      });
    }

    // Create audit log entry
    await prisma.auditLogs.create({
      data: {
        userId: authResult.userId,
        entityId: params.id,
        action: 'UPDATE_ROLE_PERMISSIONS',
        details: JSON.stringify({
          roleId: params.roleId,
          roleName: role.name,
          permissionIds,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update role permissions' },
      { status: 500 }
    );
  }
} 