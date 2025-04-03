const sessionService = require('../lib/services/session.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function authMiddleware(req, res, next) {
  try {
    // Get session ID from cookie or Authorization header
    const sessionId = req.cookies.sessionId || req.headers.authorization?.split(' ')[1];

    if (!sessionId) {
      return res.status(401).json({ error: 'No session provided' });
    }

    // Validate session
    const session = await sessionService.validateSession(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Add user and session to request object
    req.user = session.user;
    req.session = session;

    // Log API usage
    await prisma.apiUsage.create({
      data: {
        user_id: session.user.id,
        endpoint: req.path,
        method: req.method,
        status_code: res.statusCode,
        response_time: Date.now() - req.startTime
      }
    });

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Middleware to check if user has required permissions
function checkPermissions(requiredPermissions) {
  return async (req, res, next) => {
    try {
      const userPermissions = await prisma.entityRolePermissions.findMany({
        where: {
          entityRole: {
            entityMembers: {
              some: {
                user_id: req.user.id
              }
            }
          }
        },
        include: {
          permission: true,
          resource: true
        }
      });

      const hasPermission = requiredPermissions.every(required => {
        return userPermissions.some(userPerm => 
          userPerm.permission.name === required.permission &&
          userPerm.resource.name === required.resource
        );
      });

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Middleware to check if user has access to specific entity
function checkEntityAccess(entityId) {
  return async (req, res, next) => {
    try {
      const hasAccess = await prisma.entityMembers.findFirst({
        where: {
          entity_id: entityId,
          user_id: req.user.id
        }
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'No access to this entity' });
      }

      next();
    } catch (error) {
      console.error('Entity access check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = {
  authMiddleware,
  checkPermissions,
  checkEntityAccess
}; 