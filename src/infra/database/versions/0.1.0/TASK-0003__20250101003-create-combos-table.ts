import type { Migration } from '../../migrations/Migration'

/**
 * Migration: Criar tabela de combos (globais, no schema PUBLIC)
 * Combos são configurações dinâmicas que podem ser usadas em qualquer lugar do sistema
 */
export const createCombosTable20250101003: Migration = {
  id: '20250101003',
  name: 'create-combos-table',
  async up({ db }) {
    await db.execute(`
      -- Criar tabela combos no schema public
      CREATE TABLE IF NOT EXISTS combos (
        id_combo SERIAL PRIMARY KEY,
        descricao TEXT NOT NULL,
        chave VARCHAR(100) NOT NULL UNIQUE,
        script TEXT NOT NULL,
        dt_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        usu_cadastro INTEGER NOT NULL,
        dt_altera TIMESTAMPTZ,
        usu_altera INTEGER
      );

      -- Criar índices
      CREATE UNIQUE INDEX IF NOT EXISTS idx_combos_chave ON combos(chave);
      CREATE INDEX IF NOT EXISTS idx_combos_descricao ON combos(descricao);
      CREATE INDEX IF NOT EXISTS idx_combos_dt_cadastro ON combos(dt_cadastro);
      
      -- Comentários
      COMMENT ON TABLE combos IS 'Tabela de combos dinâmicos (globais)';
      COMMENT ON COLUMN combos.chave IS 'Chave única para identificar a combo';
      COMMENT ON COLUMN combos.script IS 'Script SQL que será executado para retornar os valores da combo';
    `)
  },
  async down({ db }) {
    await db.execute(`
      DROP TABLE IF EXISTS combos;
    `)
  },
}

