import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/entities - Get all entities
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get all entities
    const entities = await prisma.entities.findMany({
      orderBy: { created_at: 'desc' }
    });

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
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (user.role?.name !== 'godmode') {
      return NextResponse.json(
        { message: 'Only GOD can create entities' },
        { status: 403 }
      );
    }

    // Get request body
    const { name, description, entity_type_id } = await request.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: 'Entity name is required' },
        { status: 400 }
      );
    }

    if (!entity_type_id) {
      return NextResponse.json(
        { message: 'Entity type is required' },
        { status: 400 }
      );
    }

    // Create entity
    const entity = await prisma.entities.create({
      data: {
        name,
        description,
        entity_type_id
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
