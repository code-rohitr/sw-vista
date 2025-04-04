import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import bcrypt from 'bcrypt';
import { isSystemAdmin, verifyAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// Get a specific user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to view users
    const authResult = await requirePermission('view', '/api/users')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const { id } = params;
    
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        created_at: true,
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
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is a System Admin
    const isAdmin = await isSystemAdmin(id);
    
    return NextResponse.json({
      ...user,
      isSystemAdmin: isAdmin,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Error fetching user' },
      { status: 500 }
    );
  }
}

// Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { username, email, password, entity_id, entity_role_id } = await request.json();

    // Verify authentication and get current user
    const currentUser = await verifyAuth(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update users
    const hasPermission = await requirePermission('update', '/api/users')(request);
    if ('isAuthorized' in hasPermission === false) {
      return hasPermission;
    }

    // Find the user to update
    const userToUpdate = await prisma.users.findUnique({
      where: { id },
      include: {
        entityMembers: true
      }
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Start a transaction to update user and entity membership
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user basic info
      const userUpdateData: Prisma.usersUpdateInput = {};
      if (username) userUpdateData.username = username;
      if (email) userUpdateData.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        userUpdateData.password_hash = await bcrypt.hash(password, salt);
      }

      const updatedUser = await tx.users.update({
        where: { id },
        data: userUpdateData,
        include: {
          entityMembers: {
            include: {
              entity: {
                include: {
                  entityType: true
                }
              },
              entityRole: {
                include: {
                  entityRolePermissions: {
                    include: {
                      permission: true,
                      resource: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Handle entity membership update if provided
      if (entity_id && entity_role_id) {
        // Delete existing entity memberships
        await tx.entityMembers.deleteMany({
          where: { user_id: id }
        });

        // Create new entity membership
        await tx.entityMembers.create({
          data: {
            user_id: id,
            entity_id,
            entity_role_id
          }
        });

        // Fetch updated user with new entity membership
        return await tx.users.findUnique({
          where: { id },
          include: {
            entityMembers: {
              include: {
                entity: {
                  include: {
                    entityType: true
                  }
                },
                entityRole: {
                  include: {
                    entityRolePermissions: {
                      include: {
                        permission: true,
                        resource: true
                      }
                    }
                  }
                }
              }
            }
          }
        });
      }

      return updatedUser;
    });

    // Check if user is a System Admin
    const isSystemAdminFlag = await isSystemAdmin(id);

    // Create audit log
    if (updatedUser) {
      await prisma.auditLog.create({
        data: {
          user_id: currentUser.id,
          entity_type: 'user',
          action: 'update_user',
          details: { userId: updatedUser.id }
        }
      });
    }

    // Return updated user with isSystemAdmin flag
    return NextResponse.json({
      ...updatedUser,
      isSystemAdmin: isSystemAdminFlag
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: 'Username or email already exists' },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error updating user' },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to delete users
    const authResult = await requirePermission('delete', '/api/users')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    const { id } = params;
    
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
    
    // Delete user and related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all entity memberships
      await tx.entityMembers.deleteMany({
        where: { user_id: id }
      });

      // Delete all user sessions
      await tx.userSession.deleteMany({
        where: { user_id: id }
      });

      // Delete all audit logs
      await tx.auditLog.deleteMany({
        where: { user_id: id }
      });

      // Delete all API usage records
      await tx.apiUsage.deleteMany({
        where: { user_id: id }
      });

      // Delete the user
      await tx.users.delete({
        where: { id }
      });
    });
    
    // Log this action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'user',
        action: 'delete_user',
        details: { userId: id }
      }
    });
    
    return NextResponse.json(
      { message: 'User deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Error deleting user' },
      { status: 500 }
    );
  }
}
