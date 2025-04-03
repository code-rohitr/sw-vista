import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { hasEntityAccess } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// GET /api/entities/[id] - Get a specific entity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to view entities
    const authResult = await requirePermission('view', '/api/entities')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const { id } = params;

    // Get entity with its type, parent, and children
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        entityType: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            entityType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!entity) {
      return NextResponse.json(
        { message: 'Entity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error fetching entity:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity' },
      { status: 500 }
    );
  }
}

// PUT /api/entities/[id] - Update an entity
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to update entities
    const authResult = await requirePermission('update', '/api/entities')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const { id } = params;
    const body = await request.json();
    const { name, entityTypeId, parentId } = body;

    // Validate required fields
    if (!name || !entityTypeId) {
      return NextResponse.json(
        { message: 'Name and entity type are required' },
        { status: 400 }
      );
    }

    // Check if entity exists
    const existingEntity = await prisma.entity.findUnique({
      where: { id },
    });

    if (!existingEntity) {
      return NextResponse.json(
        { message: 'Entity not found' },
        { status: 404 }
      );
    }

    // Update the entity
    const entity = await prisma.entity.update({
      where: { id },
      data: {
        name,
        entityType_id: entityTypeId,
        parent_id: parentId || null,
      },
      include: {
        entityType: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        action: 'update',
        details: JSON.stringify({
          id,
          name,
          entityTypeId,
          parentId,
        }),
      },
    });

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json(
      { message: 'Failed to update entity' },
      { status: 500 }
    );
  }
}

// DELETE /api/entities/[id] - Delete an entity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to delete entities
    const authResult = await requirePermission('delete', '/api/entities')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const { id } = params;

    // Check if entity exists
    const existingEntity = await prisma.entity.findUnique({
      where: { id },
    });

    if (!existingEntity) {
      return NextResponse.json(
        { message: 'Entity not found' },
        { status: 404 }
      );
    }

    // Delete the entity
    await prisma.entity.delete({
      where: { id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        action: 'delete',
        details: JSON.stringify({
          id,
          name: existingEntity.name,
        }),
      },
    });

    return NextResponse.json({ message: 'Entity deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json(
      { message: 'Failed to delete entity' },
      { status: 500 }
    );
  }
}
