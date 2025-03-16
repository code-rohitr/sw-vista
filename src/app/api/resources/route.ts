import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

/**
 * GET /api/resources
 * Get all resources
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view resources
    const authResult = await requirePermission('view', '/api/resources')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get all resources
    const resources = await prisma.resources.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { message: 'Error fetching resources' },
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
    // Check if user has permission to create resources
    const authResult = await requirePermission('create', '/api/resources')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Get request body
    const body = await request.json();
    const { name, path, description } = body;

    // Validate required fields
    if (!name || !path) {
      return NextResponse.json(
        { message: 'Name and path are required' },
        { status: 400 }
      );
    }

    // Check if resource already exists
    const existingResource = await prisma.resources.findFirst({
      where: {
        OR: [
          { name },
          { path },
        ],
      },
    });

    if (existingResource) {
      return NextResponse.json(
        { message: 'Resource with this name or path already exists' },
        { status: 400 }
      );
    }

    // Create resource
    const resource = await prisma.resources.create({
      data: {
        name,
        path,
        description,
      },
    });

    // Log action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'resource',
        entity_id: resource.id,
        action: 'create_resource',
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { message: 'Error creating resource' },
      { status: 500 }
    );
  }
}
