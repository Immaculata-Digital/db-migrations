import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Criar tabelas de comunicações (remetentes_smtp e campanhas_disparo)
 */
export const createComunicacoesTables20250101008: Migration = {
  id: '20250101008',
  name: 'create-comunicacoes-tables',
  async up({ db }) {
    // Criar tabelas em todos os schemas existentes
    await db.execute(`
      DO $$
      DECLARE
        schema_record RECORD;
      BEGIN
        -- Iterar sobre todos os schemas (exceto system schemas)
        FOR schema_record IN 
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
        LOOP
          -- Criar tabela remetentes_smtp
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.remetentes_smtp (
              id_remetente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              nome TEXT NOT NULL,
              email TEXT NOT NULL,
              senha TEXT NOT NULL,
              smtp_host TEXT NOT NULL,
              smtp_port INTEGER NOT NULL,
              smtp_secure BOOLEAN NOT NULL DEFAULT true,
              dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              usu_cadastro INTEGER NOT NULL,
              dt_altera TIMESTAMPTZ,
              usu_altera INTEGER
            )
          ', schema_record.schema_name);
          
          -- Criar índices para remetentes_smtp
          EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_remetentes_smtp_email ON %I.remetentes_smtp(email)', schema_record.schema_name, schema_record.schema_name);
          EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_remetentes_smtp_dt_cadastro ON %I.remetentes_smtp(dt_cadastro)', schema_record.schema_name, schema_record.schema_name);
          
          -- Criar tabela campanhas_disparo
          EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.campanhas_disparo (
              id_campanha UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              tipo VARCHAR(50) NOT NULL DEFAULT ''email'',
              descricao TEXT NOT NULL,
              assunto TEXT NOT NULL,
              html TEXT NOT NULL,
              remetente_id UUID NOT NULL,
              tipo_envio VARCHAR(50) NOT NULL DEFAULT ''manual'',
              data_agendamento TIMESTAMPTZ,
              status VARCHAR(50) NOT NULL DEFAULT ''rascunho'',
              total_enviados INTEGER DEFAULT 0,
              total_entregues INTEGER DEFAULT 0,
              total_abertos INTEGER DEFAULT 0,
              total_cliques INTEGER DEFAULT 0,
              chave VARCHAR(255) UNIQUE,
              dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              usu_cadastro INTEGER NOT NULL,
              dt_altera TIMESTAMPTZ,
              usu_altera INTEGER,
              CONSTRAINT fk_campanha_remetente FOREIGN KEY (remetente_id) REFERENCES %I.remetentes_smtp(id_remetente)
            )
          ', schema_record.schema_name, schema_record.schema_name);
          
          -- Criar índices para campanhas_disparo
          EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_campanhas_disparo_remetente ON %I.campanhas_disparo(remetente_id)', schema_record.schema_name, schema_record.schema_name);
          EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_campanhas_disparo_status ON %I.campanhas_disparo(status)', schema_record.schema_name, schema_record.schema_name);
          EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_campanhas_disparo_chave ON %I.campanhas_disparo(chave)', schema_record.schema_name, schema_record.schema_name);
          EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_campanhas_disparo_dt_cadastro ON %I.campanhas_disparo(dt_cadastro)', schema_record.schema_name, schema_record.schema_name);
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
        LOOP
          -- Remover tabelas (a ordem importa devido à foreign key)
          EXECUTE format('DROP TABLE IF EXISTS %I.campanhas_disparo CASCADE', schema_record.schema_name);
          EXECUTE format('DROP TABLE IF EXISTS %I.remetentes_smtp CASCADE', schema_record.schema_name);
        END LOOP;
      END $$;
    `)
  },
}
