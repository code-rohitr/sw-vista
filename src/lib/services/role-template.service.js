const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auditService = require('./audit.service');

class RoleTemplateService {
  async createTemplate(data, userId) {
    const template = await prisma.roleTemplate.create({
      data: {
        name: data.name,
        description: data.description
      }
    });

    // Create initial version
    await this.createVersion(template.id, {
      version_number: 1,
      changes: { type: 'initial' },
      permissions: data.permissions,
      created_by: userId
    });

    await auditService.logAction({
      userId,
      entityType: 'roleTemplate',
      action: 'create',
      details: { templateId: template.id }
    });

    return template;
  }

  async createVersion(templateId, data) {
    const latestVersion = await prisma.roleTemplateVersion.findFirst({
      where: { template_id: templateId },
      orderBy: { version_number: 'desc' }
    });

    const versionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    const version = await prisma.roleTemplateVersion.create({
      data: {
        template_id: templateId,
        version_number: versionNumber,
        changes: data.changes,
        permissions: data.permissions,
        created_by: data.created_by
      }
    });

    await auditService.logAction({
      userId: data.created_by,
      entityType: 'roleTemplateVersion',
      action: 'create',
      details: { 
        templateId,
        versionNumber,
        changes: data.changes
      }
    });

    return version;
  }

  async getTemplateVersions(templateId) {
    return await prisma.roleTemplateVersion.findMany({
      where: { template_id: templateId },
      include: {
        creator: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: { version_number: 'desc' }
    });
  }

  async getTemplateVersion(templateId, versionNumber) {
    return await prisma.roleTemplateVersion.findUnique({
      where: {
        template_id_version_number: {
          template_id: templateId,
          version_number: versionNumber
        }
      },
      include: {
        creator: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
  }

  async compareVersions(templateId, version1, version2) {
    const [v1, v2] = await Promise.all([
      this.getTemplateVersion(templateId, version1),
      this.getTemplateVersion(templateId, version2)
    ]);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    const changes = {
      added: [],
      removed: [],
      modified: []
    };

    const v1Permissions = new Set(Object.keys(v1.permissions));
    const v2Permissions = new Set(Object.keys(v2.permissions));

    // Find added permissions
    for (const perm of v2Permissions) {
      if (!v1Permissions.has(perm)) {
        changes.added.push(perm);
      }
    }

    // Find removed permissions
    for (const perm of v1Permissions) {
      if (!v2Permissions.has(perm)) {
        changes.removed.push(perm);
      }
    }

    // Find modified permissions
    for (const perm of v1Permissions) {
      if (v2Permissions.has(perm) && v1.permissions[perm] !== v2.permissions[perm]) {
        changes.modified.push({
          permission: perm,
          oldValue: v1.permissions[perm],
          newValue: v2.permissions[perm]
        });
      }
    }

    return changes;
  }

  async rollbackToVersion(templateId, versionNumber, userId) {
    const version = await this.getTemplateVersion(templateId, versionNumber);
    if (!version) {
      throw new Error('Version not found');
    }

    // Create new version with the old permissions
    await this.createVersion(templateId, {
      version_number: version.version_number + 1,
      changes: { type: 'rollback', toVersion: versionNumber },
      permissions: version.permissions,
      created_by: userId
    });

    await auditService.logAction({
      userId,
      entityType: 'roleTemplate',
      action: 'rollback',
      details: { 
        templateId,
        toVersion: versionNumber
      }
    });
  }

  async applyTemplateToEntity(templateId, entityId, userId) {
    const template = await prisma.roleTemplate.findUnique({
      where: { id: templateId },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1
        }
      }
    });

    if (!template || !template.versions[0]) {
      throw new Error('Template or latest version not found');
    }

    const latestVersion = template.versions[0];
    const entityRole = await prisma.entityRoles.create({
      data: {
        name: template.name,
        description: template.description,
        entity_id: entityId,
        template_id: templateId,
        entityType_id: (await prisma.entity.findUnique({ where: { id: entityId } })).entityType_id
      }
    });

    // Apply permissions from template version
    for (const [permission, value] of Object.entries(latestVersion.permissions)) {
      if (value) {
        const permissionRecord = await prisma.permissions.findFirst({
          where: { name: permission }
        });

        if (permissionRecord) {
          await prisma.entityRolePermissions.create({
            data: {
              entity_role_id: entityRole.id,
              permission_id: permissionRecord.id,
              resource_id: (await prisma.resources.findFirst()).id // You might want to handle this differently
            }
          });
        }
      }
    }

    await auditService.logAction({
      userId,
      entityType: 'entityRole',
      action: 'create',
      details: { 
        templateId,
        entityId,
        entityRoleId: entityRole.id
      }
    });

    return entityRole;
  }
}

module.exports = new RoleTemplateService(); 