import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, json } = winston.format;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  let logMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
  
  // Add metadata if present
  if (Object.keys(meta).length > 0) {
    logMessage += `\n${JSON.stringify(meta, null, 2)}`;
  }
  
  return logMessage;
});

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Create console transport for development
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

// Create file transport for all logs
const allLogsTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'debug',
  format: combine(
    timestamp(),
    json()
  )
});

// Create error log transport
const errorLogsTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: combine(
    timestamp(),
    json()
  )
});

// Create HTTP request log transport
const httpLogsTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'http',
  format: combine(
    timestamp(),
    json()
  )
});

// Create the logger instance
const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ecommerce-api' },
  transports: [
    consoleTransport,
    allLogsTransport,
    errorLogsTransport,
    httpLogsTransport
  ],
  exitOnError: false
});

// Add request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const referrer = headers.referer || headers.referrer || '';
    
    logger.http('Request', {
      method,
      url: originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent,
      referrer,
      userId: req.user?._id || 'anonymous',
      requestId: req.id || 'unknown'
    });
  });
  
  next();
};

// Add error logging middleware
export const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      ...(err.code && { code: err.code }),
      ...(err.statusCode && { statusCode: err.statusCode })
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: {
        'user-agent': req.headers['user-agent'],
        referer: req.headers.referer || req.headers.referrer,
        'x-forwarded-for': req.headers['x-forwarded-for']
      },
      params: req.params,
      query: req.query,
      body: process.env.NODE_ENV === 'development' ? req.body : {},
      ip: req.ip
    },
    user: req.user ? { id: req.user._id, email: req.user.email } : 'anonymous',
    timestamp: new Date().toISOString()
  });

  next(err);
};

// Add unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { 
    promise, 
    reason: reason instanceof Error ? {
      message: reason.message,
      stack: reason.stack,
      name: reason.name,
      ...(reason.code && { code: reason.code })
    } : reason
  });
});

// Add uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...(error.code && { code: error.code })
  });
  
  // In production, you might want to restart the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

export default logger;
