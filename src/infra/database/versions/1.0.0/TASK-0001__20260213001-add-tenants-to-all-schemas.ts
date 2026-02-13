import type { Migration } from '../../migrations/Migration'

export const addTenantsToAllSchemas20260213001: Migration = {
    id: '20260213001',
    name: 'add-tenants-to-all-schemas',
    async up({ db }) {
        await db.execute(`
      DO $$
      DECLARE
          schema_record RECORD;
          table_record RECORD;
          seed_tenant_id UUID;
          status_id UUID;
          plan_id UUID;
      BEGIN
          -- Iterar sobre todos os schemas (exceto os do sistema e public)
          FOR schema_record IN
              SELECT schema_name
              FROM information_schema.schemata
              WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
          LOOP
              -- 1. Criar tabelas no schema
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.tenants_status_enum (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                      code VARCHAR UNIQUE NOT NULL,
                      name VARCHAR NOT NULL,
                      description VARCHAR,
                      icon VARCHAR NOT NULL DEFAULT ''Notification'',
                      sort INTEGER NOT NULL,
                      enabled BOOLEAN NOT NULL DEFAULT TRUE,
                      created_by VARCHAR NOT NULL,
                      updated_by VARCHAR NOT NULL,
                      deleted_by VARCHAR NOT NULL,
                      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                      deleted_at TIMESTAMP WITH TIME ZONE
                  )', schema_record.schema_name);

              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.tenants_plan_enum (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                      code VARCHAR UNIQUE NOT NULL,
                      name VARCHAR NOT NULL,
                      description VARCHAR,
                      icon VARCHAR NOT NULL DEFAULT ''Notification'',
                      sort INTEGER NOT NULL,
                      enabled BOOLEAN NOT NULL DEFAULT TRUE,
                      created_by VARCHAR NOT NULL,
                      updated_by VARCHAR NOT NULL,
                      deleted_by VARCHAR NOT NULL,
                      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                      deleted_at TIMESTAMP WITH TIME ZONE
                  )', schema_record.schema_name);

              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.tenants (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                      name VARCHAR NOT NULL,
                      slug VARCHAR UNIQUE NOT NULL,
                      status UUID REFERENCES %I.tenants_status_enum(id) NOT NULL,
                      plan UUID REFERENCES %I.tenants_plan_enum(id) NOT NULL,
                      settings JSONB DEFAULT ''{}'',
                      created_by VARCHAR NOT NULL,
                      updated_by VARCHAR NOT NULL,
                      deleted_by VARCHAR NOT NULL,
                      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                      deleted_at TIMESTAMP WITH TIME ZONE
                  )', schema_record.schema_name, schema_record.schema_name, schema_record.schema_name);

              -- 2. Criar seed data para o schema
              
              -- Inserir status se não existir
              EXECUTE format('
                  INSERT INTO %I.tenants_status_enum (code, name, sort, created_by, updated_by, deleted_by)
                  VALUES (''active'', ''Ativo'', 1, ''system'', ''system'', '''')
                  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
                  RETURNING id', schema_record.schema_name) INTO status_id;

              -- Inserir plano se não existir
              EXECUTE format('
                  INSERT INTO %I.tenants_plan_enum (code, name, sort, created_by, updated_by, deleted_by)
                  VALUES (''free'', ''Gratuito'', 1, ''system'', ''system'', '''')
                  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
                  RETURNING id', schema_record.schema_name) INTO plan_id;

              -- Inserir seed tenant se não existir
              EXECUTE format('
                  INSERT INTO %I.tenants (name, slug, status, plan, created_by, updated_by, deleted_by)
                  VALUES (''Seed Tenant'', %L, %L, %L, ''system'', ''system'', '''')
                  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
                  RETURNING id', schema_record.schema_name, 'seed-tenant-' || schema_record.schema_name, status_id, plan_id) INTO seed_tenant_id;

              -- 3. Em todas as tabelas do schema, criar coluna tenant_id
              FOR table_record IN
                  SELECT table_name
                  FROM information_schema.tables
                  WHERE table_schema = schema_record.schema_name
                    AND table_type = 'BASE TABLE'
                    AND table_name NOT IN ('tenants', 'tenants_status_enum', 'tenants_plan_enum')
              LOOP
                  -- Adicionar coluna tenant_id
                  EXECUTE format('
                      ALTER TABLE %I.%I
                      ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES %I.tenants(id) DEFAULT %L',
                      schema_record.schema_name, table_record.table_name, schema_record.schema_name, seed_tenant_id);

                  -- Criar índice composto (id, tenant_id) se a coluna 'id' existir
                  IF EXISTS (
                      SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = schema_record.schema_name 
                      AND table_name = table_record.table_name 
                      AND column_name = 'id'
                  ) THEN
                      EXECUTE format('
                          CREATE INDEX IF NOT EXISTS %I ON %I.%I (id, tenant_id)',
                          'idx_' || table_record.table_name || '_id_tenant_id', schema_record.schema_name, table_record.table_name);
                  END IF;
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
      BEGIN
          FOR schema_record IN
              SELECT schema_name
              FROM information_schema.schemata
              WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
          LOOP
              -- Remover colunas e índices das tabelas
              FOR table_record IN
                  SELECT table_name
                  FROM information_schema.tables
                  WHERE table_schema = schema_record.schema_name
                    AND table_type = 'BASE TABLE'
                    AND table_name NOT IN ('tenants', 'tenants_status_enum', 'tenants_plan_enum')
              LOOP
                  -- Remover índice
                  EXECUTE format('DROP INDEX IF EXISTS %I.%I', 
                      schema_record.schema_name, 'idx_' || table_record.table_name || '_id_tenant_id');
                  
                  -- Remover coluna
                  EXECUTE format('ALTER TABLE %I.%I DROP COLUMN IF EXISTS tenant_id', 
                      schema_record.schema_name, table_record.table_name);
              END LOOP;

              -- Remover tabelas de tenant
              EXECUTE format('DROP TABLE IF EXISTS %I.tenants CASCADE', schema_record.schema_name);
              EXECUTE format('DROP TABLE IF EXISTS %I.tenants_plan_enum CASCADE', schema_record.schema_name);
              EXECUTE format('DROP TABLE IF EXISTS %I.tenants_status_enum CASCADE', schema_record.schema_name);
          END LOOP;
      END $$;
    `)
    },
}
