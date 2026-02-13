import { loadMigrations } from './infra/database/migrations'
import { MigrationRunner } from './infra/database/migrations/migrationRunner'
import { databaseClient } from './infra/database/connection'

async function runMigrations() {
    console.info('🚀 Iniciando execução de migrations...')
    try {
        const allMigrations = await loadMigrations()

        // Filtrar apenas as migrations da versão 1.0.0 que criamos
        const v1Migrations = allMigrations.filter(m => m.id.startsWith('20260213'))

        if (v1Migrations.length === 0) {
            console.info('⚠️ Nenhuma migration da versão 1.0.0 encontrada para executar.')
            process.exit(0)
        }

        const runner = new MigrationRunner(v1Migrations, { db: databaseClient })
        await runner.run('up')

        console.info('✅ Migrations executadas com sucesso!')
        process.exit(0)
    } catch (error) {
        console.error('❌ Erro ao executar migrations:', error)
        process.exit(1)
    }
}

runMigrations()
