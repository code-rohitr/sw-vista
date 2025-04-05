import { prisma } from '@/lib/prisma';

/**
 * Checks if a user has the required permission for a specific action on a resource
 * @param userId The ID of the user to check permissions for
 * @param action The action to check (create, read, update, delete)
 * @param resource The resource to check permissions for
 * @returns Promise that resolves to true if the user has permission, false otherwise
 */
export async function requirePermission(
  userId: string,
  action: string,
  resource: string
): Promise<boolean> {
  try {
    // Get the user's roles
    const userRoles = await prisma.entityMembers.findMany({
      where: {
        user_id: userId,
      },
      include: {
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

    // Check if the user has any roles with the required permission
    for (const userRole of userRoles) {
      if (!userRole.entityRole) continue;

      const permissions = userRole.entityRole.entityRolePermissions;
      
      for (const permission of permissions) {
        // Check if the permission matches the required action and resource
        if (
          permission.permission.action.toLowerCase() === action.toLowerCase() &&
          permission.resource.name.toLowerCase() === resource.toLowerCase()
        ) {
          return true;
        }
      }
    }

    // Check if the user is a system admin (they have all permissions)
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { is_system_admin: true },
    });

    if (user?.is_system_admin) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Checks if a user has permission to access a specific entity
 * @param userId The ID of the user to check permissions for
 * @param entityId The ID of the entity to check access for
 * @returns Promise that resolves to true if the user has access, false otherwise
 */
export async function hasEntityAccess(
  userId: string,
  entityId: string
): Promise<boolean> {
  try {
    // Check if the user is a member of the entity
    const membership = await prisma.entityMembers.findFirst({
      where: {
        user_id: userId,
        entity_id: entityId,
      },
    });

    if (membership) {
      return true;
    }

    // Check if the user is a system admin
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { is_system_admin: true },
    });

    if (user?.is_system_admin) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking entity access:', error);
    return false;
  }
}

/**
 * Checks if a user has permission to access a specific venue
 * @param userId The ID of the user to check permissions for
 * @param venueId The ID of the venue to check access for
 * @returns Promise that resolves to true if the user has access, false otherwise
 */
export async function hasVenueAccess(
  userId: string,
  venueId: string
): Promise<boolean> {
  try {
    // Get the venue to find its entity
    const venue = await prisma.venues.findUnique({
      where: { id: venueId },
      select: { entity_id: true },
    });

    if (!venue) {
      return false;
    }

    // Check if the user has access to the entity
    return hasEntityAccess(userId, venue.entity_id);
  } catch (error) {
    console.error('Error checking venue access:', error);
    return false;
  }
} 