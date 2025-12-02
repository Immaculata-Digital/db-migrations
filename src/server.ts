import { env } from './config/env'
import { app } from './app'

const { port } = env.app

app.listen(port, () => {
  console.log(`🚀 DB Migrations API rodando em http://localhost:${port}/api/health`)
})

