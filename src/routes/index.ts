import { Router } from 'express'
import { migrationController } from '../modules/migrations/controllers/MigrationController'

export const routes = Router()

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

routes.post('/migrations/run', migrationController.run)
routes.post('/migrations/create-tenant-tables', migrationController.createTenantTablesForAll)
routes.post('/migrations/create-tenant-tables/:schemaName', migrationController.createTenantTablesForSchema)

