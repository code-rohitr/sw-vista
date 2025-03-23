import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to view entities
    const authResult = await requirePermission('view', '/api/entities')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity ID' },
        { status: 400 }
      );
    }

    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        entityType: true,
        entityMembers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            entityRole: true,
          },
        },
      },
    });

    if (!entity) {
      return NextResponse.json(
        { message: 'Entity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error fetching entity details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity details' },
      { status: 500 }
    );
  }
}
