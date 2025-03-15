import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, role_id } = req.query;
  const permission = id as string;
  
  if (!permission || !role_id) {
    return res.status(400).json({ message: 'Missing permission or role_id' });
  }
  
  const roleId = parseInt(role_id as string);
  
  if (isNaN(roleId)) {
    return res.status(400).json({ message: 'Invalid role ID' });
  }
  
  switch (req.method) {
    case 'DELETE':
      return removePermission(roleId, permission, res);
    case 'PUT':
      return updatePermission(roleId, permission, req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Remove a permission from a role
async function removePermission(roleId: number, permission: string, res: NextApiResponse) {
  try {
    // Check if role exists
    const role = await prisma.userRoles.findUnique({
      where: { id: roleId },
    });
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    // Check if permission exists in the role
    if (!role.permissions.includes(permission)) {
      return res.status(404).json({ message: 'Permission not found in this role' });
    }
    
    // Remove permission from role
    const updatedRole = await prisma.userRoles.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: role.permissions.filter(p => p !== permission),
        },
      },
    });
    
    return res.status(200).json(updatedRole);
  } catch (error) {
    console.error('Error removing permission:', error);
    return res.status(500).json({ message: 'Error removing permission' });
  }
}

// Update a permission in a role
async function updatePermission(roleId: number, oldPermission: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { new_permission } = req.body;
    
    if (!new_permission) {
      return res.status(400).json({ message: 'Missing new permission' });
    }
    
    // Check if role exists
    const role = await prisma.userRoles.findUnique({
      where: { id: roleId },
    });
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    // Check if old permission exists in the role
    if (!role.permissions.includes(oldPermission)) {
      return res.status(404).json({ message: 'Permission not found in this role' });
    }
    
    // Update permission in role
    const updatedPermissions = role.permissions.map(p => 
      p === oldPermission ? new_permission : p
    );
    
    const updatedRole = await prisma.userRoles.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: updatedPermissions,
        },
      },
    });
    
    return res.status(200).json(updatedRole);
  } catch (error) {
    console.error('Error updating permission:', error);
    return res.status(500).json({ message: 'Error updating permission' });
  }
}