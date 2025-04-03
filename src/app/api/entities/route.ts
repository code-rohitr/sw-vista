import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { hasEntityAccess } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// Define the query type
type EntityQuery = {
  include: {
    entityType: true;
    parent: true;
    children: true;
  };
  where?: {
    entityType_id: string;
    parent_id?: string | null;
  };
};

// GET /api/entities - Get all entities
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view entities
    const authResult = await requirePermission('view', '/api/entities')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get query parameters
    const url = new URL(request.url);
    const entityTypeId = url.searchParams.get('entityTypeId');

    // Build query
    const query: any = {
      include: {
        entityType: true,
        parent: true,
        children: true
      }
    };

    // Add entity type filter if provided
    if (entityTypeId) {
      query.where = {
        entityType_id: entityTypeId
      };
    }

    // Get all entities
    const entities = await prisma.entity.findMany(query);

    return NextResponse.json(entities);
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}

// POST /api/entities - Create a new entity
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create entities
    const authResult = await requirePermission('create', '/api/entities')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get request body
    const { name, description, entityType_id, parent_id } = await request.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: 'Entity name is required' },
        { status: 400 }
      );
    }

    if (!entityType_id) {
      return NextResponse.json(
        { message: 'Entity type is required' },
        { status: 400 }
      );
    }

    // Check if an entity with the same name exists for this entity type
    const existingEntity = await prisma.entity.findFirst({
      where: {
        name,
        entityType_id
      }
    });

    if (existingEntity) {
      return NextResponse.json(
        { message: `An entity with the name "${name}" already exists for this entity type` },
        { status: 400 }
      );
    }

    // If parent_id is provided, check if user has access to the parent entity
    if (parent_id) {
      const hasAccess = await hasEntityAccess(authResult.user.id, parent_id);
      if (!hasAccess) {
        return NextResponse.json(
          { message: 'You do not have permission to create entities under this parent' },
          { status: 403 }
        );
      }
    }

    // Create entity
    const entity = await prisma.entity.create({
      data: {
        name,
        description,
        entityType_id,
        parent_id
      },
      include: {
        entityType: true,
        parent: true
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        action: 'create_entity',
        details: { entityId: entity.id }
      }
    });

    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json(
      { message: 'Failed to create entity' },
      { status: 500 }
    );
  }
}

// PUT /api/entities/:id - Update an entity
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

    // Get request body
    const { name, description, parent_id } = await request.json();

    // If parent_id is provided, check if user has access to the parent entity
    if (parent_id) {
      const hasParentAccess = await hasEntityAccess(authResult.user.id, parent_id);
      if (!hasParentAccess) {
        return NextResponse.json(
          { message: 'You do not have permission to set this parent entity' },
          { status: 403 }
        );
      }
    }

    // Update entity
    const entity = await prisma.entity.update({
      where: { id: params.id },
      data: {
        name,
        description,
        parent_id
      },
      include: {
        entityType: true,
        parent: true
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        action: 'update_entity',
        details: { entityId: entity.id }
      }
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

// DELETE /api/entities/:id - Delete an entity
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

    // Delete entity and all its children in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all entity memberships for this entity and its children
      await tx.entityMembers.deleteMany({
        where: {
          entity_id: params.id
        }
      });

      // Delete the entity
      await tx.entity.delete({
        where: { id: params.id }
      });
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        action: 'delete_entity',
        details: { entityId: params.id }
      }
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
