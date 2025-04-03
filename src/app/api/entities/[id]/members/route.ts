import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

// GET /api/entities/[id]/members - Get all members of an entity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requirePermission('view', '/api/entities/members', 'id')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const entityId = params.id;
    const members = await prisma.entityMembers.findMany({
      where: {
        entity_id: entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        entityRole: true,
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching entity members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entity members' },
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
    const authResult = await requirePermission('manage', '/api/entities/members', 'id')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const entityId = params.id;
    const { userId, roleId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.entityMembers.findFirst({
      where: {
        entity_id: entityId,
        user_id: userId,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this entity' },
        { status: 400 }
      );
    }

    // Get default role if roleId is not provided
    let entityRoleId = roleId;
    if (!entityRoleId) {
      const defaultRole = await prisma.entityRoles.findFirst({
        where: {
          entity_id: entityId,
        },
      });

      if (!defaultRole) {
        return NextResponse.json(
          { error: 'No default role found for this entity' },
          { status: 400 }
        );
      }

      entityRoleId = defaultRole.id;
    }

    // Add user as member
    const member = await prisma.entityMembers.create({
      data: {
        entity_id: entityId,
        user_id: userId,
        entity_role_id: entityRoleId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        entityRole: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity_member',
        action: 'create',
        details: JSON.stringify({
          entityId: entityId,
          userId: userId,
          roleId: entityRoleId,
        }),
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error adding entity member:', error);
    return NextResponse.json(
      { error: 'Failed to add entity member' },
      { status: 500 }
    );
  }
} 