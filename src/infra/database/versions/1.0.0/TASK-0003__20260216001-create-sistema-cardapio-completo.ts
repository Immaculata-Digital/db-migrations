import type { Migration } from '../../migrations/Migration'

export const createSistemaCardapioCompleto: Migration = {
    id: '20260216001',
    name: 'create-sistema-cardapio-completo',
    async up({ db }) {
        await db.execute(`
      DO $$
      DECLARE
          schema_record RECORD;
      BEGIN
          -- Iterar sobre todos os schemas (todos os que NÃO são public nem de sistema)
          FOR schema_record IN
              SELECT schema_name
              FROM information_schema.schemata
              WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
          LOOP
              -- Table: cardapio_categorias
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.cardapio_categorias (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                      nome VARCHAR NOT NULL,
                      ordem_exibicao INTEGER DEFAULT 0,
                      ativa BOOLEAN DEFAULT TRUE NOT NULL,

                      tenant_id UUID NOT NULL,
                      created_by VARCHAR NOT NULL,
                      updated_by VARCHAR NOT NULL,
                      deleted_by VARCHAR,
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      deleted_at TIMESTAMP WITH TIME ZONE,

                      CONSTRAINT fk_cardapio_categorias_tenant FOREIGN KEY (tenant_id) REFERENCES %I.tenants(id)
                  )', schema_record.schema_name, schema_record.schema_name);
              
              EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.cardapio_categorias(tenant_id)', 'idx_cardapio_categorias_tenant_id_' || schema_record.schema_name, schema_record.schema_name);

              -- Table: cardapio_produtos
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.cardapio_produtos (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                      categoria_id UUID NOT NULL,
                      nome VARCHAR NOT NULL,
                      descricao TEXT,
                      preco DECIMAL(10, 2) NOT NULL,
                      imagem_url VARCHAR,
                      disponivel BOOLEAN DEFAULT TRUE NOT NULL,
                      imprime_cozinha BOOLEAN DEFAULT TRUE,

                      tenant_id UUID NOT NULL,
                      created_by VARCHAR NOT NULL,
                      updated_by VARCHAR NOT NULL,
                      deleted_by VARCHAR,
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      deleted_at TIMESTAMP WITH TIME ZONE,

                      CONSTRAINT fk_cardapio_produtos_tenant FOREIGN KEY (tenant_id) REFERENCES %I.tenants(id),
                      CONSTRAINT fk_produtos_categoria FOREIGN KEY (categoria_id) REFERENCES %I.cardapio_categorias(id)
                  )', schema_record.schema_name, schema_record.schema_name, schema_record.schema_name);

              EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.cardapio_produtos(tenant_id)', 'idx_cardapio_produtos_tenant_id_' || schema_record.schema_name, schema_record.schema_name);

              -- Table: comanda_mesas
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.comanda_mesas (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                      numero VARCHAR NOT NULL,
                      status_atual VARCHAR DEFAULT ''LIVRE'' NOT NULL,

                      tenant_id UUID NOT NULL,
                      created_by VARCHAR NOT NULL,
                      updated_by VARCHAR NOT NULL,
                      deleted_by VARCHAR,
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      deleted_at TIMESTAMP WITH TIME ZONE,

                      CONSTRAINT fk_comanda_mesas_tenant FOREIGN KEY (tenant_id) REFERENCES %I.tenants(id)
                  )', schema_record.schema_name, schema_record.schema_name);

              EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.comanda_mesas(tenant_id)', 'idx_comanda_mesas_tenant_id_' || schema_record.schema_name, schema_record.schema_name);

              -- Table: comanda_sessoes
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.comanda_sessoes (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                      mesa_id UUID NOT NULL,
                      nome_cliente VARCHAR,
                      data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      data_fechamento TIMESTAMP WITH TIME ZONE,
                      valor_total DECIMAL(10, 2),

                      tenant_id UUID NOT NULL,
                      created_by VARCHAR NOT NULL,
                      updated_by VARCHAR NOT NULL,
                      deleted_by VARCHAR,
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      deleted_at TIMESTAMP WITH TIME ZONE,

                      CONSTRAINT fk_comanda_sessoes_tenant FOREIGN KEY (tenant_id) REFERENCES %I.tenants(id),
                      CONSTRAINT fk_sessao_mesa FOREIGN KEY (mesa_id) REFERENCES %I.comanda_mesas(id)
                  )', schema_record.schema_name, schema_record.schema_name, schema_record.schema_name);

              EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.comanda_sessoes(tenant_id)', 'idx_comanda_sessoes_tenant_id_' || schema_record.schema_name, schema_record.schema_name);

              -- Table: comanda_pedidos
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.comanda_pedidos (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                      sessao_id UUID NOT NULL,
                      usuario_id UUID,
                      data_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      status VARCHAR DEFAULT ''ENVIADO'' NOT NULL,

                      tenant_id UUID NOT NULL,
                      created_by VARCHAR NOT NULL,
                      updated_by VARCHAR NOT NULL,
                      deleted_by VARCHAR,
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      deleted_at TIMESTAMP WITH TIME ZONE,

                      CONSTRAINT fk_comanda_pedidos_tenant FOREIGN KEY (tenant_id) REFERENCES %I.tenants(id),
                      CONSTRAINT fk_pedido_sessao FOREIGN KEY (sessao_id) REFERENCES %I.comanda_sessoes(id)
                  )', schema_record.schema_name, schema_record.schema_name, schema_record.schema_name);

              EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.comanda_pedidos(tenant_id)', 'idx_comanda_pedidos_tenant_id_' || schema_record.schema_name, schema_record.schema_name);

              -- Table: comanda_itens
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.comanda_itens (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                      pedido_id UUID NOT NULL,
                      produto_id UUID NOT NULL,
                      quantidade INTEGER NOT NULL DEFAULT 1,
                      preco_unitario DECIMAL(10, 2) NOT NULL,
                      observacao TEXT,
                      status_item VARCHAR DEFAULT ''VALIDO'',

                      tenant_id UUID NOT NULL,
                      created_by VARCHAR NOT NULL,
                      updated_by VARCHAR NOT NULL,
                      deleted_by VARCHAR,
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      deleted_at TIMESTAMP WITH TIME ZONE,

                      CONSTRAINT fk_comanda_itens_tenant FOREIGN KEY (tenant_id) REFERENCES %I.tenants(id),
                      CONSTRAINT fk_item_pedido FOREIGN KEY (pedido_id) REFERENCES %I.comanda_pedidos(id),
                      CONSTRAINT fk_item_produto FOREIGN KEY (produto_id) REFERENCES %I.cardapio_produtos(id)
                  )', schema_record.schema_name, schema_record.schema_name, schema_record.schema_name, schema_record.schema_name);

              EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.comanda_itens(tenant_id)', 'idx_comanda_itens_tenant_id_' || schema_record.schema_name, schema_record.schema_name);

              -- Table: comanda_pagamentos
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.comanda_pagamentos (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                      sessao_id UUID NOT NULL,
                      metodo_pagamento VARCHAR NOT NULL,
                      valor DECIMAL(10, 2) NOT NULL,
                      data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

                      tenant_id UUID NOT NULL,
                      created_by VARCHAR NOT NULL,
                      updated_by VARCHAR NOT NULL,
                      deleted_by VARCHAR,
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                      deleted_at TIMESTAMP WITH TIME ZONE,

                      CONSTRAINT fk_comanda_pagamentos_tenant FOREIGN KEY (tenant_id) REFERENCES %I.tenants(id),
                      CONSTRAINT fk_pagamento_sessao FOREIGN KEY (sessao_id) REFERENCES %I.comanda_sessoes(id)
                  )', schema_record.schema_name, schema_record.schema_name, schema_record.schema_name);

              EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.comanda_pagamentos(tenant_id)', 'idx_comanda_pagamentos_tenant_id_' || schema_record.schema_name, schema_record.schema_name);
          
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
              EXECUTE format('DROP TABLE IF EXISTS %I.comanda_pagamentos CASCADE', schema_record.schema_name);
              EXECUTE format('DROP TABLE IF EXISTS %I.comanda_itens CASCADE', schema_record.schema_name);
              EXECUTE format('DROP TABLE IF EXISTS %I.comanda_pedidos CASCADE', schema_record.schema_name);
              EXECUTE format('DROP TABLE IF EXISTS %I.comanda_sessoes CASCADE', schema_record.schema_name);
              EXECUTE format('DROP TABLE IF EXISTS %I.comanda_mesas CASCADE', schema_record.schema_name);
              EXECUTE format('DROP TABLE IF EXISTS %I.cardapio_produtos CASCADE', schema_record.schema_name);
              EXECUTE format('DROP TABLE IF EXISTS %I.cardapio_categorias CASCADE', schema_record.schema_name);
          END LOOP;
      END $$;
    `)
    },
}
