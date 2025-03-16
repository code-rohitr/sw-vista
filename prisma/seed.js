const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create godmode role if it doesn't exist
  const godmodeRole = await prisma.userRoles.upsert({
    where: { role_name: 'godmode' },
    update: {},
    create: {
      role_name: 'godmode',
      permissions: ['all', 'create_user', 'delete_user', 'manage_roles', 'manage_permissions'],
    },
  });

  console.log('Created godmode role:', godmodeRole);

  // Create editor role
  const editorRole = await prisma.userRoles.upsert({
    where: { role_name: 'editor' },
    update: {},
    create: {
      role_name: 'editor',
      permissions: ['read', 'write', 'edit'],
    },
  });

  console.log('Created editor role:', editorRole);

  // Create viewer role
  const viewerRole = await prisma.userRoles.upsert({
    where: { role_name: 'viewer' },
    update: {},
    create: {
      role_name: 'viewer',
      permissions: ['read'],
    },
  });

  console.log('Created viewer role:', viewerRole);

  // Hash password for godmode user
  const saltRounds = 10;
  const password = 'admin123'; // Change this to a secure password
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Create godmode user if it doesn't exist
  const godmodeUser = await prisma.users.upsert({
    where: { username: 'godmode_admin' },
    update: {},
    create: {
      username: 'godmode_admin',
      email: 'admin@swvista.com',
      password_hash,
      role: 'godmode',
    },
  });

  console.log('Created godmode user:', {
    id: godmodeUser.id,
    username: godmodeUser.username,
    email: godmodeUser.email,
    role: godmodeUser.role,
  });

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });