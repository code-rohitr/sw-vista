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
export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await prisma.entityRoles.findMany({
      include: {
        entityType: true,
        entity: true,
        template: true,
        entityRolePermissions: {
          include: {
            permission: true,
            resource: true,
          },
        },
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
    const { name, description, entity_type_id, entity_id, template_id } = await request.json();

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

    if (!entity_id) {
      return NextResponse.json(
        { message: 'Entity ID is required' },
        { status: 400 }
      );
    }

    if (!template_id) {
      return NextResponse.json(
        { message: 'Template ID is required' },
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

    // Check if entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: entity_id }
    });

    if (!entity) {
      return NextResponse.json(
        { message: 'Entity not found' },
        { status: 404 }
      );
    }

    // Check if template exists
    const template = await prisma.roleTemplate.findUnique({
      where: { id: template_id }
    });

    if (!template) {
      return NextResponse.json(
        { message: 'Role template not found' },
        { status: 404 }
      );
    }

    // Create entity role
    const entityRole = await prisma.entityRoles.create({
      data: {
        name,
        description,
        entityType: {
          connect: {
            id: entity_type_id
          }
        },
        entity: {
          connect: {
            id: entity_id
          }
        },
        template: {
          connect: {
            id: template_id
          }
        }
      },
      include: {
        entityType: true,
        entity: true,
        template: true,
        entityRolePermissions: {
          include: {
            permission: true,
            resource: true,
          },
        },
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'entityRole',
        action: 'create',
        details: JSON.stringify({
          id: entityRole.id,
          name,
          description,
          entityTypeId: entity_type_id,
          entityId: entity_id,
          templateId: template_id
        }),
      },
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
