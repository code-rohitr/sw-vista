import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import jwt from 'jsonwebtoken';

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

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
      if (err) return resolve(null);
      resolve(decoded);
    });
  });
};

/**
 * Generates a JWT token for a user
 * @param payload The data to encode in the token
 * @returns The generated JWT token
 */
export const generateToken = (payload: any): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1d' }
  );
};

/**
 * Checks if a user has the required role
 * @param userRole The user's role
 * @param requiredRole The required role
 * @returns True if the user has the required role
 */
export const hasRole = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = ['user', 'admin', 'godmode'];
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
  
  return userRoleIndex >= requiredRoleIndex;
};