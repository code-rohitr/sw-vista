import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

// GET /api/role-templates - Get all role templates
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.roleTemplate.findMany({
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

    // Transform the data to match the expected format in the frontend
    const transformedTemplates = templates.map(template => {
      const latestVersion = template.versions[0];
      return {
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
    });

    return NextResponse.json(transformedTemplates);
  } catch (error) {
    console.error('Error fetching role templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role templates' },
      { status: 500 }
    );
  }
}

// POST /api/role-templates - Create a new role template
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create role templates
    await requirePermission(user.id, 'create', 'role_templates');

    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create the template
    const template = await prisma.roleTemplate.create({
      data: {
        name,
        description,
      },
      include: {
        versions: true
      }
    });

    // Create the initial version with permissions
    const permissionsObject = permissions.reduce((acc: Record<string, boolean>, p: any) => {
      acc[p.permission_id] = true;
      return acc;
    }, {});

    await prisma.roleTemplateVersion.create({
      data: {
        template_id: template.id,
        version_number: 1,
        changes: { initial: true },
        permissions: permissionsObject,
        created_by: user.id
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        entity_type: 'role_templates',
        action: 'create',
        details: JSON.stringify({
          template_id: template.id,
          name: template.name,
          description: template.description,
        }),
      },
    });

    // Return the template with the latest version
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

    return NextResponse.json(transformedTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating role template:', error);
    return NextResponse.json(
      { error: 'Failed to create role template' },
      { status: 500 }
    );
  }
} 