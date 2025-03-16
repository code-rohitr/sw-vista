import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import jwt from 'jsonwebtoken';

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
    include: {
      role: true, // Include the role information
    },
  });
  
  if (!user) {
    return null;
  }
  
  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!passwordMatch) {
    return null;
  }
  
  // Return user without password
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Gets a user by ID
 * @param id The user ID
 * @returns The user object without password if found, null otherwise
 */
export async function getUserById(id: number) {
  const user = await prisma.users.findUnique({
    where: { id },
    include: {
      role: true, // Include the role information
    },
  });
  
  if (!user) {
    return null;
  }
  
  // Return user without password
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Gets all permissions for a role
 * @param roleId The role ID
 * @returns Array of permission objects with resource information
 */
export async function getRolePermissions(roleId: number) {
  const rolePermissions = await prisma.rolePermissions.findMany({
    where: { role_id: roleId },
    include: {
      permission: true,
      resource: true,
    },
  });
  
  return rolePermissions;
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
 * @param userId The user ID
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
  // Get the user
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    return false;
  }
  
  // Get the user's role
  const role = await prisma.roles.findUnique({
    where: { id: user.role_id },
  });
  
  if (!role) {
    return false;
  }
  
  // If user has godmode role, allow all actions
  if (role.name === 'godmode') {
    return true;
  }
  
  // Get the resource by path
  const resource = await prisma.resources.findFirst({
    where: { path: resourcePath },
  });
  
  if (!resource) {
    return false;
  }
  
  // Check role permissions
  const rolePermissions = await prisma.rolePermissions.findMany({
    where: {
      role_id: user.role_id,
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
  
  if (rolePermissions.length > 0) {
    return true;
  }
  
  // If entityId is provided, check entity-specific permissions
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
 * Gets all permissions for a user, including role permissions and entity role permissions
 * @param userId The user ID
 * @returns Object with role permissions and entity permissions
 */
export async function getAllUserPermissions(userId: number) {
  // Get the user
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    return { rolePermissions: [], entityPermissions: [] };
  }
  
  // Get the user's role
  const role = await prisma.roles.findUnique({
    where: { id: user.role_id },
  });
  
  if (!role) {
    return { rolePermissions: [], entityPermissions: [] };
  }
  
  // Get role permissions
  const rolePermissions = await prisma.rolePermissions.findMany({
    where: {
      role_id: user.role_id,
    },
    include: {
      permission: true,
      resource: true,
    },
  });
  
  // Get entity memberships
  const entityMemberships = await prisma.entityMembers.findMany({
    where: {
      user_id: userId,
    },
    include: {
      entity: {
        include: {
          entityType: true,
        },
      },
      entityRole: true,
    },
  });
  
  // Get entity permissions for each membership
  const entityPermissionsPromises = entityMemberships.map(async (membership) => {
    const permissions = await prisma.entityRolePermissions.findMany({
      where: {
        entity_role_id: membership.entity_role_id,
      },
      include: {
        permission: true,
        resource: true,
      },
    });
    
    return {
      entity: membership.entity,
      entityRole: membership.entityRole,
      permissions,
    };
  });
  
  const entityPermissions = await Promise.all(entityPermissionsPromises);
  
  return {
    rolePermissions,
    entityPermissions,
  };
}
