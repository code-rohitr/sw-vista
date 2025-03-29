const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Truncate all tables (in reverse order of dependencies)
  console.log('Truncating all tables...');
  await prisma.$executeRaw`TRUNCATE TABLE "VenueBookings" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Venues" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "EntityMembers" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "EntityRoles" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Entities" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Users" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "UserRoles" CASCADE;`;
  console.log('All tables truncated successfully.');

  // Create roles
  const godmodeRole = await prisma.userRoles.upsert({
    where: { role_name: 'godmode' },
    update: {
      permissions: ['all', 'create_user', 'delete_user', 'manage_roles', 'manage_permissions', 'create_venue', 'delete_venue', 'edit_venue'],
    },
    create: {
      role_name: 'godmode',
      permissions: ['all', 'create_user', 'delete_user', 'manage_roles', 'manage_permissions', 'create_venue', 'delete_venue', 'edit_venue'],
    },
  });

  const editorRole = await prisma.userRoles.upsert({
    where: { role_name: 'editor' },
    update: {},
    create: {
      role_name: 'editor',
      permissions: ['read', 'write', 'edit'],
    },
  });

  const viewerRole = await prisma.userRoles.upsert({
    where: { role_name: 'viewer' },
    update: {},
    create: {
      role_name: 'viewer',
      permissions: ['read'],
    },
  });

  console.log('Created roles:', { godmodeRole, editorRole, viewerRole });

  // Create entity roles
  const adminEntityRole = await prisma.entityRoles.create({
    data: {
      name: 'Admin',
      permissions: ['manage_entity', 'approve_bookings', 'manage_members'],
    },
  });

  const memberEntityRole = await prisma.entityRoles.create({
    data: {
      name: 'Member',
      permissions: ['create_bookings', 'view_bookings'],
    },
  });

  console.log('Created entity roles:', { adminEntityRole, memberEntityRole });

  // Hash passwords
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const userPassword = await bcrypt.hash('user123', saltRounds);

  // Create users
  const godmodeUser = await prisma.users.upsert({
    where: { username: 'godmode_admin' },
    update: { password_hash: adminPassword },
    create: {
      username: 'godmode_admin',
      email: 'admin@swvista.com',
      password_hash: adminPassword,
      role: 'godmode',
    },
  });

  const users = await Promise.all([
    prisma.users.create({
      data: {
        username: 'john_doe',
        email: 'john@example.com',
        password_hash: userPassword,
        role: 'editor',
      },
    }),
    prisma.users.create({
      data: {
        username: 'jane_smith',
        email: 'jane@example.com',
        password_hash: userPassword,
        role: 'editor',
      },
    }),
    prisma.users.create({
      data: {
        username: 'bob_viewer',
        email: 'bob@example.com',
        password_hash: userPassword,
        role: 'viewer',
      },
    }),
    prisma.users.create({
      data: {
        username: 'alice_editor',
        email: 'alice@example.com',
        password_hash: userPassword,
        role: 'editor',
      },
    }),
  ]);

  console.log('Created users:', [godmodeUser, ...users].map(u => ({ id: u.id, username: u.username })));

  // Create entities
  const entities = await Promise.all([
    prisma.entities.create({
      data: {
        name: 'Engineering Department',
        description: 'Department responsible for engineering activities',
      },
    }),
    prisma.entities.create({
      data: {
        name: 'Marketing Team',
        description: 'Team responsible for marketing and promotions',
      },
    }),
    prisma.entities.create({
      data: {
        name: 'HR Department',
        description: 'Human Resources department',
      },
    }),
    prisma.entities.create({
      data: {
        name: 'Finance Department',
        description: 'Department handling financial matters',
      },
    }),
    prisma.entities.create({
      data: {
        name: 'Executive Committee',
        description: 'Top-level decision making committee',
      },
    }),
  ]);

  console.log('Created entities:', entities.map(e => ({ id: e.id, name: e.name })));

  // Assign users to entities with roles
  const entityMembers = await Promise.all([
    // John is admin of Engineering
    prisma.entityMembers.create({
      data: {
        user_id: users[0].id,
        entity_id: entities[0].id,
        entity_role_id: adminEntityRole.id,
      },
    }),
    // John is member of Marketing
    prisma.entityMembers.create({
      data: {
        user_id: users[0].id,
        entity_id: entities[1].id,
        entity_role_id: memberEntityRole.id,
      },
    }),
    // Jane is admin of Marketing
    prisma.entityMembers.create({
      data: {
        user_id: users[1].id,
        entity_id: entities[1].id,
        entity_role_id: adminEntityRole.id,
      },
    }),
    // Jane is member of HR
    prisma.entityMembers.create({
      data: {
        user_id: users[1].id,
        entity_id: entities[2].id,
        entity_role_id: memberEntityRole.id,
      },
    }),
    // Bob is member of HR
    prisma.entityMembers.create({
      data: {
        user_id: users[2].id,
        entity_id: entities[2].id,
        entity_role_id: memberEntityRole.id,
      },
    }),
    // Alice is admin of HR
    prisma.entityMembers.create({
      data: {
        user_id: users[3].id,
        entity_id: entities[2].id,
        entity_role_id: adminEntityRole.id,
      },
    }),
    // Alice is member of Finance
    prisma.entityMembers.create({
      data: {
        user_id: users[3].id,
        entity_id: entities[3].id,
        entity_role_id: memberEntityRole.id,
      },
    }),
    // Godmode admin is admin of Executive Committee
    prisma.entityMembers.create({
      data: {
        user_id: godmodeUser.id,
        entity_id: entities[4].id,
        entity_role_id: adminEntityRole.id,
      },
    }),
  ]);

  console.log('Created entity members:', entityMembers.length);

  // Create venues (only godmode can create venues)
  const venues = await Promise.all([
    prisma.venues.create({
      data: {
        name: 'Main Conference Room',
        description: 'Large conference room with projector and whiteboard',
        address: 'Building A, Floor 1, Room 101',
        capacity: 30,
        amenities: 'Projector, Whiteboard, Video conferencing, Air conditioning',
        entity_id: entities[0].id, // Managed by Engineering Department
      },
    }),
    prisma.venues.create({
      data: {
        name: 'Executive Boardroom',
        description: 'Formal boardroom for executive meetings',
        address: 'Building A, Floor 5, Room 502',
        capacity: 15,
        amenities: 'Interactive display, Video conferencing, Catering service',
        entity_id: entities[4].id, // Managed by Executive Committee
      },
    }),
    prisma.venues.create({
      data: {
        name: 'Training Room',
        description: 'Room equipped for training sessions and workshops',
        address: 'Building B, Floor 2, Room 210',
        capacity: 25,
        amenities: 'Projector, Whiteboards, Laptops, Training materials',
        entity_id: entities[2].id, // Managed by HR Department
      },
    }),
    prisma.venues.create({
      data: {
        name: 'Marketing Studio',
        description: 'Creative space for marketing activities',
        address: 'Building C, Floor 3, Room 305',
        capacity: 20,
        amenities: 'Photography equipment, Green screen, Audio recording',
        entity_id: entities[1].id, // Managed by Marketing Team
      },
    }),
    prisma.venues.create({
      data: {
        name: 'Small Meeting Room',
        description: 'Compact room for small team meetings',
        address: 'Building A, Floor 2, Room 203',
        capacity: 8,
        amenities: 'TV screen, Whiteboard, Phone conferencing',
        entity_id: entities[3].id, // Managed by Finance Department
      },
    }),
  ]);

  console.log('Created venues:', venues.map(v => ({ id: v.id, name: v.name })));

  // Create venue bookings with different statuses
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const bookings = await Promise.all([
    // Approved booking
    prisma.venueBookings.create({
      data: {
        title: 'Engineering Team Meeting',
        description: 'Weekly team sync-up',
        start_time: new Date(tomorrow.setHours(9, 0, 0, 0)).toISOString(),
        end_time: new Date(tomorrow.setHours(10, 30, 0, 0)).toISOString(),
        status: 'approved',
        venue_id: venues[0].id,
        entity_id: entities[0].id,
        creator_id: users[0].id,
        approver_id: users[0].id, // Self-approved as admin of the entity
      },
    }),
    // Pending booking
    prisma.venueBookings.create({
      data: {
        title: 'Marketing Campaign Planning',
        description: 'Planning session for Q4 campaign',
        start_time: new Date(nextWeek.setHours(13, 0, 0, 0)).toISOString(),
        end_time: new Date(nextWeek.setHours(15, 0, 0, 0)).toISOString(),
        status: 'pending',
        venue_id: venues[3].id,
        entity_id: entities[1].id,
        creator_id: users[0].id, // John (member of Marketing) created this
      },
    }),
    // Rejected booking
    prisma.venueBookings.create({
      data: {
        title: 'Finance Review',
        description: 'Monthly financial review',
        start_time: new Date(nextWeek.setHours(10, 0, 0, 0)).toISOString(),
        end_time: new Date(nextWeek.setHours(11, 30, 0, 0)).toISOString(),
        status: 'rejected',
        venue_id: venues[4].id,
        entity_id: entities[3].id,
        creator_id: users[3].id, // Alice created this
        approver_id: godmodeUser.id, // Rejected by godmode admin
      },
    }),
    // Cancelled booking
    prisma.venueBookings.create({
      data: {
        title: 'HR Training Session',
        description: 'New employee orientation',
        start_time: new Date(lastWeek.setHours(14, 0, 0, 0)).toISOString(),
        end_time: new Date(lastWeek.setHours(16, 0, 0, 0)).toISOString(),
        status: 'cancelled',
        venue_id: venues[2].id,
        entity_id: entities[2].id,
        creator_id: users[2].id, // Bob created this
        approver_id: users[3].id, // Approved by Alice (HR admin) before cancellation
      },
    }),
    // Another approved booking
    prisma.venueBookings.create({
      data: {
        title: 'Executive Board Meeting',
        description: 'Quarterly board meeting',
        start_time: new Date(nextWeek.setHours(9, 0, 0, 0)).toISOString(),
        end_time: new Date(nextWeek.setHours(12, 0, 0, 0)).toISOString(),
        status: 'approved',
        venue_id: venues[1].id,
        entity_id: entities[4].id,
        creator_id: godmodeUser.id,
        approver_id: godmodeUser.id,
      },
    }),
  ]);

  console.log('Created bookings:', bookings.map(b => ({ id: b.id, title: b.title, status: b.status })));

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });