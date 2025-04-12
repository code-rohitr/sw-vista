import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { hasEntityAccess } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

// GET /api/entities/[id] - Get a single entity
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

    // Check if user has access to this entity
    const hasAccess = await hasEntityAccess(authResult.user.id, params.id);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to view this entity' },
        { status: 403 }
      );
    }

    // Fetch the entity with its details
    const entity = await prisma.entity.findUnique({
      where: { id: params.id },
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

    // Check if user has access to this entity
    const hasAccess = await hasEntityAccess(authResult.user.id, params.id);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to update this entity' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, parent_id } = body;

    // Update the entity
    const updatedEntity = await prisma.entity.update({
      where: { id: params.id },
      data: {
        name,
        description,
        parent_id,
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
        children: {
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
          entityId: params.id,
          changes: {
            name,
            description,
            parent_id,
          },
        }),
      },
    });

    return NextResponse.json(updatedEntity);
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

    // Check if user has access to this entity
    const hasAccess = await hasEntityAccess(authResult.user.id, params.id);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this entity' },
        { status: 403 }
      );
    }

    // Delete the entity
    await prisma.entity.delete({
      where: { id: params.id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        action: 'delete',
        details: JSON.stringify({
          entityId: params.id,
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
