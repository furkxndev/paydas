import { ValueTransformer } from 'typeorm';

/**
 * PostgreSQL numeric sütunları sürücüden string olarak gelir.
 * Para alanlarında JavaScript tarafında number kullanabilmek için dönüştürülür.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null): number =>
    value === null || value === undefined ? 0 : Number.parseFloat(value),
};
