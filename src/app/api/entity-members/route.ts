import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, requireEntityMembership } from '@/middleware/roleCheck';

/**
 * GET /api/entity-members
 * Get all entity members or filter by entity ID
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view entity members
    const authResult = await requirePermission('view', '/api/entity-members')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
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
            entityType: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        entityRole: true,
      },
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
      { message: 'Error fetching entity members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entity-members
 * Add a user to an entity with a specific role
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { entity_id, user_id, entity_role_id } = body;

    // Validate required fields
    if (!entity_id || !user_id || !entity_role_id) {
      return NextResponse.json(
        { message: 'Entity ID, user ID, and entity role ID are required' },
        { status: 400 }
      );
    }

    // Check if entity exists
    const entity = await prisma.entities.findUnique({
      where: { id: entity_id },
    });

    if (!entity) {
      return NextResponse.json(
        { message: 'Entity not found' },
        { status: 404 }
      );
    }

    // Check permissions - either global permission or entity-specific permission
    let authResult;
    let entityMembershipResult;
    let hasPermission = false;
    
    // First try with global permission
    authResult = await requirePermission('manage', '/api/entities', 'entityId')(request);
    
    if ('isAuthorized' in authResult) {
      // User has global permission
      hasPermission = true;
    } else {
      // Try with entity membership check
      entityMembershipResult = await requireEntityMembership('entityId', 'admin')(request);
      
      if ('isAuthorized' in entityMembershipResult) {
        // User has entity-specific permission
        hasPermission = true;
      } else {
        // User doesn't have any permission
        return entityMembershipResult;
      }
    }
    
    // At this point, either authResult or entityMembershipResult is valid

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if entity role exists and belongs to the entity's type
    const entityRole = await prisma.entityRoles.findUnique({
      where: { id: entity_role_id },
      include: {
        entityType: true,
      },
    });

    if (!entityRole) {
      return NextResponse.json(
        { message: 'Entity role not found' },
        { status: 404 }
      );
    }

    // Check if entity role belongs to the entity's type
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
          user_id,
        },
      },
    });

    if (existingMembership) {
      // Update the existing membership with the new role
      const updatedMembership = await prisma.entityMembers.update({
        where: {
          id: existingMembership.id,
        },
        data: {
          entity_role_id,
        },
      });

      // Get the user who made the request
      const requestUser = 'user' in authResult ? authResult.user : 
                         (entityMembershipResult && 'user' in entityMembershipResult) ? entityMembershipResult.user : 
                         { id: 0 }; // Fallback, should never happen

      // Log action
      await prisma.auditLogs.create({
        data: {
          user_id: requestUser.id,
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

    // Get the user who made the request
    const requestUser = 'user' in authResult ? authResult.user : 
                       (entityMembershipResult && 'user' in entityMembershipResult) ? entityMembershipResult.user : 
                       { id: 0 }; // Fallback, should never happen

    // Log action
    await prisma.auditLogs.create({
      data: {
        user_id: requestUser.id,
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
