import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/venue-bookings/[id] - Get a specific venue booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get booking by ID
    const booking = await prisma.venueBooking.findUnique({
      where: { id: params.id },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            capacity: true,
            amenities: true
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

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching venue booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue booking' },
      { status: 500 }
    );
  }
}

// PUT /api/venue-bookings/[id] - Update a venue booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get booking to check ownership
    const existingBooking = await prisma.venueBooking.findUnique({
      where: { id: params.id },
      select: { 
        entity_id: true,
        created_by: true,
        status: true,
        venue_id: true
      }
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if user is the creator or an admin of the entity
    const isCreator = existingBooking.created_by === user.id;
    const isEntityAdmin = user.entityMembers.some(
      membership => 
        membership.entity_id === existingBooking.entity_id && 
        membership.entityRole.name === 'Admin'
    );
    
    if (!isCreator && !isEntityAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this booking' },
        { status: 403 }
      );
    }

    // Get request body
    const { title, description, start_time, end_time, status } = await request.json();

    // Validate input
    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If dates are changing, check for conflicts
    if (start_time || end_time) {
      const newStartTime = start_time ? new Date(start_time) : undefined;
      const newEndTime = end_time ? new Date(end_time) : undefined;
      
      if (newStartTime && newEndTime) {
        const conflictingBookings = await prisma.venueBooking.findMany({
          where: {
            venue_id: existingBooking.venue_id,
            id: { not: params.id },
            status: { in: ['pending', 'approved'] },
            OR: [
              {
                start_time: {
                  gte: newStartTime,
                  lte: newEndTime
                }
              },
              {
                end_time: {
                  gte: newStartTime,
                  lte: newEndTime
                }
              },
              {
                AND: [
                  { start_time: { lte: newStartTime } },
                  { end_time: { gte: newEndTime } }
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
      }
    }

    // Prepare update data
    const updateData: any = {
      title,
      description,
      start_time: start_time ? new Date(start_time) : undefined,
      end_time: end_time ? new Date(end_time) : undefined
    };

    // Only admins can change status
    if (status && isEntityAdmin) {
      updateData.status = status;
    }

    // Update booking
    const booking = await prisma.venueBooking.update({
      where: { id: params.id },
      data: updateData,
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

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'venue_bookings',
        action: 'update',
        details: JSON.stringify({
          booking_id: params.id,
          title,
          description,
          start_time,
          end_time,
          status
        }),
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating venue booking:', error);
    return NextResponse.json(
      { error: 'Failed to update venue booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/venue-bookings/[id] - Delete a venue booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get booking to check ownership
    const existingBooking = await prisma.venueBooking.findUnique({
      where: { id: params.id },
      select: { 
        entity_id: true,
        created_by: true,
        status: true
      }
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if user is the creator or an admin of the entity
    const isCreator = existingBooking.created_by === user.id;
    const isEntityAdmin = user.entityMembers.some(
      membership => 
        membership.entity_id === existingBooking.entity_id && 
        membership.entityRole.name === 'Admin'
    );
    
    if (!isCreator && !isEntityAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this booking' },
        { status: 403 }
      );
    }

    // Delete booking
    await prisma.venueBooking.delete({
      where: { id: params.id }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'venue_bookings',
        action: 'delete',
        details: JSON.stringify({
          booking_id: params.id
        }),
      },
    });

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete venue booking' },
      { status: 500 }
    );
  }
}