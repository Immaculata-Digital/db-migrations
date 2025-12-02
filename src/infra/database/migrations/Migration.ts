import type { DatabaseClient } from '../connection'

export interface MigrationContext {
  db: DatabaseClient
}

export interface Migration {
  id: string
  name: string
  up(context: MigrationContext): Promise<void>
  down(context: MigrationContext): Promise<void>
}

