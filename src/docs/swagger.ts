import swaggerJsdoc from 'swagger-jsdoc'

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'DB Migrations API',
    version: '1.0.0',
    description: 'API para gerenciar migrations do banco de dados',
  },
  servers: [
    {
      url: 'http://localhost:3444/api',
      description: 'Desenvolvimento local',
    },
  ],
  tags: [
    { name: 'Health', description: 'Status do serviço' },
    { name: 'Migrations', description: 'Gerenciamento de migrations' },
  ],
  components: {
    schemas: {
      RunMigrationInput: {
        type: 'object',
        required: ['direction'],
        properties: {
          direction: {
            type: 'string',
            enum: ['up', 'down'],
            description: 'Direção da migration: up para aplicar, down para reverter',
          },
        },
      },
      MigrationResult: {
        type: 'object',
        properties: {
          total: { type: 'number', description: 'Total de migrations executadas' },
          direction: { type: 'string', enum: ['up', 'down'] },
          executedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica status da API',
        responses: {
          200: {
            description: 'Serviço operante',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/migrations/run': {
      post: {
        tags: ['Migrations'],
        summary: 'Executa migrations',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RunMigrationInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Migrations executadas com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    result: { $ref: '#/components/schemas/MigrationResult' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [],
}

export const swaggerSpec = swaggerJsdoc(swaggerOptions)

