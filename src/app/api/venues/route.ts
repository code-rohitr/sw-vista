import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering
    const url = new URL(request.url)
    const location = url.searchParams.get("location")
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")

    // Build the where clause based on filters
    const where: any = {}
    if (location) {
      where.location = location
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ]
    }

    // Fetch venues with related data
    const venues = await prisma.venue.findMany({
      where,
      include: {
        catalogue: true,
        bookings: {
          where: {
            event_date: {
              gte: new Date(),
            },
          },
          orderBy: {
            event_date: "asc",
          },
          take: 1,
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Transform the data to include availability status
    const transformedVenues = venues.map((venue) => ({
      ...venue,
      status: venue.bookings.length > 0 ? "booked" : "available",
      nextBooking: venue.bookings[0] || null,
    }))

    // Filter by status if specified
    const filteredVenues = status
      ? transformedVenues.filter((venue) => venue.status === status)
      : transformedVenues

    return NextResponse.json(filteredVenues)
  } catch (error) {
    console.error("Error fetching venues:", error)
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only SWO can add venues
    if (session.user?.role !== 'SWO') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { name, location, capacity, description, image_url } = body

    // Validate required fields
    if (!name || !location || !capacity) {
      return NextResponse.json(
        { error: "Name, location, and capacity are required" },
        { status: 400 }
      )
    }

    // Create venue
    const venue = await prisma.venue.create({
      data: {
        name,
        location,
        capacity: parseInt(capacity),
        description,
        image_url,
      },
    })

    return NextResponse.json(venue)
  } catch (error) {
    console.error("Error creating venue:", error)
    return NextResponse.json(
      { error: "Failed to create venue" },
      { status: 500 }
    )
  }
} 