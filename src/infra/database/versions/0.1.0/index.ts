import type { Migration } from '../../migrations/Migration'
import { createUsersTable20250101001 } from './TASK-0001__20250101001-create-users-table'
import { createSchemasTable20250101002 } from './TASK-0002__20250101002-create-schemas-table'
import { createCombosTable20250101003 } from './TASK-0003__20250101003-create-combos-table'
import { createClientesConcordiaTables20250101004 } from './TASK-0004__20250101004-create-clientes-concordia-tables'
import { createTenantTablesFunction20250101005 } from './TASK-0005__20250101005-create-tenant-tables-function'

export const migrations: Migration[] = [
  createUsersTable20250101001,
  createSchemasTable20250101002,
  createCombosTable20250101003,
  createClientesConcordiaTables20250101004,
  createTenantTablesFunction20250101005,
]

