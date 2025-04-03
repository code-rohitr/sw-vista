import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/roleCheck';
import { isSystemAdmin } from '@/lib/auth';

// GET /api/role-templates/[id] - Get a specific role template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { message: 'Invalid template ID' },
        { status: 400 }
      );
    }

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

    // Get the specific template
    const template = await prisma.roleTemplate.findUnique({
      where: { id: templateId },
      include: {
        entityRoles: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { message: 'Role template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching role template:', error);
    return NextResponse.json(
      { message: 'Failed to fetch role template' },
      { status: 500 }
    );
  }
}

// PUT /api/role-templates/[id] - Update a role template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { message: 'Invalid template ID' },
        { status: 400 }
      );
    }

    // Check if user has permission to manage role templates
    const authResult = await requirePermission('manage', '/api/role-templates')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Only system admins can update role templates
    const isAdmin = await isSystemAdmin(authResult.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Only system administrators can update role templates' },
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

    // Check if template exists
    const existingTemplate = await prisma.roleTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { message: 'Role template not found' },
        { status: 404 }
      );
    }

    // Update template
    const template = await prisma.roleTemplate.update({
      where: { id: templateId },
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
        entity_id: templateId,
        action: 'update_template',
        details: JSON.stringify({ name, permissions })
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating role template:', error);
    return NextResponse.json(
      { message: 'Failed to update role template' },
      { status: 500 }
    );
  }
}

// DELETE /api/role-templates/[id] - Delete a role template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { message: 'Invalid template ID' },
        { status: 400 }
      );
    }

    // Check if user has permission to manage role templates
    const authResult = await requirePermission('manage', '/api/role-templates')(request);
    if ('isAuthorized' in authResult === false) {
      return authResult;
    }

    // Only system admins can delete role templates
    const isAdmin = await isSystemAdmin(authResult.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Only system administrators can delete role templates' },
        { status: 403 }
      );
    }

    // Check if template exists
    const template = await prisma.roleTemplate.findUnique({
      where: { id: templateId },
      include: {
        entityRoles: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { message: 'Role template not found' },
        { status: 404 }
      );
    }

    // Check if template has any associated roles
    if (template.entityRoles.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete template with associated roles' },
        { status: 400 }
      );
    }

    // Delete template
    await prisma.roleTemplate.delete({
      where: { id: templateId },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user.id,
        entity_type: 'role_template',
        entity_id: templateId,
        action: 'delete_template',
        details: JSON.stringify({ name: template.name })
      }
    });

    return NextResponse.json({ message: 'Role template deleted successfully' });
  } catch (error) {
    console.error('Error deleting role template:', error);
    return NextResponse.json(
      { message: 'Failed to delete role template' },
      { status: 500 }
    );
  }
} 