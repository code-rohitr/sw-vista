import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/bookings - Get bookings for the user's entity
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get user's entities
    const userEntities = await prisma.entityMembers.findMany({
      where: {
        user_id: user.id
      },
      select: {
        entity_id: true
      }
    });

    if (userEntities.length === 0) {
      return NextResponse.json([]);
    }

    const entityIds = userEntities.map(entity => entity.entity_id);

    // Get bookings only for the user's entities
    const bookings = await prisma.venueBooking.findMany({
      where: {
        entity_id: {
          in: entityIds
        }
      },
      include: {
        venue: true,
        entity: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        approver: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { venue_id, title, description, start_time, end_time } = await request.json();

    // Validate input
    if (!venue_id || !title || !start_time || !end_time) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's entity
    const userEntity = await prisma.entityMembers.findFirst({
      where: {
        user_id: user.id
      },
      select: {
        entity_id: true
      }
    });

    if (!userEntity) {
      return NextResponse.json(
        { message: 'No entity available for booking' },
        { status: 400 }
      );
    }
      
    const bookingEntityId = userEntity.entity_id;

    // Validate dates
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { message: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { message: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check if venue is available
    const conflictingBooking = await prisma.venueBooking.findFirst({
      where: {
        venue_id: parseInt(venue_id.toString()),
        status: { in: ['approved', 'pending'] },
        OR: [
          {
            // Booking starts during the requested time
            AND: [
              { start_time: { gte: startDate } },
              { start_time: { lt: endDate } }
            ]
          },
          {
            // Booking ends during the requested time
            AND: [
              { end_time: { gt: startDate } },
              { end_time: { lte: endDate } }
            ]
          },
          {
            // Booking completely contains the requested time
            AND: [
              { start_time: { lte: startDate } },
              { end_time: { gte: endDate } }
            ]
          }
        ]
      }
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { message: 'Venue is not available during the requested time' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await prisma.venueBooking.create({
      data: {
        venue_id: parseInt(venue_id.toString()),
        entity_id: bookingEntityId,
        title,
        description,
        start_time: startDate,
        end_time: endDate,
        status: 'pending',
        created_by: user.id
      },
      include: {
        venue: true,
        entity: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        approver: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { message: 'Failed to create booking' },
      { status: 500 }
    );
  }
}