import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const roleId = parseInt(id as string);
  
  if (isNaN(roleId)) {
    return res.status(400).json({ message: 'Invalid role ID' });
  }
  
  switch (req.method) {
    case 'GET':
      return getRole(roleId, res);
    case 'PUT':
      return updateRole(roleId, req, res);
    case 'DELETE':
      return deleteRole(roleId, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get a single role
async function getRole(roleId: number, res: NextApiResponse) {
  try {
    const role = await prisma.userRoles.findUnique({
      where: { id: roleId },
    });
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    return res.status(200).json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return res.status(500).json({ message: 'Error fetching role' });
  }
}

// Update a role
async function updateRole(roleId: number, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { role_name, permissions } = req.body;
    
    // Check if role exists
    const existingRole = await prisma.userRoles.findUnique({
      where: { id: roleId },
    });
    
    if (!existingRole) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (role_name) updateData.role_name = role_name;
    if (permissions && Array.isArray(permissions)) updateData.permissions = permissions;
    
    // Update role
    const updatedRole = await prisma.userRoles.update({
      where: { id: roleId },
      data: updateData,
    });
    
    return res.status(200).json(updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ message: 'Error updating role' });
  }
}

// Delete a role
async function deleteRole(roleId: number, res: NextApiResponse) {
  try {
    // Check if role exists
    const existingRole = await prisma.userRoles.findUnique({
      where: { id: roleId },
    });
    
    if (!existingRole) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    // Delete role
    await prisma.userRoles.delete({
      where: { id: roleId },
    });
    
    return res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return res.status(500).json({ message: 'Error deleting role' });
  }
}