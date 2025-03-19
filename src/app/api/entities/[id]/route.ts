import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/entities/[id] - Get a specific entity
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
        { message: 'Invalid entity ID' },
        { status: 400 }
      );
    }

    // Get entity
    const entity = await prisma.entities.findUnique({
      where: { id }
    });

    if (!entity) {
      return NextResponse.json(
        { message: 'Entity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error fetching entity:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity' },
      { status: 500 }
    );
  }
}

// PUT /api/entities/[id] - Update a specific entity
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
        { message: 'Only GOD can update entities' },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity ID' },
        { status: 400 }
      );
    }

    // Check if entity exists
    const existingEntity = await prisma.entities.findUnique({
      where: { id }
    });

    if (!existingEntity) {
      return NextResponse.json(
        { message: 'Entity not found' },
        { status: 404 }
      );
    }

    // Get request body
    const { name, description } = await request.json();

    // Update entity
    const updatedEntity = await prisma.entities.update({
      where: { id },
      data: {
        name: name || existingEntity.name,
        description: description !== undefined ? description : existingEntity.description,
        // Remove the updated_at field as Prisma handles this automatically
      }
    });

    return NextResponse.json(updatedEntity);
  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json(
      { message: 'Failed to update entity' },
      { status: 500 }
    );
  }
}

// DELETE /api/entities/[id] - Delete a specific entity
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
    if (user.role?.name !== 'godmode') {
      return NextResponse.json(
        { message: 'Only GOD can delete entities' },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity ID' },
        { status: 400 }
      );
    }

    // Check if entity exists
    const existingEntity = await prisma.entities.findUnique({
      where: { id }
    });

    if (!existingEntity) {
      return NextResponse.json(
        { message: 'Entity not found' },
        { status: 404 }
      );
    }

    // Delete entity
    await prisma.entities.delete({
      where: { id }
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