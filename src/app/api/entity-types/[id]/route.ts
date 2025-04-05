import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/middleware/roleCheck';

// GET /api/entity-types/[id] - Get a specific entity type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get entity type
    const entityType = await prisma.entityTypes.findUnique({
      where: { id }
    });

    if (!entityType) {
      return NextResponse.json(
        { message: 'Entity type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entityType);
  } catch (error) {
    console.error('Error fetching entity type:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity type' },
      { status: 500 }
    );
  }
}

// PUT /api/entity-types/[id] - Update an entity type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to update entity types
    const authResult = await requirePermission('update', '/api/entity-types')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const { name, description } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if entity type exists
    const existingType = await prisma.entityTypes.findUnique({
      where: { id: params.id }
    });

    if (!existingType) {
      return NextResponse.json(
        { message: 'Entity type not found' },
        { status: 404 }
      );
    }

    // Update the entity type
    const entityType = await prisma.entityTypes.update({
      where: { id: params.id },
      data: {
        name,
        description,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entityType',
        action: 'update',
        details: JSON.stringify({
          id: params.id,
          name,
          description,
        }),
      },
    });

    return NextResponse.json(entityType);
  } catch (error) {
    console.error('Error updating entity type:', error);
    return NextResponse.json(
      { message: 'Failed to update entity type' },
      { status: 500 }
    );
  }
}

// DELETE /api/entity-types/[id] - Delete an entity type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to delete entity types
    const authResult = await requirePermission('delete', '/api/entity-types')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Check if entity type exists
    const existingType = await prisma.entityTypes.findUnique({
      where: { id: params.id },
      include: {
        entities: true,
        entityRoles: true,
      },
    });

    if (!existingType) {
      return NextResponse.json(
        { message: 'Entity type not found' },
        { status: 404 }
      );
    }

    // Check if entity type has any entities or roles
    if (existingType.entities.length > 0 || existingType.entityRoles.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete entity type with existing entities or roles' },
        { status: 400 }
      );
    }

    // Delete the entity type
    await prisma.entityTypes.delete({
      where: { id: params.id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entityType',
        action: 'delete',
        details: JSON.stringify({
          id: params.id,
          name: existingType.name,
        }),
      },
    });

    return NextResponse.json({ message: 'Entity type deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity type:', error);
    return NextResponse.json(
      { message: 'Failed to delete entity type' },
      { status: 500 }
    );
  }
}
