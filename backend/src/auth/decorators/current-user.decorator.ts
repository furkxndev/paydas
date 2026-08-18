import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { User } from '../../users/entities/user.entity';

/** Doğrulanmış kullanıcıyı doğrudan controller parametresine verir */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user: User }>();
    return data ? request.user?.[data] : request.user;
  },
);
