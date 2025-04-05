import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

// GET /api/role-templates/[id] - Get a specific role template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.roleTemplate.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: {
            version_number: 'desc'
          },
          take: 1
        },
        entityRoles: true
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Role template not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format in the frontend
    const latestVersion = template.versions[0];
    const transformedTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      permissions: latestVersion ? Object.entries(latestVersion.permissions as Record<string, boolean>)
        .filter(([_, value]) => value)
        .map(([permission]) => ({
          permission: { id: permission, name: permission, action: permission },
          resource: { id: 'default', name: 'default', path: '/' }
        })) : []
    };

    return NextResponse.json(transformedTemplate);
  } catch (error) {
    console.error('Error fetching role template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role template' },
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
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update role templates
    await requirePermission(user.id, 'update', 'role_templates');

    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.roleTemplate.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: {
            version_number: 'desc'
          },
          take: 1
        }
      }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Role template not found' },
        { status: 404 }
      );
    }

    // Update template
    const template = await prisma.roleTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description,
      },
      include: {
        versions: {
          orderBy: {
            version_number: 'desc'
          },
          take: 1
        }
      }
    });

    // Create a new version with updated permissions
    const latestVersion = existingTemplate.versions[0];
    const latestVersionNumber = latestVersion ? latestVersion.version_number : 0;
    
    const permissionsObject = permissions.reduce((acc: Record<string, boolean>, p: any) => {
      acc[p.permission_id] = true;
      return acc;
    }, {});

    await prisma.roleTemplateVersion.create({
      data: {
        template_id: template.id,
        version_number: latestVersionNumber + 1,
        changes: { 
          name: name !== existingTemplate.name ? { from: existingTemplate.name, to: name } : undefined,
          description: description !== existingTemplate.description ? { from: existingTemplate.description, to: description } : undefined
        },
        permissions: permissionsObject,
        created_by: user.id
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'role_templates',
        action: 'update',
        details: JSON.stringify({
          template_id: template.id,
          name: template.name,
          description: template.description,
        }),
      },
    });

    // Get the updated template with the latest version
    const updatedTemplate = await prisma.roleTemplate.findUnique({
      where: { id: template.id },
      include: {
        versions: {
          orderBy: {
            version_number: 'desc'
          },
          take: 1
        }
      }
    });

    // Transform the data to match the expected format in the frontend
    const transformedTemplate = {
      id: updatedTemplate!.id,
      name: updatedTemplate!.name,
      description: updatedTemplate!.description,
      permissions: updatedTemplate!.versions[0] ? 
        Object.entries(updatedTemplate!.versions[0].permissions as Record<string, boolean>)
          .filter(([_, value]) => value)
          .map(([permission]) => ({
            permission: { id: permission, name: permission, action: permission },
            resource: { id: 'default', name: 'default', path: '/' }
          })) : []
    };

    return NextResponse.json(transformedTemplate);
  } catch (error) {
    console.error('Error updating role template:', error);
    return NextResponse.json(
      { error: 'Failed to update role template' },
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
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete role templates
    await requirePermission(user.id, 'delete', 'role_templates');

    // Check if template exists and has no associated roles
    const template = await prisma.roleTemplate.findUnique({
      where: { id: params.id },
      include: {
        entityRoles: true,
        versions: true
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Role template not found' },
        { status: 404 }
      );
    }

    if (template.entityRoles.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template with associated roles' },
        { status: 400 }
      );
    }

    // Delete template versions first
    await prisma.roleTemplateVersion.deleteMany({
      where: { template_id: params.id },
    });

    // Delete template
    await prisma.roleTemplate.delete({
      where: { id: params.id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'role_templates',
        action: 'delete',
        details: JSON.stringify({
          template_id: params.id,
          name: template.name,
        }),
      },
    });

    return NextResponse.json({ message: 'Role template deleted successfully' });
  } catch (error) {
    console.error('Error deleting role template:', error);
    return NextResponse.json(
      { error: 'Failed to delete role template' },
      { status: 500 }
    );
  }
} 