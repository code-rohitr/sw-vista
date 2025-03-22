import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/entity-types - Get all entity types
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    console.log(user,"user")
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get all entity types
    const entityTypes = await prisma.entityTypes.findMany({
      orderBy: { created_at: 'desc' }
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
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has godmode role
    if (user.role?.name !== 'godmode') {
      return NextResponse.json(
        { message: 'Only godmode users can create entity types' },
        { status: 403 }
      );
    }

    // Get request body
    const { name, description } = await request.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: 'Entity type name is required' },
        { status: 400 }
      );
    }

    // Create entity type
    const entityType = await prisma.entityTypes.create({
      data: {
        name,
        description
      }
    });

    return NextResponse.json(entityType, { status: 201 });
  } catch (error) {
    console.error('Error creating entity type:', error);
    return NextResponse.json(
      { message: 'Failed to create entity type' },
      { status: 500 }
    );
  }
}
