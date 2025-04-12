import { Controller, Post, Body } from '@nestjs/common';
import { RequirePermission } from '../middleware/permission.middleware';
import { PermissionService } from '../services/rbac/permission.service';
import { RoleService } from '../services/rbac/role.service';
import { UserRoleService } from '../services/rbac/user-role.service';

@Controller('clubs')
export class ClubController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
    private readonly userRoleService: UserRoleService,
  ) {}

  @Post('members')
  @RequirePermission('create:club:member')
  async createMember(@Body() data: any) {
    // Your implementation here
    return { message: 'Member created successfully' };
  }

  // Example of setting up permissions and roles
  async setupPermissions(userId: string) {
    // Create permission
    const permission = await this.permissionService.createPermission({
      name: 'create:club:member',
      action: 'create',
      scope: 'club',
      resource_type: 'member',
      created_by: userId,
    });

    // Create role
    const role = await this.roleService.createRole({
      name: 'Club Admin',
      entityType_id: 'club-type-id',
      entity_id: 'club-id',
      template_id: 'template-id',
    });

    // Assign permission to role
    await this.roleService.assignPermissionsToRole(
      role.id,
      [permission.id],
      'resource-id',
    );

    // Assign role to user
    await this.userRoleService.assignRoleToUser({
      entity_id: 'club-id',
      entity_role_id: role.id,
      user_id: userId,
    });
  }
} 