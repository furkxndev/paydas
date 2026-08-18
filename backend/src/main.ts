import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const port = config.get<AppConfig['port']>('port')!;
  const apiPrefix = config.get<AppConfig['apiPrefix']>('apiPrefix')!;
  const corsOrigins = config.get<AppConfig['corsOrigins']>('corsOrigins')!;

  app.setGlobalPrefix(apiPrefix);
  app.use(helmet());
  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // @Exclude() ile işaretli alanlar (ör. passwordHash) yanıtlardan çıkarılır
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  Logger.log(
    `Paydaş API çalışıyor: http://localhost:${port}/${apiPrefix}`,
    'Bootstrap',
  );
}

void bootstrap();
