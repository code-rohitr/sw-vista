import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');

    if (!startParam || !endParam) {
      return NextResponse.json(
        { message: 'Start and end times are required' },
        { status: 400 }
      );
    }

    // Parse dates and add buffer time (30 minutes)
    const startDate = new Date(startParam);
    const endDate = new Date(endParam);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { message: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Add 30 min buffer before and after
    const bufferBefore = new Date(startDate);
    bufferBefore.setMinutes(bufferBefore.getMinutes() - 30);
    
    const bufferAfter = new Date(endDate);
    bufferAfter.setMinutes(bufferAfter.getMinutes() + 30);

    // Get all venues
    const allVenues = await prisma.venue.findMany();

    // Get bookings that overlap with the requested time (including buffer)
    const overlappingBookings = await prisma.venueBooking.findMany({
      where: {
        status: { in: ['approved', 'pending'] },
        OR: [
          {
            // Booking starts during the requested time (including buffer)
            AND: [
              { start_time: { gte: bufferBefore } },
              { start_time: { lt: bufferAfter } }
            ]
          },
          {
            // Booking ends during the requested time (including buffer)
            AND: [
              { end_time: { gt: bufferBefore } },
              { end_time: { lte: bufferAfter } }
            ]
          },
          {
            // Booking completely contains the requested time
            AND: [
              { start_time: { lte: bufferBefore } },
              { end_time: { gte: bufferAfter } }
            ]
          }
        ]
      },
      select: {
        venue_id: true
      }
    });

    // Get IDs of unavailable venues
    const unavailableVenueIds = new Set(overlappingBookings.map(booking => booking.venue_id));

    // Filter out unavailable venues
    const availableVenues = allVenues.filter(venue => !unavailableVenueIds.has(venue.id));

    return NextResponse.json(availableVenues);
  } catch (error) {
    console.error('Error finding available venues:', error);
    return NextResponse.json(
      { message: 'Failed to find available venues' },
      { status: 500 }
    );
  }
}