import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create default permissions if they don't exist
  const defaultPermissions = [
    { name: 'view', description: 'Permission to view a resource', action: 'read' },
    { name: 'create', description: 'Permission to create a resource', action: 'create' },
    { name: 'update', description: 'Permission to update a resource', action: 'update' },
    { name: 'delete', description: 'Permission to delete a resource', action: 'delete' },
    { name: 'manage', description: 'Permission to manage a resource (all operations)', action: 'all' },
  ];

  const createdPermissions = await Promise.all(
    defaultPermissions.map(permission =>
      prisma.permissions.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      })
    )
  );
  console.log('Default permissions created');

  // Create default resources if they don't exist
  const defaultResources = [
    { name: 'users', path: '/api/users', description: 'User management' },
    { name: 'permissions', path: '/api/permissions', description: 'Permission management' },
    { name: 'resources', path: '/api/resources', description: 'Resource management' },
    { name: 'entity_types', path: '/api/entity-types', description: 'Entity type management' },
    { name: 'entities', path: '/api/entities', description: 'Entity management' },
    { name: 'entity_roles', path: '/api/entity-roles', description: 'Entity role management' },
    { name: 'audit_logs', path: '/api/audit-logs', description: 'Audit logs' },
    { name: 'reports', path: '/api/reports', description: 'Report management' },
  ];

  const createdResources = await Promise.all(
    defaultResources.map(resource =>
      prisma.resources.upsert({
        where: { name: resource.name },
        update: {},
        create: resource,
      })
    )
  );
  console.log('Default resources created');

  // Create System entity type
  const systemEntityType = await prisma.entityTypes.upsert({
    where: { name: 'System' },
    update: {},
    create: {
      name: 'System',
      description: 'System-wide administration',
    },
  });
  console.log('System entity type created');

  // Create System entity
  let systemEntity = await prisma.entity.findFirst({
    where: {
      name: 'System',
      entity_type_id: systemEntityType.id,
    },
  });

  if (!systemEntity) {
    systemEntity = await prisma.entity.create({
      data: {
        name: 'System',
        description: 'System administration entity',
        entity_type_id: systemEntityType.id,
      },
    });
  }
  console.log('System entity created');

  // Create System Admin role with all permissions
  const systemAdminRole = await prisma.entityRoles.upsert({
    where: {
      name_entity_type_id: {
        name: 'System Admin',
        entity_type_id: systemEntityType.id
      }
    },
    update: {
      description: 'Full system administration privileges',
      entity_id: systemEntity.id,
      is_default: false,
    },
    create: {
      name: 'System Admin',
      description: 'Full system administration privileges',
      entity_id: systemEntity.id,
      entity_type_id: systemEntityType.id,
      is_default: false,
    },
  });

  // First, create permission-resource mappings
  await Promise.all(
    createdPermissions.map(permission =>
      Promise.all(
        createdResources.map(resource =>
          prisma.permissionResources.upsert({
            where: {
              permission_id_resource_id: {
                permission_id: permission.id,
                resource_id: resource.id,
              }
            },
            update: {},
            create: {
              permission_id: permission.id,
              resource_id: resource.id,
            },
          })
        )
      )
    )
  );
  console.log('Permission-resource mappings created');

  // Then assign permissions to System Admin role with resources
  await Promise.all(
    createdPermissions.map(permission =>
      Promise.all(
        createdResources.map(resource =>
          prisma.entityRolePermissions.upsert({
            where: {
              entity_role_id_permission_id_resource_id: {
                entity_role_id: systemAdminRole.id,
                permission_id: permission.id,
                resource_id: resource.id,
              }
            },
            update: {},
            create: {
              entity_role_id: systemAdminRole.id,
              permission_id: permission.id,
              resource_id: resource.id,
            },
          })
        )
      )
    )
  );
  console.log('System Admin role and permissions created');

  // Create admin user
  const password = 'admin123'; // You should change this in production
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  let adminUser = await prisma.users.findUnique({
    where: { username: 'admin' }
  });

  if (!adminUser) {
    adminUser = await prisma.users.create({
      data: {
        username: 'admin',
        email: 'admin@system.com',
        password_hash,
      },
    });
  }

  // Assign admin user to System entity with System Admin role
  const existingMember = await prisma.entityMembers.findFirst({
    where: {
      entity_id: systemEntity.id,
      user_id: adminUser.id,
    }
  });

  if (!existingMember) {
    await prisma.entityMembers.create({
      data: {
        entity_id: systemEntity.id,
        user_id: adminUser.id,
        entity_role_id: systemAdminRole.id,
      },
    });
  } else {
    await prisma.entityMembers.update({
      where: { id: existingMember.id },
      data: { entity_role_id: systemAdminRole.id }
    });
  }
  console.log('Admin user created and assigned as System Admin');

  // Create default entity types if they don't exist
  const defaultEntityTypes = [
    { name: 'department', description: 'Department entity type' },
    { name: 'team', description: 'Team entity type' },
    { name: 'project', description: 'Project entity type' },
  ];

  for (const entityType of defaultEntityTypes) {
    await prisma.entityTypes.upsert({
      where: { name: entityType.name },
      update: {},
      create: entityType,
    });
  }
  console.log('Default entity types created');

  console.log('Seed completed successfully');
  console.log('Admin user credentials:');
  console.log('Username: admin');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
