import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../modules/users/domain/user-role.enum';
import { UserStatus } from '../../modules/users/domain/user-status.enum';
import { UsersService } from '../../modules/users/users.service';

type AuthenticatedIdentity = {
  sub: string;
  role: string;
};

type RequestWithAuth = Request & {
  user?: AuthenticatedIdentity;
};

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();

    if (request.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Administrator permissions required');
    }

    const user = await this.usersService.findById(request.user.sub);

    if (
      !user ||
      user.role !== UserRole.ADMIN ||
      user.status === UserStatus.DISABLED
    ) {
      throw new ForbiddenException('Administrator permissions required');
    }

    return true;
  }
}
