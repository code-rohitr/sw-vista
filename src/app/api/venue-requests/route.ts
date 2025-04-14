import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// Helper function to check for overlapping bookings
async function hasOverlappingBooking(venueId: number, startTime: Date, endTime: Date) {
  const overlappingBooking = await prisma.venueBooking.findFirst({
    where: {
      venue_id: venueId,
      status: {
        not: 0 // Exclude rejected bookings
      },
      OR: [
        // Case 1: New booking starts during an existing booking
        {
          start_time: {
            lte: startTime
          },
          end_time: {
            gt: startTime
          }
        },
        // Case 2: New booking ends during an existing booking
        {
          start_time: {
            lt: endTime
          },
          end_time: {
            gte: endTime
          }
        },
        // Case 3: New booking completely contains an existing booking
        {
          start_time: {
            gte: startTime
          },
          end_time: {
            lte: endTime
          }
        }
      ]
    },
    select: {
      event_name: true,
      start_time: true,
      end_time: true
    }
  })
  return overlappingBooking
}

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
        startDate: booking.start_time,
        endDate: booking.end_time,
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event_name, event_date, start_time, end_time, event_type, description, venue_id } = body

    // Convert dates to Date objects
    const startTime = new Date(start_time)
    const endTime = new Date(end_time)

    // Check for overlapping bookings
    const overlappingBooking = await hasOverlappingBooking(venue_id, startTime, endTime)
    if (overlappingBooking) {
      return NextResponse.json(
        { 
          error: 'Event timing collides with existing booking',
          existingBooking: overlappingBooking
        },
        { status: 400 }
      )
    }

    // Create the venue booking
    const booking = await prisma.venueBooking.create({
      data: {
        event_name,
        event_date: new Date(event_date),
        start_time: startTime,
        end_time: endTime,
        status: 1, // Initial status: Submitted
        user: {
          connect: { id: parseInt(session.user.id) }
        },
        venue: {
          connect: { id: venue_id }
        }
      }
    })

    // Create an audit log
    await prisma.auditLog.create({
      data: {
        user_id: parseInt(session.user.id),
        entity_type: 'venue_booking',
        entity_id: booking.id,
        action: 'create'
      }
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error creating venue booking:', error)
    return NextResponse.json(
      { error: 'Failed to create venue booking' },
      { status: 500 }
    )
  }
} 