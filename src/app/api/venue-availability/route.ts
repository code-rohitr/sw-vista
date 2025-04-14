import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { venue_id, start_time, end_time } = await req.json()

    if (!venue_id || !start_time || !end_time) {
      return NextResponse.json(
        {
          message: "Missing required fields",
          error: "venue_id, start_time, and end_time are required",
        },
        { status: 400 }
      )
    }

    // Convert string dates to Date objects
    const startDate = new Date(start_time)
    const endDate = new Date(end_time)

    // Check for overlapping bookings
    const overlappingBookings = await prisma.venueBooking.findMany({
      where: {
        venue_id: venue_id,
        status: {
          not: 0, // Not rejected
        },
        event_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        {
          message: "Venue is already booked for the selected time slot",
          available: false,
          overlappingBookings,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: "Venue is available for the selected time slot",
        available: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error checking venue availability:", error)
    return NextResponse.json(
      {
        message: "Error checking venue availability",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
} 