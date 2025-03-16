import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Define a proper return type for the middleware
type AuthResult = 
  | { isAuthorized: true; user: any }
  | NextResponse<{ message: string }>;

export function requireRole(role: string) {
  return async (request: NextRequest): Promise<AuthResult> => {
    try {
      // Get token from header
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      // Check if user has the required role
      if (decoded.role !== role) {
        return NextResponse.json(
          { message: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }
      
      // Add user info to request
      return { isAuthorized: true, user: decoded };
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { message: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }
  };
}