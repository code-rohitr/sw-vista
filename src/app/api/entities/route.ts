import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

/**
 * GET /api/entities
 * Get all entities or filter by entity type
 */
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
      orderBy: {
        name: 'asc',
      },
      include: {
        entityType: true,
      },
    };

    // Add entity type filter if provided
    if (entityTypeId) {
      query.where = {
        entity_type_id: parseInt(entityTypeId),
      };
    }

    // Get entities
    const entities = await prisma.entities.findMany(query);

    return NextResponse.json(entities);
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json(
      { message: 'Error fetching entities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entities
 * Create a new entity
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create entities
    const authResult = await requirePermission('create', '/api/entities')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get request body
    const body = await request.json();
    const { name, description, entity_type_id } = body;

    // Validate required fields
    if (!name || !entity_type_id) {
      return NextResponse.json(
        { message: 'Name and entity type ID are required' },
        { status: 400 }
      );
    }

    // Check if entity type exists
    const entityType = await prisma.entityTypes.findUnique({
      where: { id: entity_type_id },
    });

    if (!entityType) {
      return NextResponse.json(
        { message: 'Entity type not found' },
        { status: 404 }
      );
    }

    // Check if entity already exists with the same name in this entity type
    const existingEntity = await prisma.entities.findFirst({
      where: {
        name,
        entity_type_id,
      },
    });

    if (existingEntity) {
      return NextResponse.json(
        { message: 'Entity with this name already exists for this entity type' },
        { status: 400 }
      );
    }

    // Create entity
    const entity = await prisma.entities.create({
      data: {
        name,
        description,
        entity_type_id,
      },
    });

    // Log action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        entity_id: entity.id,
        action: 'create_entity',
      },
    });

    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json(
      { message: 'Error creating entity' },
      { status: 500 }
    );
  }
}
