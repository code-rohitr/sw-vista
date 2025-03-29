import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/venues/[id] - Get a specific venue
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get venue by ID
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        entity: {
          select: {
            id: true,
            name: true
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
    const id = parseInt(params.id);
    
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get venue to check entity ownership
    const existingVenue = await prisma.venue.findUnique({
      where: { id },
      select: { entity_id: true }
    });

    if (!existingVenue) {
      return NextResponse.json({ message: 'Venue not found' }, { status: 404 });
    }

    // Check if user has admin role for this venue's entity
    const hasAdminRole = user.entityMembers.some(
      membership => 
        membership.entity.id === existingVenue.entity_id && 
        membership.entityRole.name === 'Admin'
    );
    
    if (!hasAdminRole) {
      return NextResponse.json(
        { message: 'Only entity admins can update venues' },
        { status: 403 }
      );
    }

    // Get request body
    const { name, description, address, capacity, amenities } = await request.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: 'Venue name is required' },
        { status: 400 }
      );
    }

    // Update venue
    const venue = await prisma.venue.update({
      where: { id },
      data: {
        name,
        description,
        address,
        capacity: capacity ? parseInt(capacity) : null,
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

    return NextResponse.json(venue);
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
    const id = parseInt(params.id);
    
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get venue to check entity ownership
    const existingVenue = await prisma.venue.findUnique({
      where: { id },
      select: { entity_id: true }
    });

    if (!existingVenue) {
      return NextResponse.json({ message: 'Venue not found' }, { status: 404 });
    }

    // Check if user has admin role for this venue's entity
    const hasAdminRole = user.entityMembers.some(
      membership => 
        membership.entity.id === existingVenue.entity_id && 
        membership.entityRole.name === 'Admin'
    );
    
    if (!hasAdminRole) {
      return NextResponse.json(
        { message: 'Only entity admins can delete venues' },
        { status: 403 }
      );
    }

    // Check if venue has any bookings
    const bookings = await prisma.venueBooking.findMany({
      where: { 
        venue_id: id,
        status: { in: ['pending', 'approved'] }
      },
      take: 1
    });

    if (bookings.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete venue with active bookings' },
        { status: 409 }
      );
    }

    // Delete venue
    await prisma.venue.delete({
      where: { id }
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