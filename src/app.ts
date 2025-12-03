import express from 'express'
import morgan from 'morgan'
import 'express-async-errors'
import routes from './routes'
import { applySecurity } from './middleware/security'
import { attachAuthLogger } from './middleware/authLogger'
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  // Middlewares comunes
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Security middleware (helmet, cors, rate limit)
  applySecurity(app)

  // Attach auth logger helper to requests (req.logFailedLogin)
  app.use(attachAuthLogger)

  // Logger en dev
  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'))
  }

  // Rutas API - always mount under /api so tests and runtime use the same paths
  app.use('/api', routes)
  // Keep a single prefix for the API routes

  // Handler errores
  app.use(errorHandler)

  return app
}

// Default export kept for test runners that expect `import app from './app'`
// Also export a default app instance for test runners that import the default
// (keeps backwards compatibility with test files that do `import app from './app'`).
const defaultApp = createApp()
export default defaultApp
