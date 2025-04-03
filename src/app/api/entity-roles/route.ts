import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// Define the query type
type EntityRoleQuery = {
  include: {
    entityType: true;
    entityRolePermissions: {
      include: {
        permission: true;
        resource: true;
      };
    };
  };
  orderBy: {
    created_at: 'desc';
  };
  where?: {
    entityType_id?: string;
    entity_id?: string;
  };
};

// GET /api/entity-roles - Get all entity roles
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const entityTypeId = url.searchParams.get('entityTypeId');
    const entityId = url.searchParams.get('entityId');

    // Build query
    const query: EntityRoleQuery = {
      include: {
        entityType: true,
        entityRolePermissions: {
          include: {
            permission: true,
            resource: true,
          },
        },
      },
      orderBy: { created_at: 'desc' }
    };

    // Add filters if provided
    if (entityTypeId || entityId) {
      query.where = {};
      if (entityTypeId) {
        query.where.entityType_id = entityTypeId;
      }
      if (entityId) {
        query.where.entity_id = entityId;
      }
    }

    // Get all entity roles
    const entityRoles = await prisma.entityRoles.findMany(query);

    return NextResponse.json(entityRoles);
  } catch (error) {
    console.error('Error fetching entity roles:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity roles' },
      { status: 500 }
    );
  }
}

// POST /api/entity-roles - Create a new entity role
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is System Admin
    if (!user.isSystemAdmin) {
      return NextResponse.json(
        { message: 'Only System Admins can create entity roles' },
        { status: 403 }
      );
    }

    // Get request body
    const { name, description, entity_type_id } = await request.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: 'Entity role name is required' },
        { status: 400 }
      );
    }

    if (!entity_type_id) {
      return NextResponse.json(
        { message: 'Entity type ID is required' },
        { status: 400 }
      );
    }

    // Check if entity type exists
    const entityType = await prisma.entityTypes.findUnique({
      where: { id: entity_type_id }
    });

    if (!entityType) {
      return NextResponse.json(
        { message: 'Entity type not found' },
        { status: 404 }
      );
    }

    // Create entity role
    const entityRole = await prisma.entityRoles.create({
      data: {
        name,
        description,
        entity_type_id
      },
      include: {
        entityType: true,
        entityRolePermissions: {
          include: {
            permission: true,
            resource: true,
          },
        },
      }
    });

    return NextResponse.json(entityRole, { status: 201 });
  } catch (error) {
    console.error('Error creating entity role:', error);
    return NextResponse.json(
      { message: 'Failed to create entity role' },
      { status: 500 }
    );
  }
}

// PUT /api/entity-roles/:id - Update an entity role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is System Admin
    if (!user.isSystemAdmin) {
      return NextResponse.json(
        { message: 'Only System Admins can update entity roles' },
        { status: 403 }
      );
    }

    // Get request body
    const { name, description } = await request.json();

    // Update entity role
    const entityRole = await prisma.entityRoles.update({
      where: { id: params.id },
      data: {
        name,
        description
      },
      include: {
        entityType: true,
        entityRolePermissions: {
          include: {
            permission: true,
            resource: true,
          },
        },
      }
    });

    return NextResponse.json(entityRole);
  } catch (error) {
    console.error('Error updating entity role:', error);
    return NextResponse.json(
      { message: 'Failed to update entity role' },
      { status: 500 }
    );
  }
}

// DELETE /api/entity-roles/:id - Delete an entity role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is System Admin
    if (!user.isSystemAdmin) {
      return NextResponse.json(
        { message: 'Only System Admins can delete entity roles' },
        { status: 403 }
      );
    }

    // Delete entity role and its permissions in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all permissions for this role
      await tx.entityRolePermissions.deleteMany({
        where: { entity_role_id: params.id }
      });

      // Delete the role
      await tx.entityRoles.delete({
        where: { id: params.id }
      });
    });

    return NextResponse.json({ message: 'Entity role deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity role:', error);
    return NextResponse.json(
      { message: 'Failed to delete entity role' },
      { status: 500 }
    );
  }
}
