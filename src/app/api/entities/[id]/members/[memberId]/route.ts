import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { hasEntityAccess } from '@/lib/auth';

// GET /api/entities/[id]/members/[memberId] - Get a specific member of an entity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const entityId = parseInt(params.id);
    const memberId = parseInt(params.memberId);

    if (isNaN(entityId) || isNaN(memberId)) {
      return NextResponse.json(
        { message: 'Invalid entity ID or member ID' },
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

    // Get the specific member
    const member = await prisma.entityMembers.findFirst({
      where: {
        entity_id: entityId,
        id: memberId,
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

    if (!member) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching entity member:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity member' },
      { status: 500 }
    );
  }
}

// PUT /api/entities/[id]/members/[memberId] - Update a member's role in an entity
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const entityId = parseInt(params.id);
    const memberId = parseInt(params.memberId);

    if (isNaN(entityId) || isNaN(memberId)) {
      return NextResponse.json(
        { message: 'Invalid entity ID or member ID' },
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
    const { entity_role_id } = await request.json();

    // Validate input
    if (!entity_role_id) {
      return NextResponse.json(
        { message: 'Entity role ID is required' },
        { status: 400 }
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

    // Check if member exists
    const member = await prisma.entityMembers.findFirst({
      where: {
        entity_id: entityId,
        id: memberId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      );
    }

    // Update member's role
    const updatedMember = await prisma.entityMembers.update({
      where: {
        id: memberId,
      },
      data: {
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
        action: 'update_member_role',
        details: JSON.stringify({ member_id: memberId, entity_role_id })
      }
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating entity member:', error);
    return NextResponse.json(
      { message: 'Failed to update entity member' },
      { status: 500 }
    );
  }
}

// DELETE /api/entities/[id]/members/[memberId] - Remove a member from an entity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const entityId = parseInt(params.id);
    const memberId = parseInt(params.memberId);

    if (isNaN(entityId) || isNaN(memberId)) {
      return NextResponse.json(
        { message: 'Invalid entity ID or member ID' },
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

    // Check if member exists
    const member = await prisma.entityMembers.findFirst({
      where: {
        entity_id: entityId,
        id: memberId,
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      );
    }

    // Remove member from entity
    await prisma.entityMembers.delete({
      where: {
        id: memberId,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        entity_id: entityId,
        action: 'remove_member',
        details: JSON.stringify({ member_id: memberId, username: member.user.username })
      }
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing entity member:', error);
    return NextResponse.json(
      { message: 'Failed to remove entity member' },
      { status: 500 }
    );
  }
} 