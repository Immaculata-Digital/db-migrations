import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Adicionar campos de destinatários na tabela campanhas_disparo
 * Adiciona tipo_destinatario, lojas_ids e clientes_ids para permitir seleção de destinatários
 */
export const addDestinatariosCampanhasDisparo20250101009: Migration = {
  id: '20250101009',
  name: 'add-destinatarios-campanhas-disparo',
  async up({ db }) {
    // Atualizar tabelas existentes em todos os schemas
    await db.execute(`
      DO $$
      DECLARE
        schema_record RECORD;
      BEGIN
        -- Iterar sobre todos os schemas que têm a tabela campanhas_disparo
        FOR schema_record IN 
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
          AND EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = schema_name 
            AND table_name = 'campanhas_disparo'
          )
        LOOP
          -- Adicionar novos campos se não existirem
          EXECUTE format('
            ALTER TABLE %I.campanhas_disparo 
            ADD COLUMN IF NOT EXISTS tipo_destinatario VARCHAR(50) DEFAULT ''todos'',
            ADD COLUMN IF NOT EXISTS lojas_ids TEXT,
            ADD COLUMN IF NOT EXISTS clientes_ids TEXT
          ', schema_record.schema_name);
          
          -- Comentários nas colunas
          EXECUTE format('
            COMMENT ON COLUMN %I.campanhas_disparo.tipo_destinatario IS ''Tipo de destinatário: todos, lojas_especificas, clientes_especificos'';
            COMMENT ON COLUMN %I.campanhas_disparo.lojas_ids IS ''IDs das lojas selecionadas (string separada por vírgula)'';
            COMMENT ON COLUMN %I.campanhas_disparo.clientes_ids IS ''IDs dos clientes selecionados (string separada por vírgula)''
          ', schema_record.schema_name, schema_record.schema_name, schema_record.schema_name);
        END LOOP;
      END $$;
    `)

  },
  async down({ db }) {
    await db.execute(`
      DO $$
      DECLARE
        schema_record RECORD;
      BEGIN
        FOR schema_record IN 
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
          AND EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = schema_name 
            AND table_name = 'campanhas_disparo'
          )
        LOOP
          EXECUTE format('
            ALTER TABLE %I.campanhas_disparo 
            DROP COLUMN IF EXISTS tipo_destinatario,
            DROP COLUMN IF EXISTS lojas_ids,
            DROP COLUMN IF EXISTS clientes_ids
          ', schema_record.schema_name);
        END LOOP;
      END $$;
    `)
  },
}

