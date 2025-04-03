const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function clearData() {
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log({ error });
      }
    }
  }
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Start seeding...');

  await clearData();

  // Create admin user
  const adminUser = await prisma.users.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password_hash: await hashPassword('admin123')
    }
  });

  console.log('Created admin user');

  // Create entity types
  const entityTypes = await Promise.all([
    prisma.entityTypes.create({
      data: {
        name: 'Club',
        description: 'Student organizations and clubs'
      }
    }),
    prisma.entityTypes.create({
      data: {
        name: 'Security',
        description: 'Security and safety departments'
      }
    }),
    prisma.entityTypes.create({
      data: {
        name: 'Directors',
        description: 'Department directors and managers'
      }
    }),
    prisma.entityTypes.create({
      data: {
        name: 'Faculty Advisors',
        description: 'Faculty members advising student organizations'
      }
    }),
    prisma.entityTypes.create({
      data: {
        name: 'Venue',
        description: 'Physical locations and spaces'
      }
    })
  ]);

  console.log('Created entity types');

  // Create permissions
  const permissions = await Promise.all([
    // Club permissions
    prisma.permissions.create({
      data: {
        name: 'manage_club',
        description: 'Manage club operations',
        action: 'manage',
        scope: 'club',
        resource_type: 'club',
        created_by: adminUser.id
      }
    }),
    prisma.permissions.create({
      data: {
        name: 'view_club',
        description: 'View club details',
        action: 'view',
        scope: 'club',
        resource_type: 'club',
        created_by: adminUser.id
      }
    }),
    // Security permissions
    prisma.permissions.create({
      data: {
        name: 'manage_security',
        description: 'Manage security operations',
        action: 'manage',
        scope: 'security',
        resource_type: 'security',
        created_by: adminUser.id
      }
    }),
    prisma.permissions.create({
      data: {
        name: 'view_security',
        description: 'View security details',
        action: 'view',
        scope: 'security',
        resource_type: 'security',
        created_by: adminUser.id
      }
    }),
    // Director permissions
    prisma.permissions.create({
      data: {
        name: 'manage_department',
        description: 'Manage department operations',
        action: 'manage',
        scope: 'department',
        resource_type: 'department',
        created_by: adminUser.id
      }
    }),
    prisma.permissions.create({
      data: {
        name: 'view_department',
        description: 'View department details',
        action: 'view',
        scope: 'department',
        resource_type: 'department',
        created_by: adminUser.id
      }
    }),
    // Faculty permissions
    prisma.permissions.create({
      data: {
        name: 'advise_club',
        description: 'Advise student organizations',
        action: 'advise',
        scope: 'club',
        resource_type: 'club',
        created_by: adminUser.id
      }
    }),
    prisma.permissions.create({
      data: {
        name: 'view_advisee',
        description: 'View advisee details',
        action: 'view',
        scope: 'advisee',
        resource_type: 'advisee',
        created_by: adminUser.id
      }
    }),
    // Venue permissions
    prisma.permissions.create({
      data: {
        name: 'manage_venue',
        description: 'Manage venue operations',
        action: 'manage',
        scope: 'venue',
        resource_type: 'venue',
        created_by: adminUser.id
      }
    }),
    prisma.permissions.create({
      data: {
        name: 'book_venue',
        description: 'Book venues',
        action: 'book',
        scope: 'venue',
        resource_type: 'venue',
        created_by: adminUser.id
      }
    })
  ]);

  console.log('Created permissions');

  // Create resources
  const resources = await Promise.all([
    prisma.resources.create({
      data: {
        name: 'club',
        path: '/api/clubs',
        description: 'Club management endpoints'
      }
    }),
    prisma.resources.create({
      data: {
        name: 'security',
        path: '/api/security',
        description: 'Security management endpoints'
      }
    }),
    prisma.resources.create({
      data: {
        name: 'department',
        path: '/api/departments',
        description: 'Department management endpoints'
      }
    }),
    prisma.resources.create({
      data: {
        name: 'faculty',
        path: '/api/faculty',
        description: 'Faculty management endpoints'
      }
    }),
    prisma.resources.create({
      data: {
        name: 'venue',
        path: '/api/venues',
        description: 'Venue management endpoints'
      }
    })
  ]);

  console.log('Created resources');

  // Create permission resources
  await Promise.all([
    // Club permissions
    prisma.permissionResources.create({
      data: {
        permission_id: permissions[0].id,
        resource_id: resources[0].id
      }
    }),
    prisma.permissionResources.create({
      data: {
        permission_id: permissions[1].id,
        resource_id: resources[0].id
      }
    }),
    // Security permissions
    prisma.permissionResources.create({
      data: {
        permission_id: permissions[2].id,
        resource_id: resources[1].id
      }
    }),
    prisma.permissionResources.create({
      data: {
        permission_id: permissions[3].id,
        resource_id: resources[1].id
      }
    }),
    // Director permissions
    prisma.permissionResources.create({
      data: {
        permission_id: permissions[4].id,
        resource_id: resources[2].id
      }
    }),
    prisma.permissionResources.create({
      data: {
        permission_id: permissions[5].id,
        resource_id: resources[2].id
      }
    }),
    // Faculty permissions
    prisma.permissionResources.create({
      data: {
        permission_id: permissions[6].id,
        resource_id: resources[3].id
      }
    }),
    prisma.permissionResources.create({
      data: {
        permission_id: permissions[7].id,
        resource_id: resources[3].id
      }
    }),
    // Venue permissions
    prisma.permissionResources.create({
      data: {
        permission_id: permissions[8].id,
        resource_id: resources[4].id
      }
    }),
    prisma.permissionResources.create({
      data: {
        permission_id: permissions[9].id,
        resource_id: resources[4].id
      }
    })
  ]);

  console.log('Created permission resources');

  // Create role templates
  const roleTemplates = await Promise.all([
    // Club roles
    prisma.roleTemplate.create({
      data: {
        name: 'Club President',
        description: 'Leads and manages the club'
      }
    }),
    prisma.roleTemplate.create({
      data: {
        name: 'Club Member',
        description: 'Regular club member'
      }
    }),
    // Security roles
    prisma.roleTemplate.create({
      data: {
        name: 'Security Chief',
        description: 'Head of security operations'
      }
    }),
    prisma.roleTemplate.create({
      data: {
        name: 'Security Officer',
        description: 'Security personnel'
      }
    }),
    // Director roles
    prisma.roleTemplate.create({
      data: {
        name: 'Department Director',
        description: 'Manages department operations'
      }
    }),
    prisma.roleTemplate.create({
      data: {
        name: 'Department Manager',
        description: 'Assists in department management'
      }
    }),
    // Faculty roles
    prisma.roleTemplate.create({
      data: {
        name: 'Senior Advisor',
        description: 'Experienced faculty advisor'
      }
    }),
    prisma.roleTemplate.create({
      data: {
        name: 'Junior Advisor',
        description: 'New faculty advisor'
      }
    }),
    // Venue roles
    prisma.roleTemplate.create({
      data: {
        name: 'Venue Manager',
        description: 'Manages venue operations'
      }
    }),
    prisma.roleTemplate.create({
      data: {
        name: 'Venue Staff',
        description: 'Assists in venue operations'
      }
    })
  ]);

  console.log('Created role templates');

  // Create role template versions
  await Promise.all(roleTemplates.map((template, index) => 
    prisma.roleTemplateVersion.create({
      data: {
        template_id: template.id,
        version_number: 1,
        changes: { initial: true },
        permissions: {
          create: index % 2 === 0,
          read: true,
          update: index % 2 === 0,
          delete: false
        },
        created_by: adminUser.id
      }
    })
  ));

  console.log('Created role template versions');

  // Create entities
  const entities = await Promise.all([
    // Clubs
    prisma.entity.create({
      data: {
        name: 'Computer Science Club',
        description: 'Student organization for computer science enthusiasts',
        entityType_id: entityTypes[0].id
      }
    }),
    prisma.entity.create({
      data: {
        name: 'Robotics Club',
        description: 'Student organization for robotics enthusiasts',
        entityType_id: entityTypes[0].id
      }
    }),
    // Security
    prisma.entity.create({
      data: {
        name: 'Campus Security',
        description: 'Main campus security department',
        entityType_id: entityTypes[1].id
      }
    }),
    prisma.entity.create({
      data: {
        name: 'Event Security',
        description: 'Security team for special events',
        entityType_id: entityTypes[1].id
      }
    }),
    // Directors
    prisma.entity.create({
      data: {
        name: 'Student Affairs',
        description: 'Student affairs department',
        entityType_id: entityTypes[2].id
      }
    }),
    prisma.entity.create({
      data: {
        name: 'Academic Affairs',
        description: 'Academic affairs department',
        entityType_id: entityTypes[2].id
      }
    }),
    // Faculty Advisors
    prisma.entity.create({
      data: {
        name: 'Engineering Faculty',
        description: 'Engineering department faculty advisors',
        entityType_id: entityTypes[3].id
      }
    }),
    prisma.entity.create({
      data: {
        name: 'Science Faculty',
        description: 'Science department faculty advisors',
        entityType_id: entityTypes[3].id
      }
    }),
    // Venues
    prisma.entity.create({
      data: {
        name: 'Main Auditorium',
        description: 'Large event space for major gatherings',
        entityType_id: entityTypes[4].id
      }
    }),
    prisma.entity.create({
      data: {
        name: 'Conference Room A',
        description: 'Medium-sized meeting space',
        entityType_id: entityTypes[4].id
      }
    })
  ]);

  console.log('Created entities');

  // Create users
  const users = await Promise.all([
    // Club users
    prisma.users.create({
      data: {
        username: 'cs_president',
        email: 'cs_president@example.com',
        password_hash: await hashPassword('password123')
      }
    }),
    prisma.users.create({
      data: {
        username: 'cs_member',
        email: 'cs_member@example.com',
        password_hash: await hashPassword('password123')
      }
    }),
    // Security users
    prisma.users.create({
      data: {
        username: 'security_chief',
        email: 'security_chief@example.com',
        password_hash: await hashPassword('password123')
      }
    }),
    prisma.users.create({
      data: {
        username: 'security_officer',
        email: 'security_officer@example.com',
        password_hash: await hashPassword('password123')
      }
    }),
    // Director users
    prisma.users.create({
      data: {
        username: 'student_director',
        email: 'student_director@example.com',
        password_hash: await hashPassword('password123')
      }
    }),
    prisma.users.create({
      data: {
        username: 'academic_director',
        email: 'academic_director@example.com',
        password_hash: await hashPassword('password123')
      }
    }),
    // Faculty users
    prisma.users.create({
      data: {
        username: 'eng_advisor',
        email: 'eng_advisor@example.com',
        password_hash: await hashPassword('password123')
      }
    }),
    prisma.users.create({
      data: {
        username: 'sci_advisor',
        email: 'sci_advisor@example.com',
        password_hash: await hashPassword('password123')
      }
    }),
    // Venue users
    prisma.users.create({
      data: {
        username: 'venue_manager',
        email: 'venue_manager@example.com',
        password_hash: await hashPassword('password123')
      }
    }),
    prisma.users.create({
      data: {
        username: 'venue_staff',
        email: 'venue_staff@example.com',
        password_hash: await hashPassword('password123')
      }
    })
  ]);

  console.log('Created users');

  // Create entity roles
  const entityRoles = await Promise.all([
    // Club roles
    prisma.entityRoles.create({
      data: {
        name: 'CS Club President',
        description: 'President of Computer Science Club',
        entityType_id: entityTypes[0].id,
        entity_id: entities[0].id,
        template_id: roleTemplates[0].id
      }
    }),
    prisma.entityRoles.create({
      data: {
        name: 'CS Club Member',
        description: 'Member of Computer Science Club',
        entityType_id: entityTypes[0].id,
        entity_id: entities[0].id,
        template_id: roleTemplates[1].id
      }
    }),
    // Security roles
    prisma.entityRoles.create({
      data: {
        name: 'Campus Security Chief',
        description: 'Head of Campus Security',
        entityType_id: entityTypes[1].id,
        entity_id: entities[2].id,
        template_id: roleTemplates[2].id
      }
    }),
    prisma.entityRoles.create({
      data: {
        name: 'Campus Security Officer',
        description: 'Campus Security Personnel',
        entityType_id: entityTypes[1].id,
        entity_id: entities[2].id,
        template_id: roleTemplates[3].id
      }
    }),
    // Director roles
    prisma.entityRoles.create({
      data: {
        name: 'Student Affairs Director',
        description: 'Director of Student Affairs',
        entityType_id: entityTypes[2].id,
        entity_id: entities[4].id,
        template_id: roleTemplates[4].id
      }
    }),
    prisma.entityRoles.create({
      data: {
        name: 'Academic Affairs Manager',
        description: 'Manager of Academic Affairs',
        entityType_id: entityTypes[2].id,
        entity_id: entities[5].id,
        template_id: roleTemplates[5].id
      }
    }),
    // Faculty roles
    prisma.entityRoles.create({
      data: {
        name: 'Engineering Senior Advisor',
        description: 'Senior Advisor for Engineering',
        entityType_id: entityTypes[3].id,
        entity_id: entities[6].id,
        template_id: roleTemplates[6].id
      }
    }),
    prisma.entityRoles.create({
      data: {
        name: 'Science Junior Advisor',
        description: 'Junior Advisor for Science',
        entityType_id: entityTypes[3].id,
        entity_id: entities[7].id,
        template_id: roleTemplates[7].id
      }
    }),
    // Venue roles
    prisma.entityRoles.create({
      data: {
        name: 'Auditorium Manager',
        description: 'Manager of Main Auditorium',
        entityType_id: entityTypes[4].id,
        entity_id: entities[8].id,
        template_id: roleTemplates[8].id
      }
    }),
    prisma.entityRoles.create({
      data: {
        name: 'Conference Room Staff',
        description: 'Staff for Conference Room A',
        entityType_id: entityTypes[4].id,
        entity_id: entities[9].id,
        template_id: roleTemplates[9].id
      }
    })
  ]);

  console.log('Created entity roles');

  // Create entity role permissions
  await Promise.all([
    // Club permissions
    prisma.entityRolePermissions.create({
      data: {
        entity_role_id: entityRoles[0].id,
        permission_id: permissions[0].id,
        resource_id: resources[0].id
      }
    }),
    prisma.entityRolePermissions.create({
      data: {
        entity_role_id: entityRoles[1].id,
        permission_id: permissions[1].id,
        resource_id: resources[0].id
      }
    }),
    // Security permissions
    prisma.entityRolePermissions.create({
      data: {
        entity_role_id: entityRoles[2].id,
        permission_id: permissions[2].id,
        resource_id: resources[1].id
      }
    }),
    prisma.entityRolePermissions.create({
      data: {
        entity_role_id: entityRoles[3].id,
        permission_id: permissions[3].id,
        resource_id: resources[1].id
      }
    }),
    // Director permissions
    prisma.entityRolePermissions.create({
      data: {
        entity_role_id: entityRoles[4].id,
        permission_id: permissions[4].id,
        resource_id: resources[2].id
      }
    }),
    prisma.entityRolePermissions.create({
      data: {
        entity_role_id: entityRoles[5].id,
        permission_id: permissions[5].id,
        resource_id: resources[2].id
      }
    }),
    // Faculty permissions
    prisma.entityRolePermissions.create({
      data: {
        entity_role_id: entityRoles[6].id,
        permission_id: permissions[6].id,
        resource_id: resources[3].id
      }
    }),
    prisma.entityRolePermissions.create({
      data: {
        entity_role_id: entityRoles[7].id,
        permission_id: permissions[7].id,
        resource_id: resources[3].id
      }
    }),
    // Venue permissions
    prisma.entityRolePermissions.create({
      data: {
        entity_role_id: entityRoles[8].id,
        permission_id: permissions[8].id,
        resource_id: resources[4].id
      }
    }),
    prisma.entityRolePermissions.create({
      data: {
        entity_role_id: entityRoles[9].id,
        permission_id: permissions[9].id,
        resource_id: resources[4].id
      }
    })
  ]);

  console.log('Created entity role permissions');

  // Create entity members
  await Promise.all([
    // Club members
    prisma.entityMembers.create({
      data: {
        entity_id: entities[0].id,
        entity_role_id: entityRoles[0].id,
        user_id: users[0].id
      }
    }),
    prisma.entityMembers.create({
      data: {
        entity_id: entities[0].id,
        entity_role_id: entityRoles[1].id,
        user_id: users[1].id
      }
    }),
    // Security members
    prisma.entityMembers.create({
      data: {
        entity_id: entities[2].id,
        entity_role_id: entityRoles[2].id,
        user_id: users[2].id
      }
    }),
    prisma.entityMembers.create({
      data: {
        entity_id: entities[2].id,
        entity_role_id: entityRoles[3].id,
        user_id: users[3].id
      }
    }),
    // Director members
    prisma.entityMembers.create({
      data: {
        entity_id: entities[4].id,
        entity_role_id: entityRoles[4].id,
        user_id: users[4].id
      }
    }),
    prisma.entityMembers.create({
      data: {
        entity_id: entities[5].id,
        entity_role_id: entityRoles[5].id,
        user_id: users[5].id
      }
    }),
    // Faculty members
    prisma.entityMembers.create({
      data: {
        entity_id: entities[6].id,
        entity_role_id: entityRoles[6].id,
        user_id: users[6].id
      }
    }),
    prisma.entityMembers.create({
      data: {
        entity_id: entities[7].id,
        entity_role_id: entityRoles[7].id,
        user_id: users[7].id
      }
    }),
    // Venue members
    prisma.entityMembers.create({
      data: {
        entity_id: entities[8].id,
        entity_role_id: entityRoles[8].id,
        user_id: users[8].id
      }
    }),
    prisma.entityMembers.create({
      data: {
        entity_id: entities[9].id,
        entity_role_id: entityRoles[9].id,
        user_id: users[9].id
      }
    })
  ]);

  console.log('Created entity members');

  console.log('Seeding finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });