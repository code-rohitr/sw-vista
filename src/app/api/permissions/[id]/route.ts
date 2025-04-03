import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user has permission to view permissions
    const authResult = await requirePermission('view', '/api/permissions')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Await the params object before accessing its properties
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Fetch the permission by ID
    const permission = await prisma.permissions.findUnique({
      where: { id },
      include: {
        permissionResources: {
          include: {
            resource: true
          }
        }
      }
    });

    if (!permission) {
      return NextResponse.json(
        { message: 'Permission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(permission);
  } catch (error) {
    console.error('Error fetching permission:', error);
    return NextResponse.json(
      { message: 'Failed to fetch permission' },
      { status: 500 }
    );
  }
} 