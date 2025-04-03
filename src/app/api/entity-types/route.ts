import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

// GET /api/entity-types - Get all entity types
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view entity types
    const authResult = await requirePermission('view', '/api/entity-types')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get entity types
    const entityTypes = await prisma.entityTypes.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(entityTypes);
  } catch (error) {
    console.error('Error fetching entity types:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity types' },
      { status: 500 }
    );
  }
}

// POST /api/entity-types - Create a new entity type
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create entity types
    const authResult = await requirePermission('create', '/api/entity-types')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      );
    }

    // Create the entity type
    const entityType = await prisma.entityTypes.create({
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
        action: 'create',
        details: JSON.stringify({
          name,
          description,
        }),
      },
    });

    return NextResponse.json(entityType);
  } catch (error) {
    console.error('Error creating entity type:', error);
    return NextResponse.json(
      { message: 'Failed to create entity type' },
      { status: 500 }
    );
  }
}
