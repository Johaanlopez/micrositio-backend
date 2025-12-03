import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import cors from 'cors'
import { Express, RequestHandler } from 'express'
import { config } from '../config'
import { sanitizeInputs } from './sanitizer'

// Login-specific rate limiter (5 attempts per 15 minutes per IP)
export const loginRateLimiter: RequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (en vez de 15)
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // 100 intentos en dev, 5 en producción
  message: { error: 'Too many login attempts from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

export function applySecurity(app: Express) {
  // Helmet con CSP estricta
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'"],
          connectSrc: ["'self'", ...config.corsOrigins],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        }
      }
    })
  )

  // CORS: permitir solo orígenes listados (principio de least privilege)
  const origins = config.corsOrigins.length ? config.corsOrigins : false
  app.use(cors({ 
    origin: origins, 
    credentials: true,
    optionsSuccessStatus: 200 }))

  // Sanitizar inputs (previene XSS en inputs simples)
  app.use(sanitizeInputs)

  // Rate limit global razonable para evitar abuso general
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000
  })
  app.use(globalLimiter)
  
}
