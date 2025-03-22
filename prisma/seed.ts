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
    { name: 'venues', path: '/api/venues', description: 'Venue management' },
    { name: 'venue_bookings', path: '/api/venue-bookings', description: 'Venue booking management' },
    { name: 'clubs', path: '/api/clubs', description: 'Club management' },
    { name: 'proposals', path: '/api/proposals', description: 'Proposal management' },
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

  // Create godmode entity type
  const godmodeEntityType = await prisma.entityTypes.upsert({
    where: { name: 'godmode' },
    update: {},
    create: {
      name: 'godmode',
      description: 'Entity type for godmode users with full system access',
    },
  });
  console.log('Godmode entity type created');

  // Create godmode entity
  let godmodeEntity = await prisma.entities.findFirst({
    where: {
      name: 'godmode',
      entity_type_id: godmodeEntityType.id,
    },
  });

  if (!godmodeEntity) {
    godmodeEntity = await prisma.entities.create({
      data: {
        name: 'godmode',
        description: 'Entity for godmode users with full system access',
        entity_type_id: godmodeEntityType.id,
      },
    });
  }
  console.log('Godmode entity created');

  // Create godmode role with all permissions
  const godmodeRole = await prisma.entityRoles.upsert({
    where: {
      name_entity_type_id: {
        name: 'godmode',
        entity_type_id: godmodeEntityType.id
      }
    },
    update: {
      description: 'Role with full system access',
      entity_id: godmodeEntity.id,
      is_default: true,
    },
    create: {
      name: 'godmode',
      description: 'Role with full system access',
      entity_id: godmodeEntity.id,
      entity_type_id: godmodeEntityType.id,
      is_default: true,
    },
  });

  // Assign all permissions to godmode role
  await Promise.all(
    createdResources.map(resource => {
      const managePermissionId = createdPermissions.find(p => p.name === 'manage')!.id;
      
      return prisma.entityRolePermissions.upsert({
        where: {
          entity_role_id_permission_id_resource_id: {
            entity_role_id: godmodeRole.id,
            permission_id: managePermissionId,
            resource_id: resource.id,
          }
        },
        update: {}, // No updates needed if it exists
        create: {
          entity_role_id: godmodeRole.id,
          permission_id: managePermissionId,
          resource_id: resource.id,
        },
      });
    })
  );
  console.log('Godmode role and permissions created');

  // Create godmode user
  const password = 'godmode123'; // You should change this in production
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  let godmodeUser = await prisma.users.findUnique({
    where: { username: 'godmode' }
  });

  // Create a role in the roles table first
  const systemRole = await prisma.roles.upsert({
    where: { name: 'godmode' },
    update: {
      description: 'System administrator role with full access'
    },
    create: {
      name: 'godmode',
      description: 'System administrator role with full access'
    }
  });

  if (!godmodeUser) {
    godmodeUser = await prisma.users.create({
      data: {
        username: 'godmode',
        email: 'godmode@system.com',
        password_hash,
        is_admin: true,
        role_id: systemRole.id, // Use the system role ID
      },
    });
  } else {
    // Update the existing user to ensure it has the godmode role
    godmodeUser = await prisma.users.update({
      where: { id: godmodeUser.id },
      data: { role_id: systemRole.id } // Use the system role ID
    });
  }

  // Assign godmode user to godmode entity with godmode role
  const existingMember = await prisma.entityMembers.findFirst({
    where: {
      entity_id: godmodeEntity.id,
      user_id: godmodeUser.id,
    }
  });

  if (!existingMember) {
    await prisma.entityMembers.create({
      data: {
        entity_id: godmodeEntity.id,
        user_id: godmodeUser.id,
        entity_role_id: godmodeRole.id,
      },
    });
  } else {
    await prisma.entityMembers.update({
      where: { id: existingMember.id },
      data: { entity_role_id: godmodeRole.id }
    });
  }
  console.log('Godmode user created and assigned to godmode entity');

  // Create default entity types if they don't exist
  const defaultEntityTypes = [
    { name: 'club', description: 'Club entity type' },
    { name: 'security', description: 'Security entity type' },
    { name: 'director', description: 'Director entity type' },
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
  console.log('Godmode user credentials:');
  console.log('Username: godmode');
  console.log('Password: godmode123');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
