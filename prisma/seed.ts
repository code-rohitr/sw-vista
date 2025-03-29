import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear all existing data - using the correct table names from schema
  console.log('Clearing existing data...');
  await prisma.$executeRaw`TRUNCATE TABLE users, permissions, resources, "permissionResources", "entityRolePermissions", "entityTypes", entity, "entityRoles", "entityMembers", report, approval, "auditLog", venues, venue_bookings RESTART IDENTITY CASCADE;`;
  
  console.log('Seeding database...');
  
  // Create users
  console.log('Creating users...');
  const godmodeAdmin = await prisma.users.create({
    data: {
      username: 'godmode_admin',
      email: 'admin@example.com',
      password_hash: await bcrypt.hash('password123', 10),
    },
  });
  
  const securityAdmin = await prisma.users.create({
    data: {
      username: 'security_admin',
      email: 'security@example.com',
      password_hash: await bcrypt.hash('password123', 10),
    },
  });
  
  const studentCouncilAdmin = await prisma.users.create({
    data: {
      username: 'council_admin',
      email: 'council@example.com',
      password_hash: await bcrypt.hash('password123', 10),
    },
  });
  
  const tmrClubAdmin = await prisma.users.create({
    data: {
      username: 'tmr_admin',
      email: 'tmr@example.com',
      password_hash: await bcrypt.hash('password123', 10),
    },
  });
  
  const techClubAdmin = await prisma.users.create({
    data: {
      username: 'tech_admin',
      email: 'tech@example.com',
      password_hash: await bcrypt.hash('password123', 10),
    },
  });
  
  const regularUser = await prisma.users.create({
    data: {
      username: 'user',
      email: 'user@example.com',
      password_hash: await bcrypt.hash('password123', 10),
    },
  });
  
  // Create permissions
  console.log('Creating permissions...');
  const viewPermission = await prisma.permissions.create({
    data: {
      name: 'view',
      description: 'Permission to view resources',
      action: 'view',
    },
  });
  
  const createPermission = await prisma.permissions.create({
    data: {
      name: 'create',
      description: 'Permission to create resources',
      action: 'create',
    },
  });
  
  const updatePermission = await prisma.permissions.create({
    data: {
      name: 'update',
      description: 'Permission to update resources',
      action: 'update',
    },
  });
  
  const deletePermission = await prisma.permissions.create({
    data: {
      name: 'delete',
      description: 'Permission to delete resources',
      action: 'delete',
    },
  });
  
  const managePermission = await prisma.permissions.create({
    data: {
      name: 'manage',
      description: 'Permission to manage all aspects of resources',
      action: 'manage',
    },
  });
  
  // Create resources
  console.log('Creating resources...');
  const usersResource = await prisma.resources.create({
    data: {
      name: 'Users',
      path: '/users',
      description: 'User management',
    },
  });
  
  const entitiesResource = await prisma.resources.create({
    data: {
      name: 'Entities',
      path: '/entities',
      description: 'Entity management',
    },
  });
  
  const venuesResource = await prisma.resources.create({
    data: {
      name: 'Venues',
      path: '/venues',
      description: 'Venue management',
    },
  });
  
  const bookingsResource = await prisma.resources.create({
    data: {
      name: 'Bookings',
      path: '/bookings',
      description: 'Venue booking management',
    },
  });
  
  // Create entity types
  console.log('Creating entity types...');
  const systemEntityType = await prisma.entityTypes.create({
    data: {
      name: 'System',
      description: 'System-level entity type',
    },
  });
  
  const departmentEntityType = await prisma.entityTypes.create({
    data: {
      name: 'Department',
      description: 'Department entity type',
    },
  });
  
  const clubEntityType = await prisma.entityTypes.create({
    data: {
      name: 'Club',
      description: 'Club entity type',
    },
  });
  
  // Create entities
  console.log('Creating entities...');
  const systemEntity = await prisma.entity.create({
    data: {
      name: 'System',
      description: 'System-wide entity',
      entity_type_id: systemEntityType.id,
    },
  });
  
  const securityEntity = await prisma.entity.create({
    data: {
      name: 'Security Department',
      description: 'Campus security department',
      entity_type_id: departmentEntityType.id,
    },
  });
  
  const studentCouncilEntity = await prisma.entity.create({
    data: {
      name: 'Student Council',
      description: 'Student governing body',
      entity_type_id: departmentEntityType.id,
    },
  });
  
  const tmrClubEntity = await prisma.entity.create({
    data: {
      name: 'Team Manipal Racing',
      description: 'Racing club for engineering students',
      entity_type_id: clubEntityType.id,
    },
  });
  
  const techClubEntity = await prisma.entity.create({
    data: {
      name: 'Tech Club',
      description: 'Technology enthusiasts club',
      entity_type_id: clubEntityType.id,
    },
  });
  
  // Create entity roles
  console.log('Creating entity roles...');
  const systemAdminRole = await prisma.entityRoles.create({
    data: {
      name: 'System Admin',
      description: 'Administrator with full system access',
      entity_type_id: systemEntityType.id,
      entity_id: systemEntity.id,
    },
  });
  
  const adminRole = await prisma.entityRoles.create({
    data: {
      name: 'Admin',
      description: 'Administrator with full entity access',
      entity_type_id: departmentEntityType.id,
      is_default: true,
    },
  });
  
  const clubAdminRole = await prisma.entityRoles.create({
    data: {
      name: 'Admin',
      description: 'Club administrator',
      entity_type_id: clubEntityType.id,
      is_default: true,
    },
  });
  
  const memberRole = await prisma.entityRoles.create({
    data: {
      name: 'Member',
      description: 'Regular member',
      entity_type_id: clubEntityType.id,
      is_default: true,
    },
  });
  
  // Assign entity roles to users
  console.log('Assigning entity roles to users...');
  await prisma.entityMembers.create({
    data: {
      entity_id: systemEntity.id,
      user_id: godmodeAdmin.id,
      entity_role_id: systemAdminRole.id,
    },
  });
  
  await prisma.entityMembers.create({
    data: {
      entity_id: securityEntity.id,
      user_id: securityAdmin.id,
      entity_role_id: adminRole.id,
    },
  });
  
  await prisma.entityMembers.create({
    data: {
      entity_id: studentCouncilEntity.id,
      user_id: studentCouncilAdmin.id,
      entity_role_id: adminRole.id,
    },
  });
  
  await prisma.entityMembers.create({
    data: {
      entity_id: tmrClubEntity.id,
      user_id: tmrClubAdmin.id,
      entity_role_id: clubAdminRole.id,
    },
  });
  
  await prisma.entityMembers.create({
    data: {
      entity_id: techClubEntity.id,
      user_id: techClubAdmin.id,
      entity_role_id: clubAdminRole.id,
    },
  });
  
  await prisma.entityMembers.create({
    data: {
      entity_id: tmrClubEntity.id,
      user_id: regularUser.id,
      entity_role_id: memberRole.id,
    },
  });
  
  // Create entity role permissions
  console.log('Creating entity role permissions...');
  // System Admin permissions (all resources, all permissions)
  const resources = [usersResource, entitiesResource, venuesResource, bookingsResource];
  const permissions = [viewPermission, createPermission, updatePermission, deletePermission, managePermission];
  
  for (const resource of resources) {
    for (const permission of permissions) {
      await prisma.entityRolePermissions.create({
        data: {
          entity_role_id: systemAdminRole.id,
          permission_id: permission.id,
          resource_id: resource.id,
        },
      });
    }
  }
  
  // Department Admin permissions
  await prisma.entityRolePermissions.create({
    data: {
      entity_role_id: adminRole.id,
      permission_id: managePermission.id,
      resource_id: venuesResource.id,
    },
  });
  
  await prisma.entityRolePermissions.create({
    data: {
      entity_role_id: adminRole.id,
      permission_id: managePermission.id,
      resource_id: bookingsResource.id,
    },
  });
  
  // Club Admin permissions
  await prisma.entityRolePermissions.create({
    data: {
      entity_role_id: clubAdminRole.id,
      permission_id: viewPermission.id,
      resource_id: venuesResource.id,
    },
  });
  
  await prisma.entityRolePermissions.create({
    data: {
      entity_role_id: clubAdminRole.id,
      permission_id: createPermission.id,
      resource_id: bookingsResource.id,
    },
  });
  
  // Create venues
  console.log('Creating venues...');
  const mainAuditorium = await prisma.venue.create({
    data: {
      name: 'Main Auditorium',
      description: 'Large auditorium for major events',
      address: 'Main Campus, Building A',
      capacity: 500,
      amenities: 'Stage, Sound System, Projector',
      entity_id: systemEntity.id,
    },
  });
  
  const conferenceHall = await prisma.venue.create({
    data: {
      name: 'Conference Hall',
      description: 'Medium-sized hall for conferences',
      address: 'Main Campus, Building B',
      capacity: 200,
      amenities: 'Tables, Chairs, Projector, Whiteboard',
      entity_id: systemEntity.id,
    },
  });
  
  const sportsField = await prisma.venue.create({
    data: {
      name: 'Sports Field',
      description: 'Outdoor field for sports events',
      address: 'South Campus',
      capacity: 1000,
      amenities: 'Floodlights, Seating',
      entity_id: systemEntity.id,
    },
  });
  
  const clubRoom = await prisma.venue.create({
    data: {
      name: 'Club Room',
      description: 'Small room for club meetings',
      address: 'Student Center, Room 101',
      capacity: 30,
      amenities: 'Tables, Chairs, Whiteboard',
      entity_id: studentCouncilEntity.id,
    },
  });
  
  // Create venue bookings
  console.log('Creating venue bookings...');
  const now = new Date();
  
  await prisma.venueBooking.create({
    data: {
      venue_id: mainAuditorium.id,
      entity_id: tmrClubEntity.id,
      title: 'Annual Racing Exhibition',
      description: 'Showcase of racing projects',
      start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 10, 0),
      end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 16, 0),
      status: 'approved',
      created_by: tmrClubAdmin.id,
      approved_by: godmodeAdmin.id,
    },
  });
  
  await prisma.venueBooking.create({
    data: {
      venue_id: conferenceHall.id,
      entity_id: techClubEntity.id,
      title: 'Tech Workshop',
      description: 'Workshop on latest technologies',
      start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0),
      end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 17, 0),
      status: 'pending',
      created_by: techClubAdmin.id,
    },
  });
  
  await prisma.venueBooking.create({
    data: {
      venue_id: clubRoom.id,
      entity_id: studentCouncilEntity.id,
      title: 'Council Meeting',
      description: 'Monthly council meeting',
      start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 16, 0),
      end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 18, 0),
      status: 'approved',
      created_by: studentCouncilAdmin.id,
      approved_by: godmodeAdmin.id,
    },
  });
  
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
