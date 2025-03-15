import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getPermissions(req, res);
    case 'POST':
      return addPermission(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all permissions from all roles
async function getPermissions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const roles = await prisma.userRoles.findMany();
    
    // Extract unique permissions from all roles
    const allPermissions = new Set<string>();
    roles.forEach(role => {
      role.permissions.forEach(permission => {
        allPermissions.add(permission);
      });
    });
    
    return res.status(200).json(Array.from(allPermissions));
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({ message: 'Error fetching permissions' });
  }
}

// Add a permission to a role
async function addPermission(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { role_id, permission } = req.body;
    
    // Validate required fields
    if (!role_id || !permission) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if role exists
    const role = await prisma.userRoles.findUnique({
      where: { id: parseInt(role_id) },
    });
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    // Check if permission already exists in the role
    if (role.permissions.includes(permission)) {
      return res.status(400).json({ message: 'Permission already exists in this role' });
    }
    
    // Add permission to role
    const updatedRole = await prisma.userRoles.update({
      where: { id: parseInt(role_id) },
      data: {
        permissions: {
          set: [...role.permissions, permission],
        },
      },
    });
    
    return res.status(200).json(updatedRole);
  } catch (error) {
    console.error('Error adding permission:', error);
    return res.status(500).json({ message: 'Error adding permission' });
  }
}