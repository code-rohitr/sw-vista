import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { hasEntityAccess } from '@/lib/auth';

// GET /api/entities/[id]/members - Get all members of an entity
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

    // Check if user has permission to view entity members
    const authResult = await requirePermission('view', '/api/entities/members', 'id')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Check if user has access to this entity
    const hasAccess = await hasEntityAccess(authResult.user.id, entityId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to view members of this entity' },
        { status: 403 }
      );
    }

    // Get all members of the entity
    const members = await prisma.entityMembers.findMany({
      where: { entity_id: entityId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        entityRole: {
          include: {
            template: true,
            entityRolePermissions: {
              include: {
                permission: true,
                resource: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching entity members:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity members' },
      { status: 500 }
    );
  }
}

// POST /api/entities/[id]/members - Add a member to an entity
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

    // Check if user has permission to manage entity members
    const authResult = await requirePermission('manage', '/api/entities/members', 'id')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Check if user has access to this entity
    const hasAccess = await hasEntityAccess(authResult.user.id, entityId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to manage members of this entity' },
        { status: 403 }
      );
    }

    // Get request body
    const { user_id, entity_role_id } = await request.json();

    // Validate input
    if (!user_id || !entity_role_id) {
      return NextResponse.json(
        { message: 'User ID and entity role ID are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if entity role exists and belongs to this entity
    const entityRole = await prisma.entityRoles.findFirst({
      where: {
        id: entity_role_id,
        entity_id: entityId,
      },
    });

    if (!entityRole) {
      return NextResponse.json(
        { message: 'Invalid entity role' },
        { status: 400 }
      );
    }

    // Check if user is already a member of this entity
    const existingMembership = await prisma.entityMembers.findFirst({
      where: {
        entity_id: entityId,
        user_id: user_id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { message: 'User is already a member of this entity' },
        { status: 400 }
      );
    }

    // Add member to entity
    const membership = await prisma.entityMembers.create({
      data: {
        entity_id: entityId,
        user_id: user_id,
        entity_role_id: entity_role_id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        entityRole: {
          include: {
            template: true,
            entityRolePermissions: {
              include: {
                permission: true,
                resource: true,
              },
            },
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        entity_id: entityId,
        action: 'add_member',
        details: JSON.stringify({ user_id, entity_role_id })
      }
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error('Error adding entity member:', error);
    return NextResponse.json(
      { message: 'Failed to add entity member' },
      { status: 500 }
    );
  }
} 