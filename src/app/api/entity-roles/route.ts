import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/entity-roles - Get all entity roles
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const entityTypeId = url.searchParams.get('entityTypeId');

    // Build query
    const query: any = {
      include: {
        entityType: true
      },
      orderBy: { created_at: 'desc' }
    };

    // Filter by entity type if provided
    if (entityTypeId) {
      query.where = {
        entity_type_id: parseInt(entityTypeId)
      };
    }

    // Get all entity roles
    const entityRoles = await prisma.entityRoles.findMany(query);

    return NextResponse.json(entityRoles);
  } catch (error) {
    console.error('Error fetching entity roles:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity roles' },
      { status: 500 }
    );
  }
}

// POST /api/entity-roles - Create a new entity role
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has godmode role
    if (user.role?.name !== 'godmode') {
      return NextResponse.json(
        { message: 'Only godmode users can create entity roles' },
        { status: 403 }
      );
    }

    // Get request body
    const { name, description, entity_type_id } = await request.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: 'Entity role name is required' },
        { status: 400 }
      );
    }

    if (!entity_type_id) {
      return NextResponse.json(
        { message: 'Entity type ID is required' },
        { status: 400 }
      );
    }

    // Check if entity type exists
    const entityType = await prisma.entityTypes.findUnique({
      where: { id: entity_type_id }
    });

    if (!entityType) {
      return NextResponse.json(
        { message: 'Entity type not found' },
        { status: 404 }
      );
    }

    // Create entity role
    const entityRole = await prisma.entityRoles.create({
      data: {
        name,
        description,
        entity_type_id
      }
    });

    return NextResponse.json(entityRole, { status: 201 });
  } catch (error) {
    console.error('Error creating entity role:', error);
    return NextResponse.json(
      { message: 'Failed to create entity role' },
      { status: 500 }
    );
  }
}
