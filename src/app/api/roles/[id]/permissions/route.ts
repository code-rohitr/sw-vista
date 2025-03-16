import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get permissions for a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    const role = await prisma.userRoles.findUnique({
      where: { id },
    });
    
    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(role.permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { message: 'Error fetching permissions' },
      { status: 500 }
    );
  }
}