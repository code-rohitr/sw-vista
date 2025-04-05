import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/middleware/roleCheck';

// GET /api/venues/[id]/approvals - Get all approvals for a venue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and check permissions
    const authResult = await requirePermission('view', '/api/venues/approvals', 'id')(request);
    if (!authResult.isAuthorized) {
      return authResult;
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Get all approvals for this venue
    const approvals = await prisma.approval.findMany({
      where: {
        entity_id: id,
      },
      include: {
        approver: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error('Error fetching venue approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue approvals' },
      { status: 500 }
    );
  }
}

// POST /api/venues/[id]/approvals - Create a new approval for a venue
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and check permissions
    const authResult = await requirePermission('create', '/api/venues/approvals', 'id')(request);
    if (!authResult.isAuthorized) {
      return authResult;
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const { approver_id, status, comments } = await request.json();

    // Validate input
    if (!approver_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if venue exists
    const venue = await prisma.venue.findUnique({
      where: { id },
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Create approval
    const approval = await prisma.approval.create({
      data: {
        entity_id: id,
        approver_id,
        status,
        comments,
      },
      include: {
        approver: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(approval);
  } catch (error) {
    console.error('Error creating venue approval:', error);
    return NextResponse.json(
      { error: 'Failed to create venue approval' },
      { status: 500 }
    );
  }
} 