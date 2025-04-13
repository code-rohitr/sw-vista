import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = parseInt(params.id)
    const userId = parseInt(session.user.id)
    const userRole = session.user.role

    // Get the current booking
    const booking = await prisma.venueBooking.findUnique({
      where: { id: bookingId }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
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
        data: { status: 'Rejected' }
      })
    ])

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Error rejecting venue request:', error)
    return NextResponse.json(
      { error: 'Failed to reject venue request' },
      { status: 500 }
    )
  }
} 