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

    // Get all entities that the user is a member of
    const userEntities = await prisma.entityMembers.findMany({
      where: {
        user_id: user.id
      },
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            description: true,
            entity_type_id: true,
            entityType: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        entityRole: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Format the response
    const entities = userEntities.map(membership => ({
      id: membership.entity.id,
      name: membership.entity.name,
      description: membership.entity.description,
      type: membership.entity.entityType.name,
      role: membership.entityRole.name
    }));

    return NextResponse.json(entities);
  } catch (error) {
    console.error('Error fetching user entities:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user entities' },
      { status: 500 }
    );
  }
}