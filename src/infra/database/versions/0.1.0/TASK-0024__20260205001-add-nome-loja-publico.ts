import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Adicionar campo nome_loja_publico na tabela lojas
 * 
 * Esta migration:
 * 1. Adiciona o campo nome_loja_publico (TEXT) na tabela lojas em todos os schemas
 * 2. Atualiza a função create_tenant_tables para incluir este campo
 * 3. CORRIGE a função create_tenant_tables que estava regredindo em migrations anteriores (recuperando tabelas de usuários, campanhas, etc.)
 */
export const addNomeLojaPublico20260205001: Migration = {
    id: '20260205001',
    name: 'add-nome-loja-publico',
    async up({ db }) {
        // 1. Adicionar campo em tabelas existentes
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
            AND table_name = 'lojas'
          )
        LOOP
          EXECUTE format('
            ALTER TABLE %I.lojas 
            ADD COLUMN IF NOT EXISTS nome_loja_publico TEXT
          ', schema_record.schema_name);
        END LOOP;
      END $$;
    `)

        // 2. Atualizar função create_tenant_tables (CONSOLIDADA)
        await db.execute(`
      CREATE OR REPLACE FUNCTION create_tenant_tables(schema_name TEXT)
      RETURNS TEXT AS $$
      DECLARE
        result TEXT := '';
        encrypted_password TEXT := '9373733711016f3c3e25a94b51ba6729:b843e39cc6f57526d4312dd18f54';
      BEGIN
        -- Validar nome do schema
        IF NOT (schema_name ~ '^[a-zA-Z_][a-zA-Z0-9_]*$') THEN
          RAISE EXCEPTION 'Nome de schema inválido: %', schema_name;
        END IF;

        -- Criar schema se não existir
        EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

        -- Criar tabela configuracoes_globais (com campos de TASK-0023 e UUID de TASK-0019)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.configuracoes_globais (
            id_config_global SERIAL PRIMARY KEY,
            logo_base64 TEXT,
            cor_fundo TEXT,
            cor_card TEXT,
            cor_texto_card TEXT,
            cor_valor_card TEXT,
            cor_botao TEXT,
            cor_texto_botao TEXT,
            fonte_titulos VARCHAR(100),
            fonte_textos VARCHAR(100),
            arquivo_politica_privacidade TEXT,
            arquivo_termos_uso TEXT,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro UUID,
            dt_altera TIMESTAMPTZ,
            usu_altera UUID
          )', schema_name);
        result := result || format('Tabela %I.configuracoes_globais criada. ', schema_name);

        -- Criar tabela lojas (com novo campo nome_loja_publico e UUID de TASK-0019)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.lojas (
            id_loja SERIAL PRIMARY KEY,
            nome_loja TEXT NOT NULL,
            nome_loja_publico TEXT,
            numero_identificador TEXT NOT NULL UNIQUE,
            nome_responsavel TEXT NOT NULL,
            telefone_responsavel TEXT NOT NULL,
            cnpj TEXT NOT NULL UNIQUE,
            endereco_completo TEXT NOT NULL,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro UUID,
            dt_altera TIMESTAMPTZ,
            usu_altera UUID
          )', schema_name);
        result := result || format('Tabela %I.lojas criada. ', schema_name);

        -- Criar índices para lojas
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%I_lojas_numero_identificador ON %I.lojas(numero_identificador)', schema_name, schema_name);
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%I_lojas_cnpj ON %I.lojas(cnpj)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_lojas_nome ON %I.lojas(nome_loja)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_lojas_dt_cadastro ON %I.lojas(dt_cadastro)', schema_name, schema_name);

        -- Criar tabela users (Restaurada de TASK-0018)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(255) NOT NULL,
            login VARCHAR(80) NOT NULL,
            email VARCHAR(160) NOT NULL,
            password VARCHAR(255),
            allow_features TEXT[] NOT NULL DEFAULT ''{}'',
            denied_features TEXT[] NOT NULL DEFAULT ''{}'',
            created_by VARCHAR(160) NOT NULL,
            updated_by VARCHAR(160) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uk_%I_users_login UNIQUE (login),
            CONSTRAINT uk_%I_users_email UNIQUE (email)
          )', schema_name, schema_name, schema_name);
        result := result || format('Tabela %I.users criada. ', schema_name);

        -- Criar índices para users
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_users_login ON %I.users(login)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_users_email ON %I.users(email)', schema_name, schema_name);

        -- Criar tabela usuario_lojas (Restaurada de TASK-0018, usu_cadastro UUID)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.usuario_lojas (
            id_usuario_loja SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            id_loja INTEGER NOT NULL,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro UUID,
            CONSTRAINT fk_%I_usuario_lojas_user FOREIGN KEY (user_id) REFERENCES %I.users(id) ON DELETE CASCADE,
            CONSTRAINT fk_%I_usuario_lojas_loja FOREIGN KEY (id_loja) REFERENCES %I.lojas(id_loja) ON DELETE CASCADE,
            CONSTRAINT uk_%I_usuario_lojas_user_loja UNIQUE (user_id, id_loja)
          )', schema_name, schema_name, schema_name, schema_name, schema_name, schema_name);
        result := result || format('Tabela %I.usuario_lojas criada. ', schema_name);

        -- Criar índices para usuario_lojas
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_usuario_lojas_user ON %I.usuario_lojas(user_id)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_usuario_lojas_loja ON %I.usuario_lojas(id_loja)', schema_name, schema_name);

        -- Criar tabela access_group_memberships (Restaurada de TASK-0018)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.access_group_memberships (
            user_id UUID NOT NULL,
            group_id UUID NOT NULL,
            PRIMARY KEY (user_id, group_id),
            CONSTRAINT fk_%I_access_group_memberships_user 
              FOREIGN KEY (user_id) 
              REFERENCES %I.users(id) 
              ON DELETE CASCADE
          )', schema_name, schema_name, schema_name);
        result := result || format('Tabela %I.access_group_memberships criada. ', schema_name);

        -- Criar índices para access_group_memberships
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_access_group_memberships_user_id 
          ON %I.access_group_memberships(user_id)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_access_group_memberships_group_id 
          ON %I.access_group_memberships(group_id)', schema_name, schema_name);

        -- Criar tabela user_lojas_gestoras (Restaurada de TASK-0018)
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
          )', schema_name, schema_name, schema_name, schema_name, schema_name);
        result := result || format('Tabela %I.user_lojas_gestoras criada. ', schema_name);
        
         -- Criar índices para user_lojas_gestoras
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_lojas_gestoras_user_id 
          ON %I.user_lojas_gestoras(user_id)', 
          schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_lojas_gestoras_loja_id 
          ON %I.user_lojas_gestoras(id_loja)', 
          schema_name, schema_name);

        -- Criar tabela log_sistema
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.log_sistema (
            id_log SERIAL PRIMARY KEY,
            dt_log TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            nivel VARCHAR(10) NOT NULL CHECK (nivel IN (''INFO'', ''WARN'', ''ERROR'', ''DEBUG'')),
            operacao VARCHAR(50) NOT NULL,
            tabela VARCHAR(100),
            id_registro INTEGER,
            usuario_id INTEGER,
            mensagem TEXT NOT NULL,
            dados_antes JSONB,
            dados_depois JSONB,
            ip_origem VARCHAR(45),
            user_agent TEXT,
            dados_extras JSONB
          )', schema_name);
        result := result || format('Tabela %I.log_sistema criada. ', schema_name);

        -- Criar índices para log_sistema
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_log_sistema_dt_log ON %I.log_sistema(dt_log)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_log_sistema_nivel ON %I.log_sistema(nivel)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_log_sistema_operacao ON %I.log_sistema(operacao)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_log_sistema_tabela ON %I.log_sistema(tabela)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_log_sistema_usuario ON %I.log_sistema(usuario_id)', schema_name, schema_name);

        -- Criar tabela itens_recompensa (UUID usu_cadastro)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.itens_recompensa (
            id_item_recompensa SERIAL PRIMARY KEY,
            nome_item TEXT NOT NULL,
            descricao TEXT NOT NULL,
            qtd_pontos INTEGER NOT NULL,
            imagem_item TEXT,
            nao_retirar_loja BOOLEAN NOT NULL DEFAULT false,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro UUID,
            dt_altera TIMESTAMPTZ,
            usu_altera UUID
          )', schema_name);
        result := result || format('Tabela %I.itens_recompensa criada. ', schema_name);

        -- Criar índices para itens_recompensa
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_itens_recompensa_nome ON %I.itens_recompensa(nome_item)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_itens_recompensa_pontos ON %I.itens_recompensa(qtd_pontos)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_itens_recompensa_dt_cadastro ON %I.itens_recompensa(dt_cadastro)', schema_name, schema_name);

        -- Criar tabela webradio (UUID usu_cadastro)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.webradio (
            id_webradio SERIAL PRIMARY KEY,
            nome_audio TEXT NOT NULL,
            arquivo_audio_base64 TEXT,
            duracao_segundos INTEGER,
            ordem INTEGER NOT NULL DEFAULT 1,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro UUID,
            dt_altera TIMESTAMPTZ,
            usu_altera UUID
          )', schema_name);
        result := result || format('Tabela %I.webradio criada. ', schema_name);

        -- Criar índices para webradio
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_webradio_nome ON %I.webradio(nome_audio)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_webradio_ordem ON %I.webradio(ordem)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_webradio_dt_cadastro ON %I.webradio(dt_cadastro)', schema_name, schema_name);

        -- Criar tabela clientes (UUID users, data_nascimento)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.clientes (
            id_cliente SERIAL PRIMARY KEY,
            id_usuario UUID NOT NULL UNIQUE,
            id_loja INTEGER NOT NULL,
            nome_completo TEXT NOT NULL,
            email TEXT NOT NULL,
            whatsapp TEXT NOT NULL,
            cep TEXT NOT NULL,
            sexo CHAR(1) NOT NULL CHECK (sexo IN (''M'', ''F'')),
            data_nascimento DATE,
            saldo INTEGER NOT NULL DEFAULT 0,
            aceite_termos BOOLEAN NOT NULL DEFAULT false,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro UUID,
            dt_altera TIMESTAMPTZ,
            usu_altera UUID
          )', schema_name);
        result := result || format('Tabela %I.clientes criada. ', schema_name);

        -- Criar índices para clientes
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%I_clientes_id_usuario ON %I.clientes(id_usuario)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_email ON %I.clientes(email)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_whatsapp ON %I.clientes(whatsapp)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_id_loja ON %I.clientes(id_loja)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_dt_cadastro ON %I.clientes(dt_cadastro)', schema_name, schema_name);

        -- Criar tabela cliente_pontos_movimentacao (UUID usu_cadastro)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.cliente_pontos_movimentacao (
            id_movimentacao SERIAL PRIMARY KEY,
            id_cliente INTEGER NOT NULL,
            tipo VARCHAR(10) NOT NULL CHECK (tipo IN (''CREDITO'', ''DEBITO'', ''ESTORNO'')),
            pontos INTEGER NOT NULL,
            saldo_resultante INTEGER NOT NULL,
            origem VARCHAR(50) NOT NULL CHECK (origem IN (''MANUAL'', ''RESGATE'', ''AJUSTE'', ''PROMO'', ''OUTRO'')),
            id_loja INTEGER,
            id_item_recompensa INTEGER,
            observacao TEXT,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro UUID,
            dt_altera TIMESTAMPTZ,
            usu_altera UUID
          )', schema_name);
        result := result || format('Tabela %I.cliente_pontos_movimentacao criada. ', schema_name);

        -- Criar índices para cliente_pontos_movimentacao
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_id_cliente ON %I.cliente_pontos_movimentacao(id_cliente)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_tipo ON %I.cliente_pontos_movimentacao(tipo)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_dt_cadastro ON %I.cliente_pontos_movimentacao(dt_cadastro)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_id_item ON %I.cliente_pontos_movimentacao(id_item_recompensa)', schema_name, schema_name);

        -- Criar tabela cliente_item_recompensa (tabela compatibilidade, mantida)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.cliente_item_recompensa (
            id_cliente_item_recompensa SERIAL PRIMARY KEY,
            id_cliente INTEGER NOT NULL,
            id_item_recompensa INTEGER NOT NULL,
            id_movimentacao INTEGER,
            codigo_resgate VARCHAR(5) NOT NULL UNIQUE,
            resgate_utilizado BOOLEAN NOT NULL DEFAULT false,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            dt_utilizado TIMESTAMPTZ
          )', schema_name);
        result := result || format('Tabela %I.cliente_item_recompensa criada. ', schema_name);

        -- Criar índices para cliente_item_recompensa
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%I_cliente_item_recompensa_codigo ON %I.cliente_item_recompensa(codigo_resgate)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_item_recompensa_cliente ON %I.cliente_item_recompensa(id_cliente)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_item_recompensa_item ON %I.cliente_item_recompensa(id_item_recompensa)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_item_recompensa_utilizado ON %I.cliente_item_recompensa(resgate_utilizado)', schema_name, schema_name);

        -- Criar tabela clientes_itens_recompensa (Restaurada de TASK-0021, UUID usu_cadastro)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.clientes_itens_recompensa (
            id_cliente_item_recompensa SERIAL PRIMARY KEY,
            id_cliente INTEGER NOT NULL,
            id_item_recompensa INTEGER NOT NULL,
            id_movimentacao INTEGER,
            codigo_resgate VARCHAR(5) NOT NULL,
            schema VARCHAR(50) NOT NULL,
            resgate_utilizado BOOLEAN DEFAULT false,
            dt_cadastro TIMESTAMP DEFAULT NOW(),
            usu_cadastro UUID,
            
            CONSTRAINT fk_cliente FOREIGN KEY (id_cliente) REFERENCES %I.clientes(id_cliente) ON DELETE CASCADE,
            CONSTRAINT fk_item_recompensa FOREIGN KEY (id_item_recompensa) REFERENCES %I.itens_recompensa(id_item_recompensa) ON DELETE CASCADE,
            CONSTRAINT fk_movimentacao FOREIGN KEY (id_movimentacao) REFERENCES %I.cliente_pontos_movimentacao(id_movimentacao) ON DELETE SET NULL,
            CONSTRAINT uk_codigo_resgate UNIQUE (codigo_resgate)
          )', schema_name, schema_name, schema_name, schema_name);
        result := result || format('Tabela %I.clientes_itens_recompensa criada. ', schema_name);

        -- Criar índices para clientes_itens_recompensa
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_itens_recompensa_cliente ON %I.clientes_itens_recompensa(id_cliente)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_itens_recompensa_item ON %I.clientes_itens_recompensa(id_item_recompensa)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_itens_recompensa_cliente_item ON %I.clientes_itens_recompensa(id_cliente, id_item_recompensa)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_itens_recompensa_utilizado ON %I.clientes_itens_recompensa(resgate_utilizado) WHERE resgate_utilizado = false', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_itens_recompensa_codigo ON %I.clientes_itens_recompensa(codigo_resgate)', schema_name, schema_name);

        -- Criar tabela remetentes_smtp (Restaurada de TASK-0018, usu_cadastro atualizado para UUID)
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
            usu_cadastro UUID,
            dt_altera TIMESTAMPTZ,
            usu_altera UUID
          )', schema_name);
        result := result || format('Tabela %I.remetentes_smtp criada. ', schema_name);

        -- Criar índices para remetentes_smtp
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_remetentes_smtp_email ON %I.remetentes_smtp(email)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_remetentes_smtp_dt_cadastro ON %I.remetentes_smtp(dt_cadastro)', schema_name, schema_name);

        -- Inserir remetente padrão se não existir (sem usu_cadastro pois não temos UUID garantido)
        EXECUTE format('
          INSERT INTO %I.remetentes_smtp (
            nome,
            email,
            senha,
            smtp_host,
            smtp_port,
            smtp_secure,
            dt_cadastro,
            usu_cadastro
          )
          SELECT 
            ''Concordia ERP'',
            ''no-reply@immaculatadigital.com.br'',
            %L,
            ''smtp.hostinger.com'',
            465,
            true,
            NOW(),
            NULL
          WHERE NOT EXISTS (
            SELECT 1 
            FROM %I.remetentes_smtp 
            WHERE email = ''no-reply@immaculatadigital.com.br''
          )
        ', schema_name, encrypted_password, schema_name);
        result := result || format('Remetente SMTP padrão inserido em %I. ', schema_name);

         -- Criar tabela campanhas_disparo (Restaurada de TASK-0018, usu_cadastro UUID)
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.campanhas_disparo (
            id_campanha UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tipo VARCHAR(50) NOT NULL DEFAULT ''email'',
            descricao TEXT NOT NULL,
            assunto TEXT NOT NULL,
            html TEXT NOT NULL,
            remetente_id UUID,
            tipo_envio VARCHAR(50) NOT NULL DEFAULT ''manual'',
            data_agendamento TIMESTAMPTZ,
            status VARCHAR(50) NOT NULL DEFAULT ''rascunho'',
            total_enviados INTEGER DEFAULT 0,
            total_entregues INTEGER DEFAULT 0,
            total_abertos INTEGER DEFAULT 0,
            total_cliques INTEGER DEFAULT 0,
            chave VARCHAR(255) UNIQUE,
            tipo_destinatario VARCHAR(50) DEFAULT ''todos'',
            lojas_ids TEXT,
            clientes_ids TEXT,
            cliente_pode_excluir BOOLEAN NOT NULL DEFAULT true,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro UUID,
            dt_altera TIMESTAMPTZ,
            usu_altera UUID,
            CONSTRAINT fk_%I_campanha_remetente FOREIGN KEY (remetente_id) REFERENCES %I.remetentes_smtp(id_remetente)
          )', schema_name, schema_name, schema_name);
        result := result || format('Tabela %I.campanhas_disparo criada. ', schema_name);

        -- Criar índices para campanhas_disparo
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_campanhas_disparo_remetente ON %I.campanhas_disparo(remetente_id)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_campanhas_disparo_status ON %I.campanhas_disparo(status)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_campanhas_disparo_chave ON %I.campanhas_disparo(chave)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_campanhas_disparo_dt_cadastro ON %I.campanhas_disparo(dt_cadastro)', schema_name, schema_name);

        -- Inserir campanhas padrão (adaptado de TASK-0018 com usu_cadastro NULL)
        EXECUTE format('
          INSERT INTO %I.campanhas_disparo (
            id_campanha, tipo, descricao, assunto, html, remetente_id, tipo_envio,
            status, total_enviados, total_entregues, total_abertos, total_cliques,
            chave, tipo_destinatario, cliente_pode_excluir, dt_cadastro, usu_cadastro
          )
          SELECT
            gen_random_uuid(),
            ''email'',
            ''Boas Vindas'',
            ''Bem-vindo(a) à nossa plataforma!'',
            ''<!DOCTYPE html><html><body><h1>Bem-vindo(a)!</h1></body></html>'', 
            (SELECT id_remetente FROM %I.remetentes_smtp WHERE email = ''no-reply@immaculatadigital.com.br'' LIMIT 1),
            ''boas_vindas'',
            ''rascunho'',
            0, 0, 0, 0,
            ''boas_vindas_padrao'',
            ''todos'',
            false,
            NOW(),
            NULL
          WHERE NOT EXISTS (
            SELECT 1 FROM %I.campanhas_disparo WHERE chave = ''boas_vindas_padrao''
          )
        ', schema_name, schema_name, schema_name);

        -- Adicionar comentários
        EXECUTE format('COMMENT ON TABLE %I.configuracoes_globais IS ''Configurações visuais do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.lojas IS ''Lojas/unidades do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.users IS ''Usuários do tenant (isolados por schema)''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.usuario_lojas IS ''Relação entre usuários e lojas do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.user_lojas_gestoras IS ''Relação entre usuários e lojas das quais são gestores (grupo ADM-LOJA)''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.access_group_memberships IS ''Relação entre usuários e grupos de acesso do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.log_sistema IS ''Logs do sistema do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.itens_recompensa IS ''Itens de recompensa do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.webradio IS ''Áudios da webradio do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.clientes IS ''Clientes do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.cliente_pontos_movimentacao IS ''Movimentações de pontos dos clientes''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.cliente_item_recompensa IS ''Códigos de resgate de itens pelos clientes (compatibilidade)''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.clientes_itens_recompensa IS ''Códigos de resgate de itens pelos clientes (com campos completos)''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.remetentes_smtp IS ''Remetentes SMTP para envio de emails''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.campanhas_disparo IS ''Campanhas de disparo de emails''', schema_name);

        result := result || format('Índices criados. Comentários adicionados.');
        
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `)
    },
    async down({ db }) {
        // Reverter: remover campo nome_loja_publico
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
            AND table_name = 'lojas'
          )
        LOOP
           EXECUTE format('
            ALTER TABLE %I.lojas 
            DROP COLUMN IF EXISTS nome_loja_publico
          ', schema_record.schema_name);
        END LOOP;
      END $$;
    `)
    },
}
