import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const venueId = url.searchParams.get('venue_id')
    const date = url.searchParams.get('date')

    if (!venueId || !date) {
      return NextResponse.json(
        { error: 'Venue ID and date are required' },
        { status: 400 }
      )
    }

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const bookings = await prisma.venueBooking.findMany({
      where: {
        venue_id: parseInt(venueId),
        status: {
          not: 0 // Exclude rejected bookings
        },
        start_time: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        start_time: true,
        end_time: true
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching venue bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch venue bookings' },
      { status: 500 }
    )
  }
} 