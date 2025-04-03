import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { verifyToken } from './jwt';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

const ADMIN_USERNAME = 'admin';

/**
 * Checks if a user has the System Admin role
 * @param userId The user ID to check
 * @returns True if the user has the System Admin role, false otherwise
 */
export async function isSystemAdmin(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { username: true }
  });
  
  return user?.username === ADMIN_USERNAME;
}

/**
 * Verifies user credentials and returns the user if valid
 * @param username The username to verify
 * @param password The password to verify
 * @returns The user object without password if credentials are valid, null otherwise
 */
export async function verifyCredentials(username: string, password: string) {
  const user = await prisma.users.findUnique({
    where: { username },
    include: {
      entityMembers: {
        include: {
          entity: true,
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

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  const isAdmin = user.username === ADMIN_USERNAME;
  return {
    ...user,
    isSystemAdmin: isAdmin,
  };
}

/**
 * Gets a user by ID
 * @param id The user ID
 * @returns The user object without password if found, null otherwise
 */
export async function getUserById(id: string) {
  const user = await prisma.users.findUnique({
    where: { id },
    include: {
      entityMembers: {
        include: {
          entity: true,
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
  
  if (!user) {
    return null;
  }

  // Get entity memberships with all necessary relations
  const entityMemberships = await prisma.entityMembers.findMany({
    where: { user_id: user.id },
    include: {
      entity: {
        include: {
          entityType: true
        }
      },
      entityRole: {
        include: {
          template: true,
          entityRolePermissions: {
            include: {
              permission: true,
              resource: true
            }
          }
        }
      }
    }
  });
  
  // Return user without password and with admin status
  const { password_hash, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    isSystemAdmin: user.username === ADMIN_USERNAME,
    entityMemberships: entityMemberships.map(membership => ({
      entity: membership.entity,
      entityRole: membership.entityRole
    }))
  };
}

/**
 * Gets all permissions for an entity role
 * @param entityRoleId The entity role ID
 * @returns Array of permission objects with resource information
 */
export async function getEntityRolePermissions(entityRoleId: string) {
  const entityRolePermissions = await prisma.entityRolePermissions.findMany({
    where: { entity_role_id: entityRoleId },
    include: {
      permission: true,
      resource: true,
    },
  });
  
  return entityRolePermissions;
}

/**
 * Gets all entity memberships for a user
 * @param userId The user ID
 * @returns Array of entity membership objects with entity and role information
 */
export async function getUserEntityMemberships(userId: string) {
  const entityMemberships = await prisma.entityMembers.findMany({
    where: { user_id: userId },
    include: {
      entity: {
        include: {
          entityType: true,
        },
      },
      entityRole: true,
    },
  });
  
  return entityMemberships;
}

async function isEntityChild(childId: string, parentId: string): Promise<boolean> {
  const entity = await prisma.entity.findUnique({
    where: { id: childId },
    select: { parent_id: true }
  });

  if (!entity) {
    return false;
  }

  if (entity.parent_id === parentId) {
    return true;
  }

  if (entity.parent_id) {
    return isEntityChild(entity.parent_id, parentId);
  }

  return false;
}

/**
 * Checks if a user has permission to perform an action on a resource
 * @param userId The user ID to check
 * @param action The action to check (view, create, update, delete, manage)
 * @param resourcePath The resource path to check
 * @param entityId Optional entity ID to check entity-specific permissions
 * @returns True if the user has permission, false otherwise
 */
export async function checkPermission(
  userId: string,
  action: string,
  resourcePath: string,
  entityId?: string
): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      entityMembers: {
        include: {
          entity: true,
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

  if (!user) {
    return false;
  }

  if (isSystemAdmin(user.username)) {
    return true;
  }

  return user.entityMembers.some(membership => {
    const role = membership.entityRole;
    
    if (role.template) {
      try {
        const templatePermissions = JSON.parse(role.template.permissions);
        if (templatePermissions.includes(action)) {
          return true;
        }
      } catch (error) {
        console.error('Error parsing template permissions:', error);
      }
    }

    return role.entityRolePermissions.some(erp => {
      const permission = erp.permission;
      const resource = erp.resource;

      if (permission.action === action && resource.path === resourcePath) {
        if (permission.scope) {
          switch (permission.scope) {
            case 'own':
              return membership.entity.id === entityId;
            case 'child':
              return entityId ? isEntityChild(membership.entity.id, entityId) : false;
            case 'all':
              return true;
            default:
              return false;
          }
        }
        return true;
      }
      return false;
    });
  });
}

/**
 * Gets all permissions for a user
 * @param userId The user ID
 * @returns Object with system roles and entity permissions
 */
export async function getAllUserPermissions(userId: string) {
  // Get all entity memberships
  const entityMemberships = await prisma.entityMembers.findMany({
    where: { user_id: userId },
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

  return { entityMemberships };
}

// Verify authentication from request
export async function verifyAuth(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    // Verify token using verifyToken from jwt.ts
    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    // Get user from database with system roles
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
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
                template: true,
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

    if (!user) {
      return null;
    }

    const { password_hash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      isSystemAdmin: decoded.isSystemAdmin,
      entityMemberships: user.entityMembers.map(membership => ({
        entity: membership.entity,
        entityRole: membership.entityRole
      }))
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Checks if a user has access to an entity
 * @param userId The user ID to check
 * @param entityId The entity ID to check
 * @returns True if the user has access to the entity, false otherwise
 */
export async function hasEntityAccess(userId: string, entityId: string): Promise<boolean> {
  try {
    // First check if user has godmode role
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });
    if (user && user.username === 'godmode_admin') {
      return true;
    }

    // Then check if user is a System Admin
    const isAdmin = await isSystemAdmin(userId);
    if (isAdmin) {
      return true;
    }

    // Get user's entity memberships
    const entityMemberships = await prisma.entityMembers.findMany({
      where: {
        user_id: userId,
        entity_id: entityId
      }
    });

    // If user is a direct member of the entity, they have access
    if (entityMemberships.length > 0) {
      return true;
    }

    // Check if user has access through parent entities
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      select: { parent_id: true }
    });

    if (!entity) {
      return false;
    }

    // Recursively check parent entities
    if (entity.parent_id) {
      return hasEntityAccess(userId, entity.parent_id);
    }

    return false;
  } catch (error) {
    console.error('Error checking entity access:', error);
    return false;
  }
}

/**
 * Checks if a user has access to a venue
 * @param userId The user ID to check
 * @param venueId The venue ID to check
 * @returns True if the user has access to the venue, false otherwise
 */
export async function hasVenueAccess(userId: string, venueId: string): Promise<boolean> {
  try {
    // First check if user has godmode role
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });
    if (user && user.username === 'godmode_admin') {
      return true;
    }

    // Then check if user is a System Admin
    const isAdmin = await isSystemAdmin(userId);
    if (isAdmin) {
      return true;
    }

    // Get the venue
    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    });

    if (!venue) {
      return false;
    }

    // Check if user has access to the venue's entity
    return hasEntityAccess(userId, venue.entity_id);
  } catch (error) {
    console.error('Error checking venue access:', error);
    return false;
  }
}

/**
 * Checks if a user has system-wide access
 * @param userId The user ID to check
 * @returns True if the user has system-wide access, false otherwise
 */
export async function hasSystemAccess(userId: string): Promise<boolean> {
  try {
    // First check if user has godmode role
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });
    if (user && user.username === 'godmode_admin') {
      return true;
    }

    // Then check if user is a System Admin
    return isSystemAdmin(userId);
  } catch (error) {
    console.error('Error checking system access:', error);
    return false;
  }
}

/**
 * Middleware to require entity access
 * @param entityIdParam The name of the parameter containing the entity ID
 * @returns A middleware function that checks entity access
 */
export function requireEntityAccess(entityIdParam: string = 'id') {
  return async (request: NextRequest) => {
    try {
      const user = await verifyAuth(request);
      if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const entityId = request.nextUrl.searchParams.get(entityIdParam);
      if (!entityId) {
        return NextResponse.json({ message: 'Entity ID is required' }, { status: 400 });
      }

      const hasAccess = await hasEntityAccess(user.id, entityId);
      if (!hasAccess) {
        return NextResponse.json({ message: 'Access denied to this entity' }, { status: 403 });
      }

      return { isAuthorized: true, user };
    } catch (error) {
      console.error('Error in requireEntityAccess middleware:', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  };
}

