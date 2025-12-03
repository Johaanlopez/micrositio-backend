import { createLogger, format, transports } from 'winston'
import path from 'path'

const logDir = path.resolve(process.cwd(), 'logs')

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({ format: format.combine(format.colorize(), format.simple()) }),
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logDir, 'combined.log') })
  ],
  exitOnError: false
})

export default logger
