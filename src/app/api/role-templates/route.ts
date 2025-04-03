import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { isSystemAdmin } from '@/lib/auth';

// GET /api/role-templates - Get all role templates
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view role templates
    const authResult = await requirePermission('view', '/api/role-templates')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Only system admins can view role templates
    const isAdmin = await isSystemAdmin(authResult.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Only system administrators can view role templates' },
        { status: 403 }
      );
    }

    // Get all role templates
    const templates = await prisma.roleTemplate.findMany({
      include: {
        entityRoles: true,
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching role templates:', error);
    return NextResponse.json(
      { message: 'Failed to fetch role templates' },
      { status: 500 }
    );
  }
}

// POST /api/role-templates - Create a new role template
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to manage role templates
    const authResult = await requirePermission('manage', '/api/role-templates')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Only system admins can create role templates
    const isAdmin = await isSystemAdmin(authResult.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Only system administrators can create role templates' },
        { status: 403 }
      );
    }

    // Get request body
    const { name, description, permissions } = await request.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: 'Template name is required' },
        { status: 400 }
      );
    }

    // Create template
    const template = await prisma.roleTemplate.create({
      data: {
        name,
        description,
        permissions: JSON.stringify(permissions || []),
      },
      include: {
        entityRoles: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'role_template',
        entity_id: template.id,
        action: 'create_template',
        details: JSON.stringify({ name, permissions })
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating role template:', error);
    return NextResponse.json(
      { message: 'Failed to create role template' },
      { status: 500 }
    );
  }
} 