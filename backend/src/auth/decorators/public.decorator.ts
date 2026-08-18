import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Global JWT guard'ından muaf tutulan uçlar (giriş, kayıt) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
