import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PlatformRole } from '../../common/enums';
import { User } from '../../users/entities/user.entity';

/** /admin uçlarını yalnızca platform yöneticisine açar */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    if (request.user?.platformRole !== PlatformRole.ADMIN) {
      throw new ForbiddenException(
        'Bu bölüme yalnızca yöneticiler erişebilir.',
      );
    }
    return true;
  }
}
