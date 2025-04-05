import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/venue-bookings - Get all venue bookings
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const venueId = url.searchParams.get('venueId');
    const entityId = url.searchParams.get('entityId');
    const status = url.searchParams.get('status');
    const userId = url.searchParams.get('userId');

    // Build query
    const query: any = {};
    
    if (venueId) {
      query.venue_id = venueId;
    }
    
    if (entityId) {
      query.entity_id = entityId;
    }
    
    if (status) {
      query.status = status;
    }

    if (userId) {
      query.created_by = userId;
    }

    // Get all venue bookings
    const bookings = await prisma.venueBooking.findMany({
      where: query,
      orderBy: { start_time: 'asc' },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            capacity: true
          }
        },
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
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching venue bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue bookings' },
      { status: 500 }
    );
  }
}

// POST /api/venue-bookings - Create a new venue booking
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { venue_id, entity_id, title, description, start_time, end_time } = await request.json();

    // Validate input
    if (!venue_id || !entity_id || !title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is a member of the entity
    const isMember = user.entityMembers.some(
      membership => membership.entity_id === entity_id
    );
    
    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this entity' },
        { status: 403 }
      );
    }

    // Check if venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venue_id }
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Check for booking conflicts
    const conflictingBookings = await prisma.venueBooking.findMany({
      where: {
        venue_id,
        status: { in: ['pending', 'approved'] },
        OR: [
          {
            // New booking starts during an existing booking
            start_time: {
              gte: new Date(start_time),
              lte: new Date(end_time)
            }
          },
          {
            // New booking ends during an existing booking
            end_time: {
              gte: new Date(start_time),
              lte: new Date(end_time)
            }
          },
          {
            // New booking encompasses an existing booking
            AND: [
              { start_time: { lte: new Date(start_time) } },
              { end_time: { gte: new Date(end_time) } }
            ]
          }
        ]
      }
    });

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Venue is already booked during this time' },
        { status: 409 }
      );
    }

    // Get entity approvers
    const entityApprovers = await prisma.entityApprover.findMany({
      where: { entity_id },
      select: { approver_id: true }
    });

    // Create booking
    const booking = await prisma.venueBooking.create({
      data: {
        venue_id,
        entity_id,
        title,
        description,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        status: 'pending',
        created_by: user.id
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true
          }
        },
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
        }
      }
    });

    // Create approval records for each approver
    if (entityApprovers.length > 0) {
      await prisma.venueBookingApproval.createMany({
        data: entityApprovers.map(approver => ({
          booking_id: booking.id,
          approver_id: approver.approver_id,
          status: 'pending'
        }))
      });
    } else {
      // If no approvers, auto-approve the booking
      await prisma.venueBooking.update({
        where: { id: booking.id },
        data: { status: 'approved' }
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'venue_bookings',
        action: 'create',
        details: JSON.stringify({
          booking_id: booking.id,
          venue_id,
          entity_id,
          title,
          start_time,
          end_time
        }),
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating venue booking:', error);
    return NextResponse.json(
      { error: 'Failed to create venue booking' },
      { status: 500 }
    );
  }
}