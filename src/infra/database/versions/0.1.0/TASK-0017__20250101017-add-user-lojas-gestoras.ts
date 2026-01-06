import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Adicionar tabela user_lojas_gestoras
 * 
 * Esta migration:
 * 1. Cria tabela user_lojas_gestoras em todos os schemas existentes
 * 2. Atualiza função create_tenant_tables para incluir user_lojas_gestoras
 */
export const addUserLojasGestoras20250101017: Migration = {
  id: '20250101017',
  name: 'add-user-lojas-gestoras',
  async up({ db }) {
    // 1. Criar tabela user_lojas_gestoras em todos os schemas existentes
    await db.execute(`
      DO $$
      DECLARE
        schema_record RECORD;
      BEGIN
        -- Iterar sobre todos os schemas (exceto system schemas e public)
        FOR schema_record IN 
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
        LOOP
          -- Criar tabela user_lojas_gestoras no schema
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.user_lojas_gestoras (
              user_id UUID NOT NULL,
              id_loja INTEGER NOT NULL,
              PRIMARY KEY (user_id, id_loja),
              CONSTRAINT fk_%I_user_lojas_gestoras_user 
                FOREIGN KEY (user_id) 
                REFERENCES %I.users(id) 
                ON DELETE CASCADE,
              CONSTRAINT fk_%I_user_lojas_gestoras_loja 
                FOREIGN KEY (id_loja) 
                REFERENCES %I.lojas(id_loja) 
                ON DELETE CASCADE
            )
          ', schema_record.schema_name, schema_record.schema_name, schema_record.schema_name, schema_record.schema_name, schema_record.schema_name);

          -- Criar índices para user_lojas_gestoras
          EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_lojas_gestoras_user_id 
            ON %I.user_lojas_gestoras(user_id)', 
            schema_record.schema_name, schema_record.schema_name);
          EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_lojas_gestoras_loja_id 
            ON %I.user_lojas_gestoras(id_loja)', 
            schema_record.schema_name, schema_record.schema_name);
          
          -- Adicionar comentário
          EXECUTE format('COMMENT ON TABLE %I.user_lojas_gestoras IS 
            ''Relação entre usuários e lojas das quais são gestores (grupo ADM-LOJA)''', 
            schema_record.schema_name);
        END LOOP;
      END $$;
    `)

    // 2. Nota: A função create_tenant_tables precisará ser atualizada manualmente
    // ou através de uma migration separada para incluir user_lojas_gestoras
    // Por enquanto, a tabela será criada apenas nos schemas existentes
  },
  async down({ db }) {
    // Remover tabela user_lojas_gestoras de todos os schemas
    await db.execute(`
      DO $$
      DECLARE
        schema_record RECORD;
      BEGIN
        FOR schema_record IN 
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
        LOOP
          EXECUTE format('DROP TABLE IF EXISTS %I.user_lojas_gestoras CASCADE', schema_record.schema_name);
        END LOOP;
      END $$;
    `)
  },
}
