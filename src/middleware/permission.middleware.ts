import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserRoleService } from '../services/rbac/user-role.service';

@Injectable()
export class PermissionMiddleware implements NestMiddleware {
  constructor(private readonly userRoleService: UserRoleService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id; // Assuming user is attached to request by auth middleware
    const requiredPermission = req.route?.permission; // Assuming permission is defined in route metadata

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!requiredPermission) {
      return next();
    }

    const hasPermission = await this.userRoleService.checkUserPermission(
      userId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new UnauthorizedException(
        `User does not have required permission: ${requiredPermission}`,
      );
    }

    next();
  }
}

// Decorator to set required permission for a route
export function RequirePermission(permission: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const req = args[0];
      req.route = req.route || {};
      req.route.permission = permission;
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
} 