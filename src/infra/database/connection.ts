import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import { env } from '../../config/env'

export interface DatabaseClient {
  execute(sql: string, params?: unknown[]): Promise<void>
  query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>
}

class PostgreSQLClient implements DatabaseClient {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      host: env.database.host,
      port: env.database.port,
      database: env.database.name,
      user: env.database.user,
      password: env.database.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })
  }

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    const client = await this.pool.connect()
    try {
      await client.query(sql, params)
    } finally {
      client.release()
    }
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const client = await this.pool.connect()
    try {
      return await client.query<T>(sql, params)
    } finally {
      client.release()
    }
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
}

class FakeDatabaseClient implements DatabaseClient {
  async execute(sql: string, params: unknown[] = []) {
    console.info('[DB] Executando SQL:')
    console.info(sql.trim())
    if (params.length > 0) {
      console.info('[DB] Params:', params)
    }
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    console.info('[DB] Query SQL:')
    console.info(sql.trim())
    if (params.length > 0) {
      console.info('[DB] Params:', params)
    }
    return { rows: [] as T[], rowCount: 0 } as QueryResult<T>
  }
}

// Use PostgreSQLClient se as variáveis de ambiente estiverem configuradas
const useRealDatabase =
  env.database.host !== 'localhost' ||
  env.database.name !== 'immaculata' ||
  env.database.user !== 'developer' ||
  env.database.password !== ''

export const databaseClient: DatabaseClient = useRealDatabase
  ? new PostgreSQLClient()
  : new FakeDatabaseClient()

