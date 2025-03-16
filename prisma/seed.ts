import { PrismaClient } from '@prisma/client';

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

  for (const permission of defaultPermissions) {
    await prisma.permissions.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
  console.log('Default permissions created');

  // Create default resources if they don't exist
  const defaultResources = [
    { name: 'users', path: '/api/users', description: 'User management' },
    { name: 'roles', path: '/api/roles', description: 'Role management' },
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

  for (const resource of defaultResources) {
    await prisma.resources.upsert({
      where: { name: resource.name },
      update: {},
      create: resource,
    });
  }
  console.log('Default resources created');

  // Get all roles
  const roles = await prisma.roles.findMany();
  const userRole = roles.find(role => role.name === 'user');
  const adminRole = roles.find(role => role.name === 'admin');
  const godmodeRole = roles.find(role => role.name === 'godmode');

  if (!userRole || !adminRole || !godmodeRole) {
    throw new Error('Default roles not found');
  }

  // Get all permissions
  const permissions = await prisma.permissions.findMany();
  const viewPermission = permissions.find(p => p.name === 'view');
  const createPermission = permissions.find(p => p.name === 'create');
  const updatePermission = permissions.find(p => p.name === 'update');
  const deletePermission = permissions.find(p => p.name === 'delete');
  const managePermission = permissions.find(p => p.name === 'manage');

  if (!viewPermission || !createPermission || !updatePermission || !deletePermission || !managePermission) {
    throw new Error('Default permissions not found');
  }

  // Get all resources
  const resources = await prisma.resources.findMany();

  // Assign permissions to roles
  // User role: view access to most resources, create/update for some
  const userPermissions = [
    // View access to most resources
    { role_id: userRole.id, permission_id: viewPermission.id, resource_id: resources.find(r => r.name === 'venues')!.id },
    { role_id: userRole.id, permission_id: viewPermission.id, resource_id: resources.find(r => r.name === 'clubs')!.id },
    { role_id: userRole.id, permission_id: viewPermission.id, resource_id: resources.find(r => r.name === 'venue_bookings')!.id },
    
    // Create/update access to some resources
    { role_id: userRole.id, permission_id: createPermission.id, resource_id: resources.find(r => r.name === 'venue_bookings')!.id },
    { role_id: userRole.id, permission_id: updatePermission.id, resource_id: resources.find(r => r.name === 'venue_bookings')!.id },
    { role_id: userRole.id, permission_id: createPermission.id, resource_id: resources.find(r => r.name === 'proposals')!.id },
    { role_id: userRole.id, permission_id: createPermission.id, resource_id: resources.find(r => r.name === 'reports')!.id },
  ];

  // Admin role: manage access to most resources except users, roles, permissions
  const adminPermissions = [
    // Manage access to most resources
    { role_id: adminRole.id, permission_id: managePermission.id, resource_id: resources.find(r => r.name === 'venues')!.id },
    { role_id: adminRole.id, permission_id: managePermission.id, resource_id: resources.find(r => r.name === 'venue_bookings')!.id },
    { role_id: adminRole.id, permission_id: managePermission.id, resource_id: resources.find(r => r.name === 'clubs')!.id },
    { role_id: adminRole.id, permission_id: managePermission.id, resource_id: resources.find(r => r.name === 'proposals')!.id },
    { role_id: adminRole.id, permission_id: managePermission.id, resource_id: resources.find(r => r.name === 'reports')!.id },
    { role_id: adminRole.id, permission_id: managePermission.id, resource_id: resources.find(r => r.name === 'entities')!.id },
    
    // View access to users, roles, permissions
    { role_id: adminRole.id, permission_id: viewPermission.id, resource_id: resources.find(r => r.name === 'users')!.id },
    { role_id: adminRole.id, permission_id: viewPermission.id, resource_id: resources.find(r => r.name === 'roles')!.id },
    { role_id: adminRole.id, permission_id: viewPermission.id, resource_id: resources.find(r => r.name === 'permissions')!.id },
    { role_id: adminRole.id, permission_id: viewPermission.id, resource_id: resources.find(r => r.name === 'audit_logs')!.id },
  ];

  // Godmode role: manage access to all resources
  const godmodePermissions = resources.map(resource => ({
    role_id: godmodeRole.id,
    permission_id: managePermission.id,
    resource_id: resource.id,
  }));

  // Combine all permissions
  const allRolePermissions = [...userPermissions, ...adminPermissions, ...godmodePermissions];

  // Upsert role permissions
  for (const rp of allRolePermissions) {
    await prisma.rolePermissions.upsert({
      where: {
        role_id_permission_id_resource_id: {
          role_id: rp.role_id,
          permission_id: rp.permission_id,
          resource_id: rp.resource_id,
        },
      },
      update: {},
      create: rp,
    });
  }
  console.log('Role permissions assigned');

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

  // Get all entity types
  const entityTypes = await prisma.entityTypes.findMany();
  const clubEntityType = entityTypes.find(et => et.name === 'club');

  if (!clubEntityType) {
    throw new Error('Club entity type not found');
  }

  // Create default entity roles if they don't exist
  const defaultEntityRoles = [
    { entity_type_id: clubEntityType.id, name: 'member', description: 'Regular member of the club' },
    { entity_type_id: clubEntityType.id, name: 'admin', description: 'Administrator of the club' },
    { entity_type_id: clubEntityType.id, name: 'owner', description: 'Owner of the club' },
  ];

  for (const entityRole of defaultEntityRoles) {
    await prisma.entityRoles.upsert({
      where: {
        entity_type_id_name: {
          entity_type_id: entityRole.entity_type_id,
          name: entityRole.name,
        },
      },
      update: {},
      create: entityRole,
    });
  }
  console.log('Default entity roles created');

  // Get all entity roles
  const entityRoles = await prisma.entityRoles.findMany();
  const clubMemberRole = entityRoles.find(er => er.name === 'member' && er.entity_type_id === clubEntityType.id);
  const clubAdminRole = entityRoles.find(er => er.name === 'admin' && er.entity_type_id === clubEntityType.id);
  const clubOwnerRole = entityRoles.find(er => er.name === 'owner' && er.entity_type_id === clubEntityType.id);

  if (!clubMemberRole || !clubAdminRole || !clubOwnerRole) {
    throw new Error('Club entity roles not found');
  }

  // Assign permissions to entity roles
  // Club member: view access to club resources
  const clubMemberPermissions = [
    { entity_role_id: clubMemberRole.id, permission_id: viewPermission.id, resource_id: resources.find(r => r.name === 'clubs')!.id },
    { entity_role_id: clubMemberRole.id, permission_id: viewPermission.id, resource_id: resources.find(r => r.name === 'venue_bookings')!.id },
  ];

  // Club admin: view/create/update access to club resources
  const clubAdminPermissions = [
    { entity_role_id: clubAdminRole.id, permission_id: viewPermission.id, resource_id: resources.find(r => r.name === 'clubs')!.id },
    { entity_role_id: clubAdminRole.id, permission_id: createPermission.id, resource_id: resources.find(r => r.name === 'clubs')!.id },
    { entity_role_id: clubAdminRole.id, permission_id: updatePermission.id, resource_id: resources.find(r => r.name === 'clubs')!.id },
    { entity_role_id: clubAdminRole.id, permission_id: viewPermission.id, resource_id: resources.find(r => r.name === 'venue_bookings')!.id },
    { entity_role_id: clubAdminRole.id, permission_id: createPermission.id, resource_id: resources.find(r => r.name === 'venue_bookings')!.id },
    { entity_role_id: clubAdminRole.id, permission_id: updatePermission.id, resource_id: resources.find(r => r.name === 'venue_bookings')!.id },
  ];

  // Club owner: manage access to club resources
  const clubOwnerPermissions = [
    { entity_role_id: clubOwnerRole.id, permission_id: managePermission.id, resource_id: resources.find(r => r.name === 'clubs')!.id },
    { entity_role_id: clubOwnerRole.id, permission_id: managePermission.id, resource_id: resources.find(r => r.name === 'venue_bookings')!.id },
  ];

  // Combine all entity role permissions
  const allEntityRolePermissions = [...clubMemberPermissions, ...clubAdminPermissions, ...clubOwnerPermissions];

  // Upsert entity role permissions
  for (const erp of allEntityRolePermissions) {
    await prisma.entityRolePermissions.upsert({
      where: {
        entity_role_id_permission_id_resource_id: {
          entity_role_id: erp.entity_role_id,
          permission_id: erp.permission_id,
          resource_id: erp.resource_id,
        },
      },
      update: {},
      create: erp,
    });
  }
  console.log('Entity role permissions assigned');

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
