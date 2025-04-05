import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/middleware/roleCheck';

// GET /api/venues/[id]/bookings - Get all bookings for a venue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Verify authentication and check permissions
    const authResult = await requirePermission('view', 'bookings', 'id')(request);
    if (!authResult.isAuthorized) {
      return authResult;
    }

    const bookings = await prisma.venueBooking.findMany({
      where: {
        venue_id: id,
      },
      include: {
        user: true,
        approvals: {
          include: {
            user: true,
          },
          orderBy: {
            sequence: 'asc',
          },
        },
      },
      orderBy: {
        start_time: 'asc',
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/venues/[id]/bookings - Create a new booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Verify authentication and check permissions
    const authResult = await requirePermission('create', 'bookings', 'id')(request);
    if (!authResult.isAuthorized) {
      return authResult;
    }

    const { startTime, endTime, purpose } = await request.json();

    // Validate input
    if (!startTime || !endTime || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for booking conflicts
    const conflictingBookings = await prisma.venueBooking.findMany({
      where: {
        venue_id: id,
        OR: [
          {
            start_time: {
              lte: new Date(endTime),
              gte: new Date(startTime),
            },
          },
          {
            end_time: {
              lte: new Date(endTime),
              gte: new Date(startTime),
            },
          },
        ],
        status: {
          not: 'REJECTED',
        },
      },
    });

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Time slot is already booked' },
        { status: 400 }
      );
    }

    // Get venue to check approval sequence
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        approvalUsers: {
          include: {
            user: true,
          },
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Create booking with approval sequence
    const booking = await prisma.venueBooking.create({
      data: {
        venue_id: id,
        user_id: authResult.user.id,
        start_time: new Date(startTime),
        end_time: new Date(endTime),
        purpose,
        status: 'PENDING',
        approvals: {
          create: venue.approvalUsers.map((approvalUser) => ({
            user_id: approvalUser.user_id,
            sequence: approvalUser.sequence,
            status: 'PENDING',
          })),
        },
      },
      include: {
        user: true,
        approvals: {
          include: {
            user: true,
          },
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
} 