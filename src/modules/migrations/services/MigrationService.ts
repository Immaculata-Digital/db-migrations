import { databaseClient } from '../../../infra/database/connection'
import { loadMigrations } from '../../../infra/database/migrations'
import { MigrationRunner } from '../../../infra/database/migrations/migrationRunner'

export class MigrationService {
  async run(direction: 'up' | 'down') {
    const migrations = await loadMigrations()
    const runner = new MigrationRunner(migrations, { db: databaseClient })
    await runner.run(direction)

    return {
      total: migrations.length,
      direction,
      executedAt: new Date().toISOString(),
    }
  }

  /**
   * Cria as tabelas de tenant para todos os schemas registrados na tabela schemas
   */
  async createTenantTablesForAllSchemas() {
    // Buscar todos os schemas registrados
    const schemasResult = await databaseClient.query<{ schema_name: string }>(
      'SELECT schema_name FROM schemas ORDER BY schema_name'
    )

    const schemas = schemasResult.rows.map(row => row.schema_name)
    const results: Array<{ schema: string; success: boolean; message: string }> = []

    for (const schemaName of schemas) {
      try {
        // Chamar a função create_tenant_tables para cada schema
        const result = await databaseClient.query<{ create_tenant_tables: string }>(
          `SELECT create_tenant_tables($1) as create_tenant_tables`,
          [schemaName]
        )

        results.push({
          schema: schemaName,
          success: true,
          message: result.rows[0]?.create_tenant_tables || 'Tabelas criadas com sucesso',
        })
      } catch (error) {
        results.push({
          schema: schemaName,
          success: false,
          message: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }

    return {
      total: schemas.length,
      results,
      executedAt: new Date().toISOString(),
    }
  }

  /**
   * Cria as tabelas de tenant para um schema específico
   */
  async createTenantTablesForSchema(schemaName: string) {
    try {
      // Verificar se o schema existe na tabela schemas
      const schemaExists = await databaseClient.query<{ exists: boolean }>(
        'SELECT EXISTS(SELECT 1 FROM schemas WHERE schema_name = $1) as exists',
        [schemaName]
      )

      if (!schemaExists.rows[0]?.exists) {
        throw new Error(`Schema "${schemaName}" não está registrado na tabela schemas`)
      }

      // Chamar a função create_tenant_tables
      const result = await databaseClient.query<{ create_tenant_tables: string }>(
        `SELECT create_tenant_tables($1) as create_tenant_tables`,
        [schemaName]
      )

      return {
        schema: schemaName,
        success: true,
        message: result.rows[0]?.create_tenant_tables || 'Tabelas criadas com sucesso',
      }
    } catch (error) {
      return {
        schema: schemaName,
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    }
  }
}

