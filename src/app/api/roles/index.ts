import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getRoles(req, res);
    case 'POST':
      return createRole(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all roles
async function getRoles(req: NextApiRequest, res: NextApiResponse) {
  try {
    const roles = await prisma.userRoles.findMany();
    return res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({ message: 'Error fetching roles' });
  }
}

// Create a new role
async function createRole(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { role_name, permissions } = req.body;
    
    // Validate required fields
    if (!role_name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Missing or invalid required fields' });
    }
    
    // Check if role already exists
    const existingRole = await prisma.userRoles.findUnique({
      where: { role_name },
    });
    
    if (existingRole) {
      return res.status(400).json({ message: 'Role already exists' });
    }
    
    // Create role
    const newRole = await prisma.userRoles.create({
      data: {
        role_name,
        permissions,
      },
    });
    
    return res.status(201).json(newRole);
  } catch (error) {
    console.error('Error creating role:', error);
    return res.status(500).json({ message: 'Error creating role' });
  }
}