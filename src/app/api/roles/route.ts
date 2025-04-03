import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

export async function GET(request: Request) {
  try {
    // Check if user has permission to view roles
    const authResult = await requirePermission('view', '/api/roles')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Fetch all roles with their permissions and entity information
    const roles = await prisma.entityRoles.findMany({
      include: {
        entity: {
          include: {
            entityType: true,
          },
        },
        entityRolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
} 