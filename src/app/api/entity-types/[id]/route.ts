import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity type ID' },
        { status: 400 }
      );
    }

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

// PUT /api/entity-types/[id] - Update a specific entity type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (user.role?.name !== 'godmode') {
      return NextResponse.json(
        { message: 'Only GOD can update entity types' },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity type ID' },
        { status: 400 }
      );
    }

    // Check if entity type exists
    const existingEntityType = await prisma.entityTypes.findUnique({
      where: { id }
    });

    if (!existingEntityType) {
      return NextResponse.json(
        { message: 'Entity type not found' },
        { status: 404 }
      );
    }

    // Get request body
    const { name, description } = await request.json();

    // Update entity type
    const updatedEntityType = await prisma.entityTypes.update({
      where: { id },
      data: {
        name: name || existingEntityType.name,
        description: description !== undefined ? description : existingEntityType.description
      }
    });

    return NextResponse.json(updatedEntityType);
  } catch (error) {
    console.error('Error updating entity type:', error);
    return NextResponse.json(
      { message: 'Failed to update entity type' },
      { status: 500 }
    );
  }
}

// DELETE /api/entity-types/[id] - Delete a specific entity type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (user.role?.name !== 'admin') {
      return NextResponse.json(
        { message: 'Only admins can delete entity types' },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity type ID' },
        { status: 400 }
      );
    }

    // Check if entity type exists
    const existingEntityType = await prisma.entityTypes.findUnique({
      where: { id }
    });

    if (!existingEntityType) {
      return NextResponse.json(
        { message: 'Entity type not found' },
        { status: 404 }
      );
    }

    // Delete entity type
    await prisma.entityTypes.delete({
      where: { id }
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