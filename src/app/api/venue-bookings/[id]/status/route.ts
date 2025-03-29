import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// PATCH /api/venue-bookings/[id]/status - Update booking status
export async function PATCH(
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

    // Get request body
    const { status } = await request.json();

    // Validate input
    if (!status || !['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get booking to check permissions
    const booking = await prisma.venueBooking.findUnique({
      where: { id },
      include: {
        venue: {
          select: {
            entity_id: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    // Check permissions based on status change
    if (status === 'cancelled') {
      // Only the creator or entity admin can cancel
      const isCreator = booking.created_by === user.id;
      const isEntityAdmin = user.entityMembers.some(
        membership => 
          membership.entity_id === booking.entity_id && 
          membership.entityRole.name === 'Admin'
      );
      
      if (!isCreator && !isEntityAdmin) {
        return NextResponse.json(
          { message: 'You do not have permission to cancel this booking' },
          { status: 403 }
        );
      }
    } else if (status === 'approved' || status === 'rejected') {
      // Only venue owner entity admin can approve/reject
      const isVenueAdmin = user.entityMembers.some(
        membership => 
          membership.entity_id === booking.venue.entity_id && 
          membership.entityRole.name === 'Admin'
      );
      
      if (!isVenueAdmin) {
        return NextResponse.json(
          { message: 'Only venue administrators can approve or reject bookings' },
          { status: 403 }
        );
      }
    } else {
      // For other status changes, require entity admin
      const isEntityAdmin = user.entityMembers.some(
        membership => 
          membership.entity_id === booking.entity_id && 
          membership.entityRole.name === 'Admin'
      );
      
      if (!isEntityAdmin) {
        return NextResponse.json(
          { message: 'You do not have permission to change this booking status' },
          { status: 403 }
        );
      }
    }

    // Update booking status
    const updateData: any = { status };
    
    // Set approver if approving or rejecting
    if ((status === 'approved' || status === 'rejected') && booking.status !== status) {
      updateData.approved_by = user.id;
    }

    const updatedBooking = await prisma.venueBooking.update({
      where: { id },
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
        approver: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { message: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}