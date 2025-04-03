import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { hasEntityAccess } from '@/lib/auth';

// GET /api/entities/[id]/roles - Get all roles for an entity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entityId = parseInt(params.id);
    if (isNaN(entityId)) {
      return NextResponse.json(
        { message: 'Invalid entity ID' },
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

    // Get all roles for the entity
    const roles = await prisma.entityRoles.findMany({
      where: { entity_id: entityId },
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

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching entity roles:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity roles' },
      { status: 500 }
    );
  }
}

// POST /api/entities/[id]/roles - Create a new role for an entity
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entityId = parseInt(params.id);
    if (isNaN(entityId)) {
      return NextResponse.json(
        { message: 'Invalid entity ID' },
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

    // Create role
    const role = await prisma.entityRoles.create({
      data: {
        name,
        description,
        entity_id: entityId,
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

    // If additional permissions are provided, add them
    if (permissions && Array.isArray(permissions)) {
      await Promise.all(
        permissions.map(async (permission) => {
          await prisma.entityRolePermissions.create({
            data: {
              entity_role_id: role.id,
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
        action: 'create_role',
        details: JSON.stringify({ name, template_id, permissions })
      }
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Error creating entity role:', error);
    return NextResponse.json(
      { message: 'Failed to create entity role' },
      { status: 500 }
    );
  }
} 