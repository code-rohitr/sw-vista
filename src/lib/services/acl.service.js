const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auditService = require('./audit.service');

class AclService {
  async createAcl(data, userId) {
    const acl = await prisma.entityAcl.create({
      data: {
        entity_id: data.entity_id,
        user_id: data.user_id,
        role_id: data.role_id,
        permission_type: data.permission_type,
        conditions: data.conditions,
        created_by: userId
      }
    });

    await auditService.logAction({
      userId,
      entityType: 'entityAcl',
      action: 'create',
      details: { 
        aclId: acl.id,
        entityId: data.entity_id,
        permissionType: data.permission_type
      }
    });

    return acl;
  }

  async checkAccess(userId, entityId, requiredPermission) {
    // Get user's roles in the entity
    const userRoles = await prisma.entityMembers.findMany({
      where: {
        user_id: userId,
        entity_id: entityId
      },
      include: {
        entityRole: true
      }
    });

    // Get direct ACLs for the user
    const userAcls = await prisma.entityAcl.findMany({
      where: {
        entity_id: entityId,
        user_id: userId
      }
    });

    // Get ACLs for user's roles
    const roleAcls = await prisma.entityAcl.findMany({
      where: {
        entity_id: entityId,
        role_id: {
          in: userRoles.map(ur => ur.entityRole.id)
        }
      }
    });

    // Check direct user ACLs
    for (const acl of userAcls) {
      if (this.matchesPermission(acl, requiredPermission)) {
        return true;
      }
    }

    // Check role-based ACLs
    for (const acl of roleAcls) {
      if (this.matchesPermission(acl, requiredPermission)) {
        return true;
      }
    }

    return false;
  }

  matchesPermission(acl, requiredPermission) {
    if (acl.permission_type === 'deny' && acl.permission_type === requiredPermission) {
      return false;
    }

    if (acl.permission_type === requiredPermission) {
      // Check conditions if they exist
      if (acl.conditions) {
        return this.evaluateConditions(acl.conditions);
      }
      return true;
    }

    return false;
  }

  evaluateConditions(conditions) {
    // Implement condition evaluation logic here
    // This could include checking time-based conditions, IP restrictions, etc.
    return true;
  }

  async getEntityAcls(entityId) {
    return await prisma.entityAcl.findMany({
      where: { entity_id: entityId },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        role: {
          select: {
            name: true,
            description: true
          }
        }
      }
    });
  }

  async updateAcl(aclId, data, userId) {
    const acl = await prisma.entityAcl.update({
      where: { id: aclId },
      data: {
        permission_type: data.permission_type,
        conditions: data.conditions
      }
    });

    await auditService.logAction({
      userId,
      entityType: 'entityAcl',
      action: 'update',
      details: { 
        aclId,
        changes: data
      }
    });

    return acl;
  }

  async deleteAcl(aclId, userId) {
    const acl = await prisma.entityAcl.delete({
      where: { id: aclId }
    });

    await auditService.logAction({
      userId,
      entityType: 'entityAcl',
      action: 'delete',
      details: { aclId }
    });

    return acl;
  }

  async getEffectivePermissions(userId, entityId) {
    const [userAcls, roleAcls] = await Promise.all([
      prisma.entityAcl.findMany({
        where: {
          entity_id: entityId,
          user_id: userId
        }
      }),
      prisma.entityAcl.findMany({
        where: {
          entity_id: entityId,
          role_id: {
            in: prisma.entityMembers.findMany({
              where: {
                user_id: userId,
                entity_id: entityId
              },
              select: { entity_role_id: true }
            }).then(members => members.map(m => m.entity_role_id))
          }
        }
      })
    ]);

    const permissions = new Set();

    // Process user ACLs
    for (const acl of userAcls) {
      if (acl.permission_type === 'deny') {
        permissions.delete(acl.permission_type);
      } else {
        permissions.add(acl.permission_type);
      }
    }

    // Process role ACLs
    for (const acl of roleAcls) {
      if (acl.permission_type === 'deny') {
        permissions.delete(acl.permission_type);
      } else {
        permissions.add(acl.permission_type);
      }
    }

    return Array.from(permissions);
  }
}

module.exports = new AclService(); 