import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

// GET /api/entities/[id]/users - Get all admin users across all entities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and check permissions
    const authResult = await requirePermission('view', '/api/entities/[id]/users', 'id')(request);
    if (!authResult.isAuthorized) {
      return authResult;
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    console.log('Fetching admin users across all entities');

    // Get all users who are admins in any entity
    const users = await prisma.users.findMany({
      where: {
        entityMembers: {
          some: {
            entityRole: {
              name: {
                in: ['Admin', 'ADMIN', 'admin'],
                mode: 'insensitive'
              }
            }
          }
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        entityMembers: {
          where: {
            entityRole: {
              name: {
                in: ['Admin', 'ADMIN', 'admin'],
                mode: 'insensitive'
              }
            }
          },
          select: {
            entity: {
              select: {
                id: true,
                name: true
              }
            },
            entityRole: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        username: 'asc'
      }
    });

    console.log('Found admin users:', users.length);

    // Format the response to include which entities they are admins of
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      adminOf: user.entityMembers.map(member => ({
        id: member.entity.id,
        name: member.entity.name,
        role: member.entityRole.name
      }))
    }));

    console.log('Formatted users:', JSON.stringify(formattedUsers, null, 2));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
} 