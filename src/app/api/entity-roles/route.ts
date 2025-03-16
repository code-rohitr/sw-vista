import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

/**
 * GET /api/entity-roles
 * Get all entity roles or filter by entity type
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view entity roles
    const authResult = await requirePermission('view', '/api/entity-roles')(request);
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

    // Get entity roles
    const entityRoles = await prisma.entityRoles.findMany(query);

    return NextResponse.json(entityRoles);
  } catch (error) {
    console.error('Error fetching entity roles:', error);
    return NextResponse.json(
      { message: 'Error fetching entity roles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entity-roles
 * Create a new entity role
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create entity roles
    const authResult = await requirePermission('create', '/api/entity-roles')(request);
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

    // Check if entity role already exists with the same name in this entity type
    const existingEntityRole = await prisma.entityRoles.findFirst({
      where: {
        name,
        entity_type_id,
      },
    });

    if (existingEntityRole) {
      return NextResponse.json(
        { message: 'Entity role with this name already exists for this entity type' },
        { status: 400 }
      );
    }

    // Create entity role
    const entityRole = await prisma.entityRoles.create({
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
        entity_type: 'entity_role',
        entity_id: entityRole.id,
        action: 'create_entity_role',
      },
    });

    return NextResponse.json(entityRole, { status: 201 });
  } catch (error) {
    console.error('Error creating entity role:', error);
    return NextResponse.json(
      { message: 'Error creating entity role' },
      { status: 500 }
    );
  }
}
