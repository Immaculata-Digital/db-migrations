import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Criar tabela de schemas para gerenciar os schemas disponíveis
 * Esta tabela fica no schema PUBLIC e é usada para verificar quais schemas existem
 */
export const createSchemasTable20250101002: Migration = {
  id: '20250101002',
  name: 'create-schemas-table',
  async up({ db }) {
    await db.execute(`
      -- Criar tabela schemas no schema public
      CREATE TABLE IF NOT EXISTS schemas (
        id SERIAL PRIMARY KEY,
        schema_name VARCHAR(63) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by VARCHAR(160),
        updated_by VARCHAR(160)
      );

      -- Criar índice único no nome do schema
      CREATE UNIQUE INDEX IF NOT EXISTS idx_schemas_name ON schemas(schema_name);
      
      -- Comentários
      COMMENT ON TABLE schemas IS 'Tabela para gerenciar os schemas disponíveis no sistema';
      COMMENT ON COLUMN schemas.schema_name IS 'Nome do schema (deve corresponder a um schema real no PostgreSQL)';
      COMMENT ON COLUMN schemas.description IS 'Descrição opcional do schema';
    `)
  },
  async down({ db }) {
    await db.execute(`
      DROP TABLE IF EXISTS schemas;
    `)
  },
}

