import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

// GET /api/entity-approvers - Get all entity approvers
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId');

    // Build query
    const query: any = {
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
      },
      orderBy: {
        created_at: 'desc'
      }
    };
    
    if (entityId) {
      query.where = {
        entity_id: entityId
      };
    }

    // Get all entity approvers
    const approvers = await prisma.entityApprover.findMany(query);

    return NextResponse.json(approvers);
  } catch (error) {
    console.error('Error fetching entity approvers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entity approvers' },
      { status: 500 }
    );
  }
}

// POST /api/entity-approvers - Create a new entity approver
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage entity approvers
    await requirePermission(user.id, 'manage', 'entity_approvers');

    // Get request body
    const { entity_id, approver_id } = await request.json();

    // Validate input
    if (!entity_id || !approver_id) {
      return NextResponse.json(
        { error: 'Entity ID and approver ID are required' },
        { status: 400 }
      );
    }

    // Check if entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: entity_id }
    });

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Check if approver exists
    const approver = await prisma.users.findUnique({
      where: { id: approver_id }
    });

    if (!approver) {
      return NextResponse.json(
        { error: 'Approver not found' },
        { status: 404 }
      );
    }

    // Check if approver is already assigned to this entity
    const existingApprover = await prisma.entityApprover.findUnique({
      where: {
        entity_id_approver_id: {
          entity_id,
          approver_id
        }
      }
    });

    if (existingApprover) {
      return NextResponse.json(
        { error: 'Approver is already assigned to this entity' },
        { status: 409 }
      );
    }

    // Create entity approver
    const entityApprover = await prisma.entityApprover.create({
      data: {
        entity_id,
        approver_id,
        created_by: user.id
      },
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

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'entity_approvers',
        action: 'create',
        details: JSON.stringify({
          entity_id,
          approver_id,
          entity_name: entity.name,
          approver_username: approver.username
        }),
      },
    });

    return NextResponse.json(entityApprover, { status: 201 });
  } catch (error) {
    console.error('Error creating entity approver:', error);
    return NextResponse.json(
      { error: 'Failed to create entity approver' },
      { status: 500 }
    );
  }
} 