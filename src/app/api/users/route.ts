import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requirePermission } from '@/middleware/roleCheck';
import { isSystemAdmin } from '@/lib/auth';

// Define the query type
type UserQuery = {
  include: {
    entityMembers: {
      include: {
        entity: {
          include: {
            entityType: true;
          };
        };
        entityRole: {
          include: {
            template: true;
            entityRolePermissions: {
              include: {
                permission: true;
                resource: true;
              };
            };
          };
        };
      };
    };
  };
  orderBy: {
    created_at: 'desc';
  };
};

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      console.log(user,"user")
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is System Admin
    if (!user.isSystemAdmin) {
      return NextResponse.json(
        { message: 'Only System Admins can view all users' },
        { status: 403 }
      );
    }

    // Build query
    const query: UserQuery = {
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
      orderBy: { created_at: 'desc' }
    };

    // Get all users
    const users = await prisma.users.findMany(query);

    // Remove password_hash from response
    const usersWithoutPassword = users.map(({ password_hash, ...user }) => user);

    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
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
        { message: 'Only System Admins can create users' },
        { status: 403 }
      );
    }

    // Get request body
    const { username, password, email } = await request.json();

    // Validate input
    if (!username || !password || !email) {
      return NextResponse.json(
        { message: 'Username, password, and email are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.users.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.users.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.users.create({
      data: {
        username,
        password_hash,
        email,
      },
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

    // Remove password_hash from response
    const { password_hash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/:id - Update a user
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

    // Check if user is System Admin or updating their own profile
    if (!user.isSystemAdmin && user.id !== params.id) {
      return NextResponse.json(
        { message: 'You can only update your own profile' },
        { status: 403 }
      );
    }

    // Get request body
    const { email, password } = await request.json();

    // Build update data
    const updateData: Prisma.usersUpdateInput = {
      email,
    };

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: params.id },
      data: updateData,
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

    // Remove password_hash from response
    const { password_hash: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/:id - Delete a user
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
        { message: 'Only System Admins can delete users' },
        { status: 403 }
      );
    }

    // Check if user is trying to delete themselves
    if (user.id === params.id) {
      return NextResponse.json(
        { message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user and related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all entity memberships
      await tx.entityMembers.deleteMany({
        where: { user_id: params.id }
      });

      // Delete all user sessions
      await tx.userSession.deleteMany({
        where: { user_id: params.id }
      });

      // Delete all audit logs
      await tx.auditLog.deleteMany({
        where: { user_id: params.id }
      });

      // Delete all API usage records
      await tx.apiUsage.deleteMany({
        where: { user_id: params.id }
      });

      // Delete the user
      await tx.users.delete({
        where: { id: params.id }
      });
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
