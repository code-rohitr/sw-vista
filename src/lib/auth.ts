import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export async function verifyCredentials(username: string, password: string) {
  // Find user by username
  const user = await prisma.users.findFirst({
    where: { username },
  });
  
  if (!user) {
    return null;
  }
  
  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!passwordMatch) {
    return null;
  }
  
  // Return user without password
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserById(id: number) {
  const user = await prisma.users.findUnique({
    where: { id },
  });
  
  if (!user) {
    return null;
  }
  
  // Return user without password
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserPermissions(role: string) {
  const userRole = await prisma.userRoles.findFirst({
    where: { role_name: role },
  });
  
  if (!userRole) {
    return [];
  }
  
  return userRole.permissions;
}

export function hasPermission(userPermissions: string[], requiredPermission: string) {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('admin');
}