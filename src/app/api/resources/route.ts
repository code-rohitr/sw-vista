import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

/**
 * GET /api/resources
 * Get all resources
 */
export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resources = await prisma.resources.findMany();

    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { message: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resources
 * Create a new resource
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create resources
    await requirePermission(user.id, 'create', 'resources');

    const body = await request.json();
    const { name, path } = body;

    if (!name || !path) {
      return NextResponse.json(
        { message: 'Name and path are required' },
        { status: 400 }
      );
    }

    const resource = await prisma.resources.create({
      data: {
        name,
        path,
      },
    });

    // Log the action
    await prisma.auditLogs.create({
      data: {
        user_id: user.id,
        entity_type: 'resources',
        action: 'create',
        details: {
          resource_id: resource.id,
          name: resource.name,
          path: resource.path,
        },
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { message: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
