import type { Migration } from '../../migrations/Migration'

export const enableRlsAndTenantPolicies20260213002: Migration = {
    id: '20260213002',
    name: 'enable-rls-and-tenant-policies',
    async up({ db }) {
        await db.execute(`
      DO $$
      DECLARE
          schema_record RECORD;
          table_record RECORD;
          policy_name TEXT;
      BEGIN
          -- Iterar sobre todos os schemas (exceto os do sistema e public)
          FOR schema_record IN
              SELECT schema_name
              FROM information_schema.schemata
              WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
          LOOP
              -- Iterar sobre todas as tabelas do schema que possuem a coluna tenant_id
              FOR table_record IN
                  SELECT table_name
                  FROM information_schema.columns
                  WHERE table_schema = schema_record.schema_name
                    AND column_name = 'tenant_id'
                    -- Garantir que é uma tabela base
                    AND table_name IN (
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = schema_record.schema_name 
                        AND table_type = 'BASE TABLE'
                    )
              LOOP
                  -- 1. Habilitar Row Level Security
                  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', 
                      schema_record.schema_name, table_record.table_name);

                  -- 2. Criar a política de isolamento por tenant
                  policy_name := format('tenant_isolation_policy_%s_%s', 
                      schema_record.schema_name, table_record.table_name);
                  
                  EXECUTE format('
                      CREATE POLICY %I ON %I.%I 
                      USING (tenant_id = current_setting(''app.current_tenant'')::uuid)',
                      policy_name, schema_record.schema_name, table_record.table_name);

                  -- 3. Habilitar a política para o Owner também (opcional, mas recomendado para consistência)
                  EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', 
                      schema_record.schema_name, table_record.table_name);

              END LOOP;
          END LOOP;
      END $$;
    `)
    },
    async down({ db }) {
        await db.execute(`
      DO $$
      DECLARE
          schema_record RECORD;
          table_record RECORD;
          policy_name TEXT;
      BEGIN
          FOR schema_record IN
              SELECT schema_name
              FROM information_schema.schemata
              WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
          LOOP
              FOR table_record IN
                  SELECT table_name
                  FROM information_schema.columns
                  WHERE table_schema = schema_record.schema_name
                    AND column_name = 'tenant_id'
              LOOP
                  -- 1. Remover a política
                  policy_name := format('tenant_isolation_policy_%s_%s', 
                      schema_record.schema_name, table_record.table_name);
                  
                  EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_name, schema_record.schema_name, table_record.table_name);

                  -- 2. Desabilitar Row Level Security
                  EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', 
                      schema_record.schema_name, table_record.table_name);
              END LOOP;
          END LOOP;
      END $$;
    `)
    },
}
