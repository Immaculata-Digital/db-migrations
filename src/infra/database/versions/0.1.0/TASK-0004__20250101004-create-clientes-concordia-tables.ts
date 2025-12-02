import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Criar tabelas de clientes Concordia (globais, no schema PUBLIC)
 */
export const createClientesConcordiaTables20250101004: Migration = {
  id: '20250101004',
  name: 'create-clientes-concordia-tables',
  async up({ db }) {
    await db.execute(`
      -- Criar tabela clientes_concordia no schema public
      CREATE TABLE IF NOT EXISTS clientes_concordia (
        id_cliente_concordia SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(20) NOT NULL,
        schema VARCHAR(255) NOT NULL,
        ativo BOOLEAN NOT NULL DEFAULT true,
        dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        usu_cadastro INTEGER NOT NULL,
        dt_altera TIMESTAMPTZ,
        usu_altera INTEGER
      );

      -- Criar tabela clientes_concordia_usuarios no schema public
      CREATE TABLE IF NOT EXISTS clientes_concordia_usuarios (
        id_cliente_concordia_usuario SERIAL PRIMARY KEY,
        id_cliente_concordia INTEGER NOT NULL REFERENCES clientes_concordia(id_cliente_concordia) ON DELETE CASCADE,
        id_usuario INTEGER NOT NULL,
        dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        usu_cadastro INTEGER NOT NULL DEFAULT 0
      );

      -- Criar tabela clientes_concordia_usuario_lojas no schema public
      CREATE TABLE IF NOT EXISTS clientes_concordia_usuario_lojas (
        id_cliente_concordia_usuario_loja SERIAL PRIMARY KEY,
        id_cliente_concordia_usuario INTEGER NOT NULL REFERENCES clientes_concordia_usuarios(id_cliente_concordia_usuario) ON DELETE CASCADE,
        id_loja INTEGER NOT NULL,
        dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        usu_cadastro INTEGER NOT NULL DEFAULT 0
      );

      -- Criar índices
      CREATE INDEX IF NOT EXISTS idx_clientes_concordia_email ON clientes_concordia(email);
      CREATE INDEX IF NOT EXISTS idx_clientes_concordia_schema ON clientes_concordia(schema);
      CREATE INDEX IF NOT EXISTS idx_clientes_concordia_ativo ON clientes_concordia(ativo);
      CREATE INDEX IF NOT EXISTS idx_clientes_concordia_dt_cadastro ON clientes_concordia(dt_cadastro);
      
      CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_concordia_usuarios_unique ON clientes_concordia_usuarios(id_cliente_concordia, id_usuario);
      CREATE INDEX IF NOT EXISTS idx_clientes_concordia_usuarios_cliente ON clientes_concordia_usuarios(id_cliente_concordia);
      CREATE INDEX IF NOT EXISTS idx_clientes_concordia_usuarios_usuario ON clientes_concordia_usuarios(id_usuario);
      
      CREATE INDEX IF NOT EXISTS idx_clientes_concordia_usuario_lojas_usuario ON clientes_concordia_usuario_lojas(id_cliente_concordia_usuario);
      CREATE INDEX IF NOT EXISTS idx_clientes_concordia_usuario_lojas_loja ON clientes_concordia_usuario_lojas(id_loja);
      
      -- Comentários
      COMMENT ON TABLE clientes_concordia IS 'Tabela de clientes Concordia (globais)';
      COMMENT ON TABLE clientes_concordia_usuarios IS 'Relação entre clientes Concordia e usuários';
      COMMENT ON TABLE clientes_concordia_usuario_lojas IS 'Relação entre usuários de clientes e lojas';
    `)
  },
  async down({ db }) {
    await db.execute(`
      DROP TABLE IF EXISTS clientes_concordia_usuario_lojas;
      DROP TABLE IF EXISTS clientes_concordia_usuarios;
      DROP TABLE IF EXISTS clientes_concordia;
    `)
  },
}

