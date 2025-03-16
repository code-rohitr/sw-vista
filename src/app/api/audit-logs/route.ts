import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'godmode') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build the Prisma query
    let query: any = {
      orderBy: {
        timestamp: 'desc',
      },
      where: {},
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    };
    
    if (userId) {
      query.where.user_id = parseInt(userId);
    }
    
    if (action) {
      query.where.action = action;
    }
    
    if (entityType) {
      query.where.entity_type = entityType;
    }
    
    if (startDate || endDate) {
      query.where.timestamp = {};
      
      if (startDate) {
        query.where.timestamp.gte = new Date(startDate);
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of the day
        query.where.timestamp.lte = end;
      }
    }
    
    // Fetch logs from database
    const logs = await prisma.auditLogs.findMany(query);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { message: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Create audit log entry
    const log = await prisma.auditLogs.create({
      data: {
        user_id: body.userId || decoded.id,
        entity_type: body.entityType,
        entity_id: body.entityId,
        action: body.action,
        timestamp: new Date(),
      },
    });
    
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { message: 'Failed to create audit log' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}