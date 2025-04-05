import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/middleware/roleCheck';

// GET /api/entities/[id]/venues - Get all venues for an entity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user has permission to view venues
    const authResult = await requirePermission('view', '/api/venues')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Await params to get the ID
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check if user has access to this entity's venues
    const userEntity = await prisma.entityMembers.findFirst({
      where: {
        user_id: authResult.user.id,
        entity_id: id,
      },
    });

    if (!userEntity && !authResult.user.isSystemAdmin) {
      return NextResponse.json(
        { message: 'You do not have access to this entity' },
        { status: 403 }
      );
    }

    // Get all venues for this entity
    const venues = await prisma.venue.findMany({
      where: {
        entity_id: id,
      },
      include: {
        entity: {
          include: {
            entityType: true,
          },
        },
        bookings: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            approver: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    return NextResponse.json(
      { message: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}

// POST /api/entities/[id]/venues - Create a new venue
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Verify authentication and check permissions
    const authResult = await requirePermission('create', 'venues', 'id')(request);
    if (!authResult.isAuthorized) {
      return authResult;
    }

    // Check if user has access to create venues for this entity
    const userEntity = await prisma.entityMember.findFirst({
      where: {
        user_id: authResult.user.id,
        entity_id: id,
        role: {
          name: 'ADMIN',
        },
      },
    });

    if (!userEntity && !authResult.user.isSystemAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to create venues for this entity' },
        { status: 403 }
      );
    }

    const { name, description, capacity, location, approvalUsers } = await request.json();

    // Validate input
    if (!name || !description || !capacity || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create venue with approval sequence
    const venue = await prisma.venue.create({
      data: {
        name,
        description,
        capacity: parseInt(capacity),
        location,
        entity_id: id,
        approvalUsers: {
          create: approvalUsers.map((userId: string, index: number) => ({
            user_id: userId,
            sequence: index + 1,
          })),
        },
      },
      include: {
        approvalUsers: {
          include: {
            user: true,
          },
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    return NextResponse.json(venue);
  } catch (error) {
    console.error('Error creating venue:', error);
    return NextResponse.json(
      { error: 'Failed to create venue' },
      { status: 500 }
    );
  }
} 