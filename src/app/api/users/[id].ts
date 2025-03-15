import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const userId = parseInt(id as string);
  
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  
  switch (req.method) {
    case 'GET':
      return getUser(userId, res);
    case 'PUT':
      return updateUser(userId, req, res);
    case 'DELETE':
      return deleteUser(userId, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get a single user
async function getUser(userId: number, res: NextApiResponse) {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
        // Exclude password_hash for security
      },
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Error fetching user' });
  }
}

// Update a user
async function updateUser(userId: number, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id: userId },
    });
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    // Hash password if provided
    if (password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }
    
    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Error updating user' });
  }
}

// Delete a user
async function deleteUser(userId: number, res: NextApiResponse) {
  try {
    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id: userId },
    });
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user
    await prisma.users.delete({
      where: { id: userId },
    });
    
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Error deleting user' });
  }
}