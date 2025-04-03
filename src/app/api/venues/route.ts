import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// Define the query type
type VenueQuery = {
  where?: {
    entity_id?: number;
  };
  include: {
    entity: {
      select: {
        id: true;
        name: true;
      };
    };
  };
  orderBy: {
    name: 'asc';
  };
};

// GET /api/venues - Get all venues
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId');

    // Build query
    const query: VenueQuery = {
      include: {
        entity: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    };
    
    if (entityId) {
      query.where = {
        entity_id: parseInt(entityId)
      };
    }

    // Get all venues
    const venues = await prisma.venue.findMany(query);

    return NextResponse.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    return NextResponse.json(
      { message: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}

// POST /api/venues - Create a new venue
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { name, description, address, entity_id, capacity, amenities } = await request.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: 'Venue name is required' },
        { status: 400 }
      );
    }

    if (!entity_id) {
      return NextResponse.json(
        { message: 'Entity is required' },
        { status: 400 }
      );
    }

    // Create venue
    const venue = await prisma.venue.create({
      data: {
        name,
        description,
        address,
        entity_id,
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

    return NextResponse.json(venue, { status: 201 });
  } catch (error) {
    console.error('Error creating venue:', error);
    return NextResponse.json(
      { message: 'Failed to create venue' },
      { status: 500 }
    );
  }
}

// PUT /api/venues/:id - Update a venue
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // Get venue ID from URL
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { message: 'Invalid venue ID' },
        { status: 400 }
      );
    }

    // Get request body
    const { name, description, address, entity_id, capacity, amenities } = await request.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: 'Venue name is required' },
        { status: 400 }
      );
    }

    // Update venue
    const venue = await prisma.venue.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        address,
        entity_id,
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

// DELETE /api/venues/:id - Delete a venue
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // Get venue ID from URL
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { message: 'Invalid venue ID' },
        { status: 400 }
      );
    }

    // Delete venue
    await prisma.venue.delete({
      where: { id: parseInt(id) }
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