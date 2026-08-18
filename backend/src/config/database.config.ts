import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppConfig } from './configuration';

/** TypeORM bağlantısı tamamen ortam değişkenlerinden kurulur */
export const buildTypeOrmOptions = (
  config: ConfigService,
): TypeOrmModuleOptions => {
  const db = config.get<AppConfig['database']>('database')!;

  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.name,
    autoLoadEntities: true,
    synchronize: db.synchronize,
    logging: db.logging,
    namingStrategy: undefined,
  };
};
