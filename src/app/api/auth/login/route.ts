import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Find user by username
    const user = await prisma.users.findUnique({
      where: { username },
    });

    if (!user) {
      // We can't log for non-existent users
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Log failed login attempt
      await prisma.auditLogs.create({
        data: {
          user_id: user.id,
          entity_type: 'auth',
          entity_id: user.id,
          action: 'LOGIN_FAILED',
        },
      });
      
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    // Log successful login
    await prisma.auditLogs.create({
      data: {
        user_id: user.id,
        entity_type: 'auth',
        entity_id: user.id,
        action: 'LOGIN',
      },
    });

    // Return user data and token
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}