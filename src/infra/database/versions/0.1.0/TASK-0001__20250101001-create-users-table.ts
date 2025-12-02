import type { Migration } from '../../migrations/Migration'

export const createUsersTable20250101001: Migration = {
  id: '20250101001',
  name: 'create-users-table',
  async up({ db }) {
    await db.execute(`
      -- Habilitar extensão pgcrypto
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Criar tabela access_groups
      CREATE TABLE IF NOT EXISTS access_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(120) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        features TEXT[] NOT NULL DEFAULT '{}',
        created_by VARCHAR(160) NOT NULL,
        updated_by VARCHAR(160) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Criar tabela users
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        login VARCHAR(80) NOT NULL UNIQUE,
        email VARCHAR(160) NOT NULL UNIQUE,
        password VARCHAR(255),
        allow_features TEXT[] NOT NULL DEFAULT '{}',
        denied_features TEXT[] NOT NULL DEFAULT '{}',
        created_by VARCHAR(160) NOT NULL,
        updated_by VARCHAR(160) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Criar tabela access_group_memberships
      CREATE TABLE IF NOT EXISTS access_group_memberships (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        group_id UUID NOT NULL REFERENCES access_groups(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, group_id)
      );

      -- Criar índices
      CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_access_groups_code ON access_groups(code);
      CREATE INDEX IF NOT EXISTS idx_access_group_memberships_user_id ON access_group_memberships(user_id);
      CREATE INDEX IF NOT EXISTS idx_access_group_memberships_group_id ON access_group_memberships(group_id);
    `)
  },
  async down({ db }) {
    await db.execute(`
      DROP TABLE IF EXISTS access_group_memberships;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS access_groups;
    `)
  },
}

