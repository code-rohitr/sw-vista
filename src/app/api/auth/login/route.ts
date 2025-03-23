import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCredentials, generateToken, isSystemAdmin } from '@/lib/auth';

interface EntityRolePermission {
  permission: {
    name: string;
  };
  resource: {
    name: string;
  };
}

interface EntityRole {
  id: number;
  name: string;
  entityRolePermissions: EntityRolePermission[];
}

interface Entity {
  id: number;
  name: string;
  entityType: {
    id: number;
    name: string;
  };
}

interface EntityMembership {
  id: number;
  entity: Entity;
  entityRole: EntityRole;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Verify credentials using the auth utility
    const user = await verifyCredentials(username, password);

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if user is System Admin
    const isAdmin = await isSystemAdmin(user.id);

    // Get all entity memberships
    const entityMemberships = await prisma.entityMembers.findMany({
      where: {
        user_id: user.id,
      },
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
    });

    // Generate JWT token with user info and admin status
    const token = generateToken({
      id: user.id,
      username: user.username,
      isSystemAdmin: isAdmin,
    });

    // Log successful login
    await prisma.auditLogs.create({
      data: {
        user_id: user.id,
        entity_type: 'auth',
        entity_id: user.id,
        action: 'LOGIN',
      },
    });

    // Extract permissions for the frontend
    const permissions: Record<string, string[]> = {};

    // Add entity role permissions
    entityMemberships.forEach((membership: EntityMembership) => {
      membership.entityRole.entityRolePermissions.forEach((erp: EntityRolePermission) => {
        const resourceName = erp.resource.name;
        const permissionName = erp.permission.name;
        
        if (!permissions[resourceName]) {
          permissions[resourceName] = [];
        }
        
        if (!permissions[resourceName].includes(permissionName)) {
          permissions[resourceName].push(permissionName);
        }
      });
    });

    // If user is System Admin, they have all permissions
    if (isAdmin) {
      const allResources = await prisma.resources.findMany();
      const allPermissions = await prisma.permissions.findMany();
      
      allResources.forEach(resource => {
        permissions[resource.name] = allPermissions.map(p => p.name);
      });
    }

    // Return user data, token, and permissions
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isSystemAdmin: isAdmin,
        entityMembers: entityMemberships.map((em: EntityMembership) => ({
          id: em.id,
          entity: em.entity,
          entityRole: em.entityRole,
        })),
      },
      permissions,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
