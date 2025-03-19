import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/entity-members/[id] - Get a specific entity member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity member ID' },
        { status: 400 }
      );
    }

    // Get entity member
    const entityMember = await prisma.entityMembers.findUnique({
      where: { id },
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
    });

    if (!entityMember) {
      return NextResponse.json(
        { message: 'Entity member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entityMember);
  } catch (error) {
    console.error('Error fetching entity member:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entity member' },
      { status: 500 }
    );
  }
}

// PUT /api/entity-members/[id] - Update a specific entity member's role
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity member ID' },
        { status: 400 }
      );
    }

    // Get entity member
    const entityMember = await prisma.entityMembers.findUnique({
      where: { id },
      include: {
        entity: true
      }
    });

    if (!entityMember) {
      return NextResponse.json(
        { message: 'Entity member not found' },
        { status: 404 }
      );
    }

    // Check if user has godmode role or is an admin of the entity
    if (user.role?.name !== 'godmode') {
      // Check if user is an admin of the entity
      const isEntityAdmin = await prisma.entityMembers.findFirst({
        where: {
          entity_id: entityMember.entity_id,
          user_id: user.id,
          entityRole: {
            name: 'Admin' // Assuming 'Admin' is the role name for entity administrators
          }
        }
      });
      
      if (!isEntityAdmin) {
        return NextResponse.json(
          { message: 'Only godmode users or entity admins can update entity members' },
          { status: 403 }
        );
      }
    }

    // Get request body
    const { entity_role_id } = await request.json();

    // Validate input
    if (!entity_role_id) {
      return NextResponse.json(
        { message: 'Entity role ID is required' },
        { status: 400 }
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

    if (entityRole.entity_type_id !== entityMember.entity.entity_type_id) {
      return NextResponse.json(
        { message: 'Entity role does not belong to the entity type' },
        { status: 400 }
      );
    }

    // Update entity member
    const updatedEntityMember = await prisma.entityMembers.update({
      where: { id },
      data: {
        entity_role_id
      }
    });

    // Log action
    await prisma.auditLogs.create({
      data: {
        user_id: user.id,
        entity_type: 'entity_member',
        entity_id: updatedEntityMember.id,
        action: 'update_entity_member',
      },
    });

    return NextResponse.json(updatedEntityMember);
  } catch (error) {
    console.error('Error updating entity member:', error);
    return NextResponse.json(
      { message: 'Failed to update entity member' },
      { status: 500 }
    );
  }
}

// DELETE /api/entity-members/[id] - Delete a specific entity member
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid entity member ID' },
        { status: 400 }
      );
    }

    // Get entity member
    const entityMember = await prisma.entityMembers.findUnique({
      where: { id }
    });

    if (!entityMember) {
      return NextResponse.json(
        { message: 'Entity member not found' },
        { status: 404 }
      );
    }

    // Check if user has godmode role or is an admin of the entity
    if (user.role?.name !== 'godmode') {
      // Check if user is an admin of the entity
      const isEntityAdmin = await prisma.entityMembers.findFirst({
        where: {
          entity_id: entityMember.entity_id,
          user_id: user.id,
          entityRole: {
            name: 'Admin' // Assuming 'Admin' is the role name for entity administrators
          }
        }
      });
      
      if (!isEntityAdmin) {
        return NextResponse.json(
          { message: 'Only godmode users or entity admins can delete entity members' },
          { status: 403 }
        );
      }
    }

    // Delete entity member
    await prisma.entityMembers.delete({
      where: { id }
    });

    // Log action
    await prisma.auditLogs.create({
      data: {
        user_id: user.id,
        entity_type: 'entity_member',
        entity_id: id,
        action: 'delete_entity_member',
      },
    });

    return NextResponse.json({ message: 'Entity member deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity member:', error);
    return NextResponse.json(
      { message: 'Failed to delete entity member' },
      { status: 500 }
    );
  }
}