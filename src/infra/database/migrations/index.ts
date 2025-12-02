import { readdir } from 'fs/promises'
import path from 'path'
import type { Migration } from './Migration'

const versionsDir = path.resolve(__dirname, '../versions')
const sourceExtension = path.extname(__filename) || '.js'

export const loadMigrations = async (): Promise<Migration[]> => {
  const dirEntries = await readdir(versionsDir, { withFileTypes: true }).catch(() => [])
  const versionDirs = dirEntries.filter((entry) => entry.isDirectory())

  const migrationsPerVersion = await Promise.all(
    versionDirs.map(async (versionDir) => {
      const migrationIndex = path.join(versionsDir, versionDir.name, `index${sourceExtension}`)
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(migrationIndex) as { migrations?: Migration[] }
        return module.migrations ?? []
      } catch (error) {
        console.warn(`[MigrationLoader] Falha ao carregar version ${versionDir.name}:`, error)
        return []
      }
    }),
  )

  return migrationsPerVersion.flat().sort((a, b) => a.id.localeCompare(b.id))
}

