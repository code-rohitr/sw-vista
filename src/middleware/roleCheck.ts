import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, checkPermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define return types for the middleware
type AuthResult = 
  | { isAuthorized: true; user: any }
  | NextResponse<{ message: string }>;

/**
 * Middleware to require a specific role
 * @param roleName The role name required to access the resource
 * @returns Middleware function that checks if the user has the required role
 */
export function requireRole(roleName: string) {
  return async (request: NextRequest): Promise<AuthResult> => {
    try {
      // Get token from header
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token
      const decoded = await verifyToken(token);
      if (!decoded) {
        return NextResponse.json(
          { message: 'Unauthorized: Invalid token' },
          { status: 401 }
        );
      }
      
      // Get user with role
      const user = await prisma.users.findUnique({
        where: { id: decoded.id },
        include: {
          role: true,
        },
      });
      
      if (!user) {
        return NextResponse.json(
          { message: 'Unauthorized: User not found' },
          { status: 401 }
        );
      }
      
      // Check if user has the required role
      if (user.role.name !== roleName && user.role.name !== 'godmode') {
        return NextResponse.json(
          { message: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }
      
      // Add user info to request
      return { isAuthorized: true, user };
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { message: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware to require a specific permission on a resource
 * @param action The action required (view, create, update, delete, manage)
 * @param resourcePath The resource path to check permissions for
 * @param entityIdParam Optional parameter name to extract entity ID from request
 * @returns Middleware function that checks if the user has the required permission
 */
export function requirePermission(action: string, resourcePath: string, entityIdParam?: string) {
  return async (request: NextRequest): Promise<AuthResult> => {
    try {
      // Get token from header
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token
      const decoded = await verifyToken(token);
      if (!decoded) {
        return NextResponse.json(
          { message: 'Unauthorized: Invalid token' },
          { status: 401 }
        );
      }
      
      // Get entity ID from request if entityIdParam is provided
      let entityId: number | undefined;
      if (entityIdParam) {
        // Extract entity ID from URL or request body
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const paramIndex = pathParts.findIndex(part => part === entityIdParam);
        
        if (paramIndex !== -1 && paramIndex < pathParts.length - 1) {
          entityId = parseInt(pathParts[paramIndex + 1]);
        } else {
          // Try to get from query params
          const queryParam = url.searchParams.get(entityIdParam);
          if (queryParam) {
            entityId = parseInt(queryParam);
          } else if (request.method !== 'GET') {
            // Try to get from request body for non-GET requests
            try {
              const body = await request.clone().json();
              if (body[entityIdParam]) {
                entityId = parseInt(body[entityIdParam]);
              }
            } catch (e) {
              // Ignore JSON parsing errors
            }
          }
        }
      }
      
      // Check if user has permission
      const hasPermission = await checkPermission(
        decoded.id,
        action,
        resourcePath,
        entityId
      );
      
      if (!hasPermission) {
        return NextResponse.json(
          { message: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }
      
      // Get user with role for request context
      const user = await prisma.users.findUnique({
        where: { id: decoded.id },
        include: {
          role: true,
        },
      });
      
      if (!user) {
        return NextResponse.json(
          { message: 'Unauthorized: User not found' },
          { status: 401 }
        );
      }
      
      // Add user info to request
      return { isAuthorized: true, user };
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { message: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware to require entity membership with a specific role
 * @param entityIdParam Parameter name to extract entity ID from request
 * @param roleName Optional role name required within the entity
 * @returns Middleware function that checks if the user is a member of the entity with the required role
 */
export function requireEntityMembership(entityIdParam: string, roleName?: string) {
  return async (request: NextRequest): Promise<AuthResult> => {
    try {
      // Get token from header
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token
      const decoded = await verifyToken(token);
      if (!decoded) {
        return NextResponse.json(
          { message: 'Unauthorized: Invalid token' },
          { status: 401 }
        );
      }
      
      // Get user with role
      const user = await prisma.users.findUnique({
        where: { id: decoded.id },
        include: {
          role: true,
        },
      });
      
      if (!user) {
        return NextResponse.json(
          { message: 'Unauthorized: User not found' },
          { status: 401 }
        );
      }
      
      // If user has godmode role, allow access
      if (user.role.name === 'godmode') {
        return { isAuthorized: true, user };
      }
      
      // Extract entity ID from URL or request body
      let entityId: number | undefined;
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const paramIndex = pathParts.findIndex(part => part === entityIdParam);
      
      if (paramIndex !== -1 && paramIndex < pathParts.length - 1) {
        entityId = parseInt(pathParts[paramIndex + 1]);
      } else {
        // Try to get from query params
        const queryParam = url.searchParams.get(entityIdParam);
        if (queryParam) {
          entityId = parseInt(queryParam);
        } else if (request.method !== 'GET') {
          // Try to get from request body for non-GET requests
          try {
            const body = await request.clone().json();
            if (body[entityIdParam]) {
              entityId = parseInt(body[entityIdParam]);
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
      }
      
      if (!entityId) {
        return NextResponse.json(
          { message: 'Bad Request: Entity ID not found' },
          { status: 400 }
        );
      }
      
      // Check if user is a member of the entity
      const membership = await prisma.entityMembers.findFirst({
        where: {
          entity_id: entityId,
          user_id: user.id,
        },
        include: {
          entityRole: true,
        },
      });
      
      if (!membership) {
        return NextResponse.json(
          { message: 'Forbidden: Not a member of this entity' },
          { status: 403 }
        );
      }
      
      // If roleName is provided, check if user has the required role
      if (roleName && membership.entityRole.name !== roleName) {
        return NextResponse.json(
          { message: 'Forbidden: Insufficient entity role' },
          { status: 403 }
        );
      }
      
      // Add user and membership info to request
      return {
        isAuthorized: true,
        user: {
          ...user,
          entityMembership: membership,
        },
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { message: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }
  };
}
