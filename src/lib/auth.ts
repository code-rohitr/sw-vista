import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import jwt from 'jsonwebtoken';

/**
 * Checks if a user has the System Admin role
 * @param userId The user ID to check
 * @returns True if the user has the System Admin role, false otherwise
 */
export async function isSystemAdmin(userId: number): Promise<boolean> {
  const systemMembership = await prisma.entityMembers.findFirst({
    where: {
      user_id: userId,
      entity: {
        name: 'System',
      },
      entityRole: {
        name: 'System Admin',
      },
    },
  });
  
  return !!systemMembership;
}

/**
 * Verifies user credentials and returns the user if valid
 * @param username The username to verify
 * @param password The password to verify
 * @returns The user object without password if credentials are valid, null otherwise
 */
export async function verifyCredentials(username: string, password: string) {
  // Find user by username
  const user = await prisma.users.findFirst({
    where: { username },
  });
  
  if (!user) {
    return null;
  }
  
  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!passwordMatch) {
    return null;
  }
  
  // Check if user is System Admin
  const isAdmin = await isSystemAdmin(user.id);

  // Get entity memberships
  const entityMembers = await prisma.entityMembers.findMany({
    where: { user_id: user.id },
    include: {
      entity: true,
      entityRole: true,
    },
  });

  // Return user without password
  const { password_hash, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    isSystemAdmin: isAdmin,
    entityMembers,
  };
}

/**
 * Gets a user by ID
 * @param id The user ID
 * @returns The user object without password if found, null otherwise
 */
export async function getUserById(id: number) {
  const user = await prisma.users.findUnique({
    where: { id },
  });
  
  if (!user) {
    return null;
  }
  
  // Check if user is System Admin
  const isAdmin = await isSystemAdmin(user.id);

  // Get entity memberships
  const entityMembers = await prisma.entityMembers.findMany({
    where: { user_id: user.id },
    include: {
      entity: true,
      entityRole: true,
    },
  });
  
  // Return user without password
  const { password_hash, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    isSystemAdmin: isAdmin,
    entityMembers,
  };
}

/**
 * Gets all permissions for an entity role
 * @param entityRoleId The entity role ID
 * @returns Array of permission objects with resource information
 */
export async function getEntityRolePermissions(entityRoleId: number) {
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
export async function getUserEntityMemberships(userId: number) {
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

/**
 * Checks if a user has permission to perform an action on a resource
 * @param userId The user ID to check
 * @param action The action to check (view, create, update, delete, manage)
 * @param resourcePath The resource path to check
 * @param entityId Optional entity ID to check entity-specific permissions
 * @returns True if the user has permission, false otherwise
 */
export async function checkPermission(
  userId: number,
  action: string,
  resourcePath: string,
  entityId?: number
): Promise<boolean> {
  // First check if user has godmode role
  const user = await prisma.users.findUnique({
    where: { id: userId }
  });
  if (user && user.username === 'admin') {
    return true;
  }
  
  // Then check if user is a System Admin
  const isAdmin = await isSystemAdmin(userId);
  if (isAdmin) {
    return true;
  }

  // Get the resource by path
  const resource = await prisma.resources.findFirst({
    where: { path: resourcePath },
  });
  
  if (!resource) {
    return false;
  }

  // Check entity-specific permissions
  if (entityId) {
    // Get user's membership in the entity
    const entityMembership = await prisma.entityMembers.findFirst({
      where: {
        entity_id: entityId,
        user_id: userId,
      },
      include: {
        entityRole: true,
      },
    });
    
    if (entityMembership) {
      // Check entity role permissions
      const entityRolePermissions = await prisma.entityRolePermissions.findMany({
        where: {
          entity_role_id: entityMembership.entity_role_id,
          resource_id: resource.id,
          permission: {
            OR: [
              { name: action },
              { name: 'manage' }, // 'manage' permission includes all actions
            ],
          },
        },
        include: {
          permission: true,
        },
      });
      
      if (entityRolePermissions.length > 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve) => {
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
      if (err) return resolve(null);
      resolve(decoded);
    });
  });
};

/**
 * Generates a JWT token for a user
 * @param payload The data to encode in the token
 * @returns The generated JWT token
 */
export const generateToken = (payload: any): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1d' }
  );
};

/**
 * Gets all permissions for a user
 * @param userId The user ID
 * @returns Object with system roles and entity permissions
 */
export async function getAllUserPermissions(userId: number) {
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

    // Verify token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as { id: number };

    // Get user from database with system roles
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
    });
    if (!user) {
      return null;
    }

    // Check if user is System Admin and get entity memberships
    const [isAdmin, entityMembers] = await Promise.all([
      isSystemAdmin(user.id),
      prisma.entityMembers.findMany({
        where: { user_id: user.id },
        include: {
          entity: true,
          entityRole: true,
        },
      }),
    ]);

    return {
      ...user,
      isSystemAdmin: isAdmin,
      entityMembers,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
