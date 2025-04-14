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
        venue: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user has already rejected
    const existingRejection = await prisma.approval.findFirst({
      where: {
        approver_id: userId,
        entity_type: 'booking',
        entity_id: bookingId,
        action: 'rejected'
      }
    })

    if (existingRejection) {
      return NextResponse.json(
        { error: 'Already rejected this request' },
        { status: 400 }
      )
    }

    // Create rejection record and update booking status
    await prisma.$transaction([
      prisma.approval.create({
        data: {
          approver_id: userId,
          entity_type: 'booking',
          entity_id: bookingId,
          action: 'rejected',
          remarks: `Rejected by ${userRole}`
        }
      }),
      prisma.venueBooking.update({
        where: { id: bookingId },
        data: { status: 0 } // 0 represents Rejected status
      })
    ])

    return NextResponse.json({ status: 'success', newStatus: 0 })
  } catch (error) {
    console.error('Error rejecting venue request:', error)
    return NextResponse.json(
      { error: 'Failed to reject venue request' },
      { status: 500 }
    )
  }
} 