import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { requirePermission } from '@/middleware/roleCheck';
import { isSystemAdmin } from '@/lib/auth';

// Get all users
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view users
    const authResult = await requirePermission('view', '/api/users')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        entityMembers: {
          include: {
            entity: {
              include: {
                entityType: true,
              },
            },
            entityRole: {
              include: {
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

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Create a new user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { username, email, password, entity_id, entity_role_id } = data;

    console.log(data);
    
    if (!username || !email || !password || !entity_id || !entity_role_id) {
      return NextResponse.json({ 
        error: 'Username, email, password, entity, and role are required' 
      }, { status: 400 });
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create the user
    const user = await prisma.users.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
      },
    });
    
    // Create entity membership
    await prisma.entityMembers.create({
      data: {
        user_id: user.id,
        entity_id: entity_id,
        entity_role_id: entity_role_id,
      },
    });
    
    // Fetch the complete user with relationships
    const completeUser = await prisma.users.findUnique({
      where: { id: user.id },
      include: {
        entityMembers: {
          include: {
            entity: {
              include: {
                entityType: true,
              },
            },
            entityRole: {
              include: {
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

    // Check if the user is a System Admin
    const isAdmin = await isSystemAdmin(user.id);
    
    return NextResponse.json(completeUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// Update a user
export async function PUT(request: NextRequest) {
  try {
    // Check if user has permission to update users
    const authResult = await requirePermission('update', '/api/users')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const body = await request.json();
    const { id, username, email, password, entity_id, entity_role_id } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    // Update user and entity membership in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user
      const user = await tx.users.update({
        where: { id },
        data: updateData,
      });

      // Update entity membership if provided
      if (entity_id && entity_role_id) {
        // Check if entity exists
        const entity = await tx.entities.findUnique({
          where: { id: entity_id },
        });

        if (!entity) {
          throw new Error('Entity not found');
        }

        // Check if entity role exists and belongs to the entity
        const entityRole = await tx.entityRoles.findUnique({
          where: { id: entity_role_id },
        });

        if (!entityRole || entityRole.entity_id !== entity_id) {
          throw new Error('Invalid entity role');
        }

        // Update or create entity membership
        await tx.entityMembers.upsert({
          where: {
            entity_id_user_id: {
              entity_id,
              user_id: id,
            },
          },
          update: {
            entity_role_id,
          },
          create: {
            entity_id,
            user_id: id,
            entity_role_id,
          },
        });
      }

      // Return user with relationships
      const updatedUser = await tx.users.findUnique({
        where: { id },
        include: {
          entityMembers: {
            include: {
              entity: {
                include: {
                  entityType: true,
                },
              },
              entityRole: {
                include: {
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

      // Check if the user is a System Admin
      const isAdmin = await isSystemAdmin(id);

      return {
        ...updatedUser,
        isSystemAdmin: isAdmin,
      };
    });

    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = updatedUser;

    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'user',
        entity_id: id,
        action: 'update_user',
      }
    });

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error updating user' },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(request: NextRequest) {
  try {
    // Check if user has permission to delete users
    const authResult = await requirePermission('delete', '/api/users')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '');

    if (!id) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete user and related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete entity memberships
      await tx.entityMembers.deleteMany({
        where: { user_id: id },
      });

      // Delete user
      await tx.users.delete({
        where: { id },
      });
    });

    // Log this action
    await prisma.auditLogs.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'user',
        entity_id: id,
        action: 'delete_user',
      }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Error deleting user' },
      { status: 500 }
    );
  }
}
