import { z } from 'zod'

export const runMigrationSchema = z.object({
  direction: z.enum(['up', 'down']),
})

