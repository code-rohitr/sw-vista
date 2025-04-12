import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RbacModule } from './services/rbac/rbac.module';
import { ClubModule } from './club.module';
import { PermissionMiddleware } from './middleware/permission.middleware';

@Module({
  imports: [
    RbacModule,
    ClubModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PermissionMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
} 