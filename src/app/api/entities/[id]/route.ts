import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { hasEntityAccess } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

// GET /api/entities/[id] - Get a specific entity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Await params to get the ID
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Get entity with its type, parent, and children
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        entityType: true,
        parent: true,
        children: {
          include: {
            entityType: true
          }
        }
      }
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
    const data = await request.json();

    // Update entity
    const updatedEntity = await prisma.entity.update({
      where: { id },
      data: {
        name: data.name,
        entityType_id: data.entityTypeId,
        parent_id: data.parentId,
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

    return NextResponse.json(updatedEntity);
  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json(
      { error: 'Failed to update entity' },
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

    // Delete entity
    await prisma.entity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json(
      { error: 'Failed to delete entity' },
      { status: 500 }
    );
  }
}
