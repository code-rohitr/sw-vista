import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'active'
    const role = url.searchParams.get('role') || session.user.role

    // Fetch venue bookings with related data
    const bookings = await prisma.venueBooking.findMany({
      where: {
        // Filter based on status if needed
        ...(status === 'active' && {
          status: {
            in: [1, 2, 3, 4] // All pending statuses
          }
        }),
        ...(status === 'approved' && { status: 5 }), // Final approval
        ...(status === 'rejected' && { status: 0 }) // Rejected
      },
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
        venue: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform the data to match the frontend requirements
    const transformedBookings = bookings.map(booking => {
      const clubName = booking.user.club_memberships[0]?.club.name || 'N/A'
      
      return {
        id: booking.id.toString(),
        name: clubName,
        event: booking.event_name,
        venue: `${booking.venue.location}, ${booking.venue.name}`,
        startDate: booking.event_date,
        endDate: new Date(booking.event_date.getTime() + 3 * 60 * 60 * 1000), // Assuming 3 hours duration
        applicationType: 'Technical', // This should come from somewhere
        applicationDate: booking.created_at.toLocaleDateString(),
        status: booking.status
      }
    })

    return NextResponse.json(transformedBookings)
  } catch (error) {
    console.error('Error fetching venue requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch venue requests' },
      { status: 500 }
    )
  }
} 