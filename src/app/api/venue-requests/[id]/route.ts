import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const bookingId = parseInt(id)
    
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const booking = await prisma.venueBooking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            role: true,
            club_memberships: {
              include: {
                club: true
              }
            }
          }
        },
        venue: true,
        reports: true,
        event_history: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Transform the data to match the frontend requirements
    const clubName = booking.user.club_memberships[0]?.club.name || 'N/A'
    
    const transformedBooking = {
      id: booking.id.toString(),
      clubName: clubName,
      event: booking.event_name,
      venue: `${booking.venue.location}, ${booking.venue.name}`,
      startDate: booking.event_date,
      endDate: new Date(booking.event_date.getTime() + 3 * 60 * 60 * 1000), // Assuming 3 hours duration
      applicationType: 'Technical', // This should come from somewhere
      applicationDate: booking.created_at.toLocaleDateString(),
      status: booking.status,
      reports: booking.reports,
      eventHistory: booking.event_history
    }

    return NextResponse.json(transformedBooking)
  } catch (error) {
    console.error('Error fetching venue booking details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch venue booking details' },
      { status: 500 }
    )
  }
} 