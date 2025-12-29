import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Adicionar remetente SMTP padrão em todos os schemas
 * Insere um remetente padrão "Concordia ERP" nas configurações SMTP
 */
export const addDefaultSmtpSender20250101012: Migration = {
  id: '20250101012',
  name: 'add-default-smtp-sender',
  async up({ db }) {
    // Senha criptografada: 12Qwaszx123!@#
    // Formato: iv:encrypted (usando AES-256-CTR com IV fixo para consistência)
    const encryptedPassword = '00000000000000000000000000000000:3edfa627ac424e05412e10a441bb'

    // Inserir remetente padrão em todos os schemas existentes
    await db.execute(`
      DO $$
      DECLARE
        schema_record RECORD;
        encrypted_password TEXT := '00000000000000000000000000000000:3edfa627ac424e05412e10a441bb';
      BEGIN
        -- Iterar sobre todos os schemas (exceto system schemas)
        FOR schema_record IN 
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
        LOOP
          -- Verificar se a tabela remetentes_smtp existe e se não há remetente com o email padrão
          IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = schema_record.schema_name 
            AND table_name = 'remetentes_smtp'
          ) THEN
            -- Inserir remetente padrão apenas se não existir
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
                1
              WHERE NOT EXISTS (
                SELECT 1 
                FROM %I.remetentes_smtp 
                WHERE email = ''no-reply@immaculatadigital.com.br''
              )
            ', schema_record.schema_name, encrypted_password, schema_record.schema_name);
          END IF;
        END LOOP;
      END $$;
    `)

    // Atualizar função create_tenant_tables para incluir a inserção do remetente padrão
    await db.execute(`
      CREATE OR REPLACE FUNCTION create_tenant_tables(schema_name TEXT)
      RETURNS TEXT AS $$
      DECLARE
        result TEXT := '';
        encrypted_password TEXT := '00000000000000000000000000000000:3edfa627ac424e05412e10a441bb';
      BEGIN
        -- Validar nome do schema
        IF NOT (schema_name ~ '^[a-zA-Z_][a-zA-Z0-9_]*$') THEN
          RAISE EXCEPTION 'Nome de schema inválido: %', schema_name;
        END IF;

        -- Criar schema se não existir
        EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

        -- Criar tabela configuracoes_globais
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
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.configuracoes_globais criada. ', schema_name);

        -- Criar tabela lojas
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.lojas (
            id_loja SERIAL PRIMARY KEY,
            nome_loja TEXT NOT NULL,
            numero_identificador TEXT NOT NULL UNIQUE,
            nome_responsavel TEXT NOT NULL,
            telefone_responsavel TEXT NOT NULL,
            cnpj TEXT NOT NULL UNIQUE,
            endereco_completo TEXT NOT NULL,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.lojas criada. ', schema_name);

        -- Criar índices para lojas
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%I_lojas_numero_identificador ON %I.lojas(numero_identificador)', schema_name, schema_name);
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%I_lojas_cnpj ON %I.lojas(cnpj)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_lojas_nome ON %I.lojas(nome_loja)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_lojas_dt_cadastro ON %I.lojas(dt_cadastro)', schema_name, schema_name);

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

        -- Criar tabela itens_recompensa
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.itens_recompensa (
            id_item_recompensa SERIAL PRIMARY KEY,
            nome_item TEXT NOT NULL,
            descricao TEXT NOT NULL,
            qtd_pontos INTEGER NOT NULL,
            imagem_item TEXT,
            nao_retirar_loja BOOLEAN NOT NULL DEFAULT false,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.itens_recompensa criada. ', schema_name);

        -- Criar índices para itens_recompensa
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_itens_recompensa_nome ON %I.itens_recompensa(nome_item)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_itens_recompensa_pontos ON %I.itens_recompensa(qtd_pontos)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_itens_recompensa_dt_cadastro ON %I.itens_recompensa(dt_cadastro)', schema_name, schema_name);

        -- Criar tabela webradio
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.webradio (
            id_webradio SERIAL PRIMARY KEY,
            nome_audio TEXT NOT NULL,
            arquivo_audio_base64 TEXT,
            duracao_segundos INTEGER,
            ordem INTEGER NOT NULL DEFAULT 1,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.webradio criada. ', schema_name);

        -- Criar índices para webradio
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_webradio_nome ON %I.webradio(nome_audio)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_webradio_ordem ON %I.webradio(ordem)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_webradio_dt_cadastro ON %I.webradio(dt_cadastro)', schema_name, schema_name);

        -- Criar tabela clientes
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.clientes (
            id_cliente SERIAL PRIMARY KEY,
            id_usuario INTEGER NOT NULL UNIQUE,
            id_loja INTEGER NOT NULL,
            nome_completo TEXT NOT NULL,
            email TEXT NOT NULL,
            whatsapp TEXT NOT NULL,
            cep TEXT NOT NULL,
            sexo CHAR(1) NOT NULL CHECK (sexo IN (''M'', ''F'')),
            saldo INTEGER NOT NULL DEFAULT 0,
            aceite_termos BOOLEAN NOT NULL DEFAULT false,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.clientes criada. ', schema_name);

        -- Criar índices para clientes
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%I_clientes_id_usuario ON %I.clientes(id_usuario)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_email ON %I.clientes(email)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_whatsapp ON %I.clientes(whatsapp)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_id_loja ON %I.clientes(id_loja)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_dt_cadastro ON %I.clientes(dt_cadastro)', schema_name, schema_name);

        -- Criar tabela cliente_pontos_movimentacao
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
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.cliente_pontos_movimentacao criada. ', schema_name);

        -- Criar índices para cliente_pontos_movimentacao
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_id_cliente ON %I.cliente_pontos_movimentacao(id_cliente)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_tipo ON %I.cliente_pontos_movimentacao(tipo)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_dt_cadastro ON %I.cliente_pontos_movimentacao(dt_cadastro)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_id_item ON %I.cliente_pontos_movimentacao(id_item_recompensa)', schema_name, schema_name);

        -- Criar tabela cliente_item_recompensa (para códigos de resgate)
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

        -- Criar tabela remetentes_smtp (se ainda não existir)
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
          )', schema_name);
        result := result || format('Tabela %I.remetentes_smtp criada. ', schema_name);

        -- Criar índices para remetentes_smtp
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_remetentes_smtp_email ON %I.remetentes_smtp(email)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_remetentes_smtp_dt_cadastro ON %I.remetentes_smtp(dt_cadastro)', schema_name, schema_name);

        -- Inserir remetente padrão se não existir
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
            1
          WHERE NOT EXISTS (
            SELECT 1 
            FROM %I.remetentes_smtp 
            WHERE email = ''no-reply@immaculatadigital.com.br''
          )
        ', schema_name, encrypted_password, schema_name);
        result := result || format('Remetente SMTP padrão inserido em %I. ', schema_name);

        -- Adicionar comentários
        EXECUTE format('COMMENT ON TABLE %I.configuracoes_globais IS ''Configurações visuais do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.lojas IS ''Lojas/unidades do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.log_sistema IS ''Logs do sistema do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.itens_recompensa IS ''Itens de recompensa do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.webradio IS ''Áudios da webradio do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.clientes IS ''Clientes do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.cliente_pontos_movimentacao IS ''Movimentações de pontos dos clientes''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.cliente_item_recompensa IS ''Códigos de resgate de itens pelos clientes''', schema_name);

        result := result || format('Índices criados. Comentários adicionados.');
        
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `)
  },
  async down({ db }) {
    // Remover remetente padrão de todos os schemas
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
          IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = schema_record.schema_name 
            AND table_name = 'remetentes_smtp'
          ) THEN
            EXECUTE format('
              DELETE FROM %I.remetentes_smtp 
              WHERE email = ''no-reply@immaculatadigital.com.br''
            ', schema_record.schema_name);
          END IF;
        END LOOP;
      END $$;
    `)

    // Reverter função create_tenant_tables para versão anterior (sem inserção do remetente padrão)
    // Nota: Isso requer restaurar a versão anterior da função, que não inclui a tabela remetentes_smtp
    // Por simplicidade, vamos apenas remover a parte de inserção do remetente padrão
    await db.execute(`
      CREATE OR REPLACE FUNCTION create_tenant_tables(schema_name TEXT)
      RETURNS TEXT AS $$
      DECLARE
        result TEXT := '';
      BEGIN
        -- Validar nome do schema
        IF NOT (schema_name ~ '^[a-zA-Z_][a-zA-Z0-9_]*$') THEN
          RAISE EXCEPTION 'Nome de schema inválido: %', schema_name;
        END IF;

        -- Criar schema se não existir
        EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

        -- Criar tabela configuracoes_globais
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
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.configuracoes_globais criada. ', schema_name);

        -- Criar tabela lojas
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.lojas (
            id_loja SERIAL PRIMARY KEY,
            nome_loja TEXT NOT NULL,
            numero_identificador TEXT NOT NULL UNIQUE,
            nome_responsavel TEXT NOT NULL,
            telefone_responsavel TEXT NOT NULL,
            cnpj TEXT NOT NULL UNIQUE,
            endereco_completo TEXT NOT NULL,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.lojas criada. ', schema_name);

        -- Criar índices para lojas
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%I_lojas_numero_identificador ON %I.lojas(numero_identificador)', schema_name, schema_name);
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%I_lojas_cnpj ON %I.lojas(cnpj)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_lojas_nome ON %I.lojas(nome_loja)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_lojas_dt_cadastro ON %I.lojas(dt_cadastro)', schema_name, schema_name);

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

        -- Criar tabela itens_recompensa
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.itens_recompensa (
            id_item_recompensa SERIAL PRIMARY KEY,
            nome_item TEXT NOT NULL,
            descricao TEXT NOT NULL,
            qtd_pontos INTEGER NOT NULL,
            imagem_item TEXT,
            nao_retirar_loja BOOLEAN NOT NULL DEFAULT false,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.itens_recompensa criada. ', schema_name);

        -- Criar índices para itens_recompensa
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_itens_recompensa_nome ON %I.itens_recompensa(nome_item)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_itens_recompensa_pontos ON %I.itens_recompensa(qtd_pontos)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_itens_recompensa_dt_cadastro ON %I.itens_recompensa(dt_cadastro)', schema_name, schema_name);

        -- Criar tabela webradio
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.webradio (
            id_webradio SERIAL PRIMARY KEY,
            nome_audio TEXT NOT NULL,
            arquivo_audio_base64 TEXT,
            duracao_segundos INTEGER,
            ordem INTEGER NOT NULL DEFAULT 1,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.webradio criada. ', schema_name);

        -- Criar índices para webradio
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_webradio_nome ON %I.webradio(nome_audio)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_webradio_ordem ON %I.webradio(ordem)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_webradio_dt_cadastro ON %I.webradio(dt_cadastro)', schema_name, schema_name);

        -- Criar tabela clientes
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I.clientes (
            id_cliente SERIAL PRIMARY KEY,
            id_usuario INTEGER NOT NULL UNIQUE,
            id_loja INTEGER NOT NULL,
            nome_completo TEXT NOT NULL,
            email TEXT NOT NULL,
            whatsapp TEXT NOT NULL,
            cep TEXT NOT NULL,
            sexo CHAR(1) NOT NULL CHECK (sexo IN (''M'', ''F'')),
            saldo INTEGER NOT NULL DEFAULT 0,
            aceite_termos BOOLEAN NOT NULL DEFAULT false,
            dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.clientes criada. ', schema_name);

        -- Criar índices para clientes
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%I_clientes_id_usuario ON %I.clientes(id_usuario)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_email ON %I.clientes(email)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_whatsapp ON %I.clientes(whatsapp)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_id_loja ON %I.clientes(id_loja)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clientes_dt_cadastro ON %I.clientes(dt_cadastro)', schema_name, schema_name);

        -- Criar tabela cliente_pontos_movimentacao
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
            usu_cadastro INTEGER NOT NULL,
            dt_altera TIMESTAMPTZ,
            usu_altera INTEGER
          )', schema_name);
        result := result || format('Tabela %I.cliente_pontos_movimentacao criada. ', schema_name);

        -- Criar índices para cliente_pontos_movimentacao
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_id_cliente ON %I.cliente_pontos_movimentacao(id_cliente)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_tipo ON %I.cliente_pontos_movimentacao(tipo)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_dt_cadastro ON %I.cliente_pontos_movimentacao(dt_cadastro)', schema_name, schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_cliente_pontos_mov_id_item ON %I.cliente_pontos_movimentacao(id_item_recompensa)', schema_name, schema_name);

        -- Criar tabela cliente_item_recompensa (para códigos de resgate)
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

        -- Adicionar comentários
        EXECUTE format('COMMENT ON TABLE %I.configuracoes_globais IS ''Configurações visuais do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.lojas IS ''Lojas/unidades do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.log_sistema IS ''Logs do sistema do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.itens_recompensa IS ''Itens de recompensa do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.webradio IS ''Áudios da webradio do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.clientes IS ''Clientes do tenant''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.cliente_pontos_movimentacao IS ''Movimentações de pontos dos clientes''', schema_name);
        EXECUTE format('COMMENT ON TABLE %I.cliente_item_recompensa IS ''Códigos de resgate de itens pelos clientes''', schema_name);

        result := result || format('Índices criados. Comentários adicionados.');
        
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `)
  },
}

