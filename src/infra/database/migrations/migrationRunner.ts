import type { Migration, MigrationContext } from './Migration'

export class MigrationRunner {
  constructor(
    private readonly migrations: Migration[],
    private readonly context: MigrationContext,
  ) {}

  async run(direction: 'up' | 'down') {
    if (this.migrations.length === 0) {
      console.info('[Migration] Nenhuma migration registrada.')
      return
    }

    const queue = direction === 'up' ? this.migrations : [...this.migrations].reverse()

    for (const migration of queue) {
      console.info(`\n[Migration] ${direction.toUpperCase()} -> ${migration.id} - ${migration.name}`)
      await migration[direction](this.context)
    }

    console.info(`\n[Migration] Concluído (${direction}).`)
  }
}

