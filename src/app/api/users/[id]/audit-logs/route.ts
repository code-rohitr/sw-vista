import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user has permission to view audit logs
    const authResult = await requirePermission('view', '/api/users/audit-logs')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Await the params object before accessing its properties
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Get audit logs for the user
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { user_id: id }, // Actions performed by the user
          { 
            AND: [
              { entity_type: 'user' },
              { details: { path: ['entityId'], equals: id } }
            ]
          }
        ],
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 100, // Limit to last 100 logs
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user audit logs' },
      { status: 500 }
    );
  }
} 