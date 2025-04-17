import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = context.params
    
    // Ensure id is available
    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    const bookingId = parseInt(id)
    const userId = parseInt(session.user.id)
    const userRole = session.user.role

    // Get the current booking
    const booking = await prisma.venueBooking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        venue: true,
        proposal: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user has already approved
    const existingApproval = await prisma.approval.findFirst({
      where: {
        approver_id: userId,
        entity_type: 'booking',
        entity_id: bookingId,
        action: 'approved'
      }
    })

    if (existingApproval) {
      return NextResponse.json(
        { error: 'Already approved this request' },
        { status: 400 }
      )
    }

    // Determine the next status based on current approvals
    let newStatus = booking.status
    const faApproval = await prisma.approval.findFirst({
      where: {
        entity_type: 'booking',
        entity_id: bookingId,
        action: 'approved',
        approver: {
          role: 'FA'
        }
      }
    })
    
    const scApproval = await prisma.approval.findFirst({
      where: {
        entity_type: 'booking',
        entity_id: bookingId,
        action: 'approved',
        approver: {
          role: 'SC'
        }
      }
    })
    
    const swoApproval = await prisma.approval.findFirst({
      where: {
        entity_type: 'booking',
        entity_id: bookingId,
        action: 'approved',
        approver: {
          role: 'SWO'
        }
      }
    })
    
    const securityApproval = await prisma.approval.findFirst({
      where: {
        entity_type: 'booking',
        entity_id: bookingId,
        action: 'approved',
        approver: {
          role: 'SECURITY'
        }
      }
    })

    // Update status based on role and current approvals
    if (userRole === 'FA' && !faApproval) {
      newStatus = 2 // FA Approved
    } else if (userRole === 'SC' && !scApproval) {
      newStatus = 3 // SC Approved
    } else if (userRole === 'SWO' && !swoApproval) {
      newStatus = 4 // SWO Approved
    } else if (userRole === 'SECURITY' && !securityApproval) {
      newStatus = 5 // Security Approved (Final)
    }

    // Create approval record and update booking status
    await prisma.$transaction([
      prisma.approval.create({
        data: {
          approver_id: userId,
          entity_type: 'booking',
          entity_id: bookingId,
          action: 'approved',
          remarks: `Approved by ${userRole}`
        }
      }),
      prisma.venueBooking.update({
        where: { id: bookingId },
        data: { status: newStatus }
      }),
      // If this is the final approval (Security) and there's an associated proposal,
      // mark the proposal as completed
      ...(newStatus === 5 && booking.proposal_id
        ? [
            prisma.proposal.update({
              where: { id: booking.proposal_id },
              data: { status: 'Completed' }
            })
          ]
        : [])
    ])

    return NextResponse.json({ status: 'success', newStatus })
  } catch (error) {
    console.error('Error approving venue request:', error)
    return NextResponse.json(
      { error: 'Failed to approve venue request' },
      { status: 500 }
    )
  }
} 