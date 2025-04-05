import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

// GET /api/entity-approvers/[id] - Get a specific entity approver
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get entity approver by ID
    const entityApprover = await prisma.entityApprover.findUnique({
      where: { id: params.id },
      include: {
        entity: {
          select: {
            id: true,
            name: true
          }
        },
        approver: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!entityApprover) {
      return NextResponse.json(
        { error: 'Entity approver not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entityApprover);
  } catch (error) {
    console.error('Error fetching entity approver:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entity approver' },
      { status: 500 }
    );
  }
}

// DELETE /api/entity-approvers/[id] - Delete an entity approver
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage entity approvers
    await requirePermission(user.id, 'manage', 'entity_approvers');

    // Get entity approver to check if it exists
    const entityApprover = await prisma.entityApprover.findUnique({
      where: { id: params.id },
      include: {
        entity: {
          select: {
            id: true,
            name: true
          }
        },
        approver: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!entityApprover) {
      return NextResponse.json(
        { error: 'Entity approver not found' },
        { status: 404 }
      );
    }

    // Delete entity approver
    await prisma.entityApprover.delete({
      where: { id: params.id }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'entity_approvers',
        action: 'delete',
        details: JSON.stringify({
          entity_id: entityApprover.entity_id,
          approver_id: entityApprover.approver_id,
          entity_name: entityApprover.entity.name,
          approver_username: entityApprover.approver.username
        }),
      },
    });

    return NextResponse.json({ message: 'Entity approver deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity approver:', error);
    return NextResponse.json(
      { error: 'Failed to delete entity approver' },
      { status: 500 }
    );
  }
} 