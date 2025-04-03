import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const authResult = await requirePermission('manage', '/api/entities/members', 'id')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Check if entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: params.id },
    });

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is a member of this entity
    const member = await prisma.entityMembers.findFirst({
      where: {
        entity_id: params.id,
        user_id: params.userId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'User is not a member of this entity' },
        { status: 400 }
      );
    }

    // Remove member from entity
    await prisma.entityMembers.delete({
      where: {
        id: member.id,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity_member',
        action: 'delete',
        details: JSON.stringify({
          entityId: params.id,
          userId: params.userId,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing entity member:', error);
    return NextResponse.json(
      { error: 'Failed to remove entity member' },
      { status: 500 }
    );
  }
} 