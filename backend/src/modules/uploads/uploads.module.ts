import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticatedGuard } from '../../common/auth/authenticated.guard';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-supplynexu-secret',
    }),
  ],
  controllers: [UploadsController],
  providers: [AuthenticatedGuard],
})
export class UploadsModule {}
