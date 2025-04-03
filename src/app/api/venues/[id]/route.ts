import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, hasVenueAccess } from '@/lib/auth';
import { requirePermission } from '@/middleware/roleCheck';

// GET /api/venues/[id] - Get a specific venue
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First verify basic authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid venue ID' }, { status: 400 });
    }

    // Check if user has general permission to view venues
    const authResult = await requirePermission('view', '/api/venues')(request);
    if ('isAuthorized' in authResult === false) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    // Check if user has access to this specific venue through entity membership
    const hasAccess = await hasVenueAccess(user.id, id);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to view this venue' },
        { status: 403 }
      );
    }

    // Get venue by ID with full details
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            entityType: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!venue) {
      return NextResponse.json({ message: 'Venue not found' }, { status: 404 });
    }

    return NextResponse.json(venue);
  } catch (error) {
    console.error('Error fetching venue:', error);
    return NextResponse.json(
      { message: 'Failed to fetch venue' },
      { status: 500 }
    );
  }
}

// PUT /api/venues/[id] - Update a venue
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First verify basic authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid venue ID' }, { status: 400 });
    }

    // Check if user has general permission to update venues
    const authResult = await requirePermission('update', '/api/venues')(request);
    if ('isAuthorized' in authResult === false) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    // Check if user has access to this specific venue through entity membership
    const hasAccess = await hasVenueAccess(user.id, id);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to update this venue' },
        { status: 403 }
      );
    }

    // Get request body
    const { name, description, address, capacity, amenities } = await request.json();

    // Update venue
    const updatedVenue = await prisma.venue.update({
      where: { id },
      data: {
        name,
        description,
        address,
        capacity,
        amenities
      },
      include: {
        entity: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'venue',
        entity_id: updatedVenue.id,
        action: 'update_venue'
      }
    });

    return NextResponse.json(updatedVenue);
  } catch (error) {
    console.error('Error updating venue:', error);
    return NextResponse.json(
      { message: 'Failed to update venue' },
      { status: 500 }
    );
  }
}

// DELETE /api/venues/[id] - Delete a venue
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First verify basic authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid venue ID' }, { status: 400 });
    }

    // Check if user has general permission to delete venues
    const authResult = await requirePermission('delete', '/api/venues')(request);
    if ('isAuthorized' in authResult === false) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    // Check if user has access to this specific venue through entity membership
    const hasAccess = await hasVenueAccess(user.id, id);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this venue' },
        { status: 403 }
      );
    }

    // Delete venue
    await prisma.venue.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'venue',
        entity_id: id,
        action: 'delete_venue'
      }
    });

    return NextResponse.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    return NextResponse.json(
      { message: 'Failed to delete venue' },
      { status: 500 }
    );
  }
}