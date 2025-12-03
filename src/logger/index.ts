import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logDirectory = path.join(process.cwd(), 'logs');

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
};

const formatter = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
  new DailyRotateFile({
    dirname: logDirectory,
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: process.env.LOG_LEVEL || 'info',
    format: formatter,
  }),
  new DailyRotateFile({
    dirname: logDirectory,
    filename: 'errors-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: formatter,
  }),
];

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  transports,
  exitOnError: false,
});

export default logger;

// Helper typed wrappers
export function logInfo(message: string, meta?: Record<string, any>) {
  logger.info(message, sanitizeMeta(meta));
}

export function logWarn(message: string, meta?: Record<string, any>) {
  logger.warn(message, sanitizeMeta(meta));
}

export function logError(message: string, meta?: Record<string, any>) {
  logger.error(message, sanitizeMeta(meta));
}

function sanitizeMeta(meta?: Record<string, any>) {
  if (!meta) return undefined;
  const copy = { ...meta } as Record<string, any>;
  ['password', 'pass', 'pwd', 'token', 'accessToken', 'refreshToken'].forEach((k) => {
    if (k in copy) copy[k] = '[REDACTED]';
  });
  return copy;
}