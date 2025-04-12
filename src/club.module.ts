import { Module } from '@nestjs/common';
import { ClubController } from './controllers/club.controller';
import { RbacModule } from './services/rbac/rbac.module';

@Module({
  imports: [RbacModule],
  controllers: [ClubController],
})
export class ClubModule {} 