import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    const user = await verifyCredentials(username, password);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    return NextResponse.json({
      user,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Error during login' },
      { status: 500 }
    );
  }
}