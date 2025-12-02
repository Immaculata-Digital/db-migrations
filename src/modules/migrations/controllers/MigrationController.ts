import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../../core/errors/AppError'
import { MigrationService } from '../services/MigrationService'
import { runMigrationSchema } from '../validators/runMigration.schema'

export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  run = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = runMigrationSchema.safeParse(req.body ?? {})
      if (!parseResult.success) {
        throw new AppError('Falha de validação', 422, parseResult.error.flatten())
      }

      const result = await this.migrationService.run(parseResult.data.direction)
      return res.json({
        status: 'ok',
        result,
      })
    } catch (error) {
      return next(error)
    }
  }

  createTenantTablesForAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.migrationService.createTenantTablesForAllSchemas()
      return res.json({
        status: 'ok',
        result,
      })
    } catch (error) {
      return next(error)
    }
  }

  createTenantTablesForSchema = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { schemaName } = req.params
      if (!schemaName) {
        throw new AppError('Nome do schema é obrigatório', 400)
      }

      const result = await this.migrationService.createTenantTablesForSchema(schemaName)
      return res.json({
        status: result.success ? 'ok' : 'error',
        result,
      })
    } catch (error) {
      return next(error)
    }
  }
}

export const migrationController = new MigrationController(new MigrationService())

