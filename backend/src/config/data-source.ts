import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

/**
 * TypeORM CLI'ın (migration üretme/çalıştırma) kullandığı veri kaynağı.
 * Uygulamanın çalışma zamanı bağlantısı app.module.ts üzerinden kurulur;
 * burası yalnızca komut satırı içindir.
 */
loadEnv();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: toNumber(process.env.DB_PORT, 5432),
  username: process.env.DB_USERNAME ?? 'paydas',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'paydas',
  // Derlenmiş çıktı üzerinden çalışır; ts-node bağımlılığı gerekmez
  entities: [__dirname + '/../**/*.entity.js'],
  migrations: [__dirname + '/../migrations/*.js'],
  synchronize: false,
});
