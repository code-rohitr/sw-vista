import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

/**
 * GET /api/entity-types
 * Get all entity types
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view entity types
    const authResult = await requirePermission('view', '/api/entity-types')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get all entity types
    const entityTypes = await prisma.entityTypes.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(entityTypes);
  } catch (error) {
    console.error('Error fetching entity types:', error);
    return NextResponse.json(
      { message: 'Error fetching entity types' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entity-types
 * Create a new entity type
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create entity types
    const authResult = await requirePermission('create', '/api/entity-types')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get request body
    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if entity type already exists
    const existingEntityType = await prisma.entityTypes.findUnique({
      where: { name },
    });

    if (existingEntityType) {
      return NextResponse.json(
        { message: 'Entity type with this name already exists' },
        { status: 400 }
      );
    }

    // Create entity type
    const entityType = await prisma.entityTypes.create({
      data: {
        name,
        description,
      },
    });

    // Log action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity_type',
        entity_id: entityType.id,
        action: 'create_entity_type',
      },
    });

    return NextResponse.json(entityType, { status: 201 });
  } catch (error) {
    console.error('Error creating entity type:', error);
    return NextResponse.json(
      { message: 'Error creating entity type' },
      { status: 500 }
    );
  }
}
