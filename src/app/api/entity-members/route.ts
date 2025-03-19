import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/entity-members - Get all entity members
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId');
    const userId = url.searchParams.get('userId');

    // Build query
    const query: any = {
      include: {
        entity: {
          include: {
            entityType: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        },
        entityRole: true
      }
    };

    // Add filters if provided
    if (entityId || userId) {
      query.where = {};
      
      if (entityId) {
        query.where.entity_id = parseInt(entityId);
      }
      
      if (userId) {
        query.where.user_id = parseInt(userId);
      }
    }

    // Get entity members
    const entityMembers = await prisma.entityMembers.findMany(query);

    return NextResponse.json(entityMembers);
  } catch (error) {
    console.error('Error fetching entity members:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity members' },
      { status: 500 }
    );
  }
}

// POST /api/entity-members - Add a user to an entity with a specific role
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get request body first, before using its values
    const { entity_id, user_id, entity_role_id } = await request.json();

    // Validate input
    if (!entity_id || !user_id || !entity_role_id) {
      return NextResponse.json(
        { message: 'Entity ID, user ID, and entity role ID are required' },
        { status: 400 }
      );
    }

    // Check if user has godmode role or is an admin of the entity
    if (user.role?.name !== 'godmode') {
      // Check if user is an admin of the entity
      const isEntityAdmin = await prisma.entityMembers.findFirst({
        where: {
          entity_id,
          user_id: user.id,
          entityRole: {
            name: 'Admin' // Assuming 'Admin' is the role name for entity administrators
          }
        }
      });
      
      if (!isEntityAdmin) {
        return NextResponse.json(
          { message: 'Only godmode users or entity admins can manage entity members' },
          { status: 403 }
        );
      }
    }

    // Check if entity exists
    const entity = await prisma.entities.findUnique({
      where: { id: entity_id }
    });

    if (!entity) {
      return NextResponse.json(
        { message: 'Entity not found' },
        { status: 404 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.users.findUnique({
      where: { id: user_id }
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if entity role exists and belongs to the entity's type
    const entityRole = await prisma.entityRoles.findUnique({
      where: { id: entity_role_id }
    });

    if (!entityRole) {
      return NextResponse.json(
        { message: 'Entity role not found' },
        { status: 404 }
      );
    }

    if (entityRole.entity_type_id !== entity.entity_type_id) {
      return NextResponse.json(
        { message: 'Entity role does not belong to the entity type' },
        { status: 400 }
      );
    }

    // Check if user is already a member of the entity
    const existingMembership = await prisma.entityMembers.findUnique({
      where: {
        entity_id_user_id: {
          entity_id,
          user_id
        }
      }
    });

    if (existingMembership) {
      // Update the existing membership with the new role
      const updatedMembership = await prisma.entityMembers.update({
        where: {
          id: existingMembership.id
        },
        data: {
          entity_role_id
        }
      });

      // Log action
      await prisma.auditLogs.create({
        data: {
          user_id: user.id, // Use the authenticated user's ID
          entity_type: 'entity_member',
          entity_id: updatedMembership.id,
          action: 'update_entity_member',
        },
      });

      return NextResponse.json(updatedMembership);
    }

    // Create entity membership
    const entityMember = await prisma.entityMembers.create({
      data: {
        entity_id,
        user_id,
        entity_role_id,
      },
    });

    // Log action
    await prisma.auditLogs.create({
      data: {
        user_id: user.id, // Use the authenticated user's ID
        entity_type: 'entity_member',
        entity_id: entityMember.id,
        action: 'create_entity_member',
      },
    });

    return NextResponse.json(entityMember, { status: 201 });
  } catch (error) {
    console.error('Error creating entity member:', error);
    return NextResponse.json(
      { message: 'Error creating entity member' },
      { status: 500 }
    );
  }
}

// DELETE /api/entity-members - Remove a user from an entity
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId');
    const userId = url.searchParams.get('userId');

    // Validate input
    if (!entityId || !userId) {
      return NextResponse.json(
        { message: 'Entity ID and user ID are required' },
        { status: 400 }
      );
    }

    const entity_id = parseInt(entityId);
    const user_id = parseInt(userId);

    // Check if user has godmode role or is an admin of the entity
    if (user.role?.name !== 'godmode') {
      // Check if user is an admin of the entity
      const isEntityAdmin = await prisma.entityMembers.findFirst({
        where: {
          entity_id,
          user_id: user.id,
          entityRole: {
            name: 'Admin' // Assuming 'Admin' is the role name for entity administrators
          }
        }
      });
      
      if (!isEntityAdmin) {
        return NextResponse.json(
          { message: 'Only godmode users or entity admins can remove entity members' },
          { status: 403 }
        );
      }
    }

    // Check if membership exists
    const membership = await prisma.entityMembers.findUnique({
      where: {
        entity_id_user_id: {
          entity_id,
          user_id
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { message: 'User is not a member of this entity' },
        { status: 404 }
      );
    }

    // Delete membership
    await prisma.entityMembers.delete({
      where: {
        id: membership.id
      }
    });

    // Log action
    await prisma.auditLogs.create({
      data: {
        user_id: user.id,
        entity_type: 'entity_member',
        entity_id: membership.id,
        action: 'delete_entity_member',
      },
    });

    return NextResponse.json({ message: 'User removed from entity successfully' });
  } catch (error) {
    console.error('Error removing entity member:', error);
    return NextResponse.json(
      { message: 'Error removing entity member' },
      { status: 500 }
    );
  }
}
