import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// POST /api/venue-bookings/[id]/approve - Approve or reject a venue booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { action, comment } = await request.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get booking and its approvals
    const booking = await prisma.venueBooking.findUnique({
      where: { id: params.id },
      include: {
        entity: true,
        approvals: {
          where: { approver_id: user.id },
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

    // Check if user is an approver for this booking
    const userApproval = booking.approvals[0];
    if (!userApproval) {
      return NextResponse.json(
        { error: 'You are not an approver for this booking' },
        { status: 403 }
      );
    }

    // Check if approval is already processed
    if (userApproval.status !== 'pending') {
      return NextResponse.json(
        { error: 'You have already processed this approval' },
        { status: 400 }
      );
    }

    // Update the approval
    const updatedApproval = await prisma.venueBookingApproval.update({
      where: { id: userApproval.id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        comment,
        processed_at: new Date()
      },
      include: {
        approver: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Check if all approvals are processed
    const allApprovals = await prisma.venueBookingApproval.findMany({
      where: { booking_id: params.id }
    });

    const allProcessed = allApprovals.every(
      approval => approval.status !== 'pending'
    );

    // If all approvals are processed, update booking status
    if (allProcessed) {
      const allApproved = allApprovals.every(
        approval => approval.status === 'approved'
      );

      await prisma.venueBooking.update({
        where: { id: params.id },
        data: {
          status: allApproved ? 'approved' : 'rejected'
        }
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'venue_bookings',
        action: `approval_${action}`,
        details: JSON.stringify({
          booking_id: params.id,
          comment
        }),
      },
    });

    return NextResponse.json(updatedApproval);
  } catch (error) {
    console.error('Error processing venue booking approval:', error);
    return NextResponse.json(
      { error: 'Failed to process venue booking approval' },
      { status: 500 }
    );
  }
} 