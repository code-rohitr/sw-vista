import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { hasEntityAccess } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// GET /api/entities/[id] - Get a specific entity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if user has permission to view this entity
    const authResult = await requirePermission('view', '/api/entities', 'id')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Check if user has access to this entity
    const hasAccess = await hasEntityAccess(authResult.user.id, id);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to access this entity' },
        { status: 403 }
      );
    }

    // Get entity with related data
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        entityType: true,
        parent: true,
        children: true,
        entityMembers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            entityRole: {
              include: {
                template: true,
                entityRolePermissions: {
                  include: {
                    permission: true,
                    resource: true,
                  },
                },
              },
            },
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
    console.error('Error fetching entity:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity' },
      { status: 500 }
    );
  }
}

// PUT /api/entities/[id] - Update an entity
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if user has permission to update this entity
    const authResult = await requirePermission('update', '/api/entities', 'id')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Check if user has access to this entity
    const hasAccess = await hasEntityAccess(authResult.user.id, id);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to update this entity' },
        { status: 403 }
      );
    }

    // Get request body
    const { name, description, entityType_id: entity_type_id, parent_id } = await request.json();

    // If parent_id is provided, check if user has access to the parent entity
    if (parent_id) {
      const hasParentAccess = await hasEntityAccess(authResult.user.id, parent_id);
      if (!hasParentAccess) {
        return NextResponse.json(
          { message: 'You do not have permission to set this parent entity' },
          { status: 403 }
        );
      }
    }

    // Update entity
    const entity = await prisma.entity.update({
      where: { id },
      data: {
        name,
        description,
        entityType_id: entity_type_id,
        parent_id,
      },
      include: {
        entityType: true,
        parent: true,
        children: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        action: 'update_entity',
        details: { entityId: entity.id, name, entity_type_id, parent_id }
      }
    });

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error updating entity:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: 'An entity with this name already exists' },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { message: 'Failed to update entity' },
      { status: 500 }
    );
  }
}

// DELETE /api/entities/[id] - Delete an entity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if user has permission to delete this entity
    const authResult = await requirePermission('delete', '/api/entities', 'id')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Check if user has access to this entity
    const hasAccess = await hasEntityAccess(authResult.user.id, id);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this entity' },
        { status: 403 }
      );
    }

    // Check if entity has children
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!entity) {
      return NextResponse.json(
        { message: 'Entity not found' },
        { status: 404 }
      );
    }

    if (entity.children.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete entity with child entities' },
        { status: 400 }
      );
    }

    // Delete entity and related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all entity memberships
      await tx.entityMembers.deleteMany({
        where: { entity_id: id }
      });

      // Delete all entity roles
      await tx.entityRoles.deleteMany({
        where: { entity_id: id }
      });

      // Delete all ACLs
      await tx.entityAcl.deleteMany({
        where: { entity_id: id }
      });

      // Delete all workflow requests
      await tx.workflowRequest.deleteMany({
        where: { entity_id: id }
      });

      // Delete all venue bookings
      await tx.venueBooking.deleteMany({
        where: { entity_id: id }
      });

      // Delete all venues
      await tx.venue.deleteMany({
        where: { entity_id: id }
      });

      // Delete the entity
      await tx.entity.delete({
        where: { id }
      });
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'entity',
        action: 'delete_entity',
        details: { entityId: id, name: entity.name }
      }
    });

    return NextResponse.json({ message: 'Entity deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json(
      { message: 'Failed to delete entity' },
      { status: 500 }
    );
  }
}
