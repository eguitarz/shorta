/**
 * Structured logging utility
 * Provides consistent logging with proper levels, context, and formatting
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Structured logger class
 */
class Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    // In production, only log warnings and errors by default
    // In development, log everything
    this.minLevel = process.env.NODE_ENV === 'production'
      ? LogLevel.WARN
      : minLevel;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    // In development, use pretty format
    if (process.env.NODE_ENV === 'development') {
      const parts = [
        `[${entry.timestamp}]`,
        `[${entry.level.toUpperCase()}]`,
        entry.message,
      ];

      if (entry.context) {
        parts.push(`\n  Context: ${JSON.stringify(entry.context, null, 2)}`);
      }

      if (entry.error) {
        parts.push(`\n  Error: ${entry.error.message}`);
        if (entry.error.stack) {
          parts.push(`\n  Stack: ${entry.error.stack}`);
        }
      }

      return parts.join(' ');
    }

    // In production, use JSON format (easier to parse by log aggregators)
    return JSON.stringify(entry);
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }

    return entry;
  }

  /**
   * Write log to output
   */
  private write(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.write(entry);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.write(entry);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.write(entry);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.write(entry);
  }

  /**
   * Create a child logger with additional context
   */
  child(childContext: LogContext): Logger {
    const childLogger = new Logger(this.minLevel);

    // Wrap methods to include child context
    const originalDebug = childLogger.debug.bind(childLogger);
    const originalInfo = childLogger.info.bind(childLogger);
    const originalWarn = childLogger.warn.bind(childLogger);
    const originalError = childLogger.error.bind(childLogger);

    childLogger.debug = (message: string, context?: LogContext) => {
      originalDebug(message, { ...childContext, ...context });
    };

    childLogger.info = (message: string, context?: LogContext) => {
      originalInfo(message, { ...childContext, ...context });
    };

    childLogger.warn = (message: string, context?: LogContext) => {
      originalWarn(message, { ...childContext, ...context });
    };

    childLogger.error = (message: string, error?: Error, context?: LogContext) => {
      originalError(message, error, { ...childContext, ...context });
    };

    return childLogger;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger for a specific module
 */
export function createLogger(module: string): Logger {
  return logger.child({ module });
}

/**
 * Security event logger
 * Logs security-related events for monitoring and alerting
 */
export const securityLogger = logger.child({ category: 'security' });

/**
 * Log security events
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: LogContext
): void {
  const level = severity === 'critical' || severity === 'high'
    ? LogLevel.ERROR
    : severity === 'medium'
    ? LogLevel.WARN
    : LogLevel.INFO;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: `Security Event: ${event}`,
    context: {
      event,
      severity,
      ...details,
    },
  };

  securityLogger.info(`Security Event: ${event}`, {
    severity,
    ...details,
  });

  // In production, you might want to send this to a security monitoring service
  // Example: sendToSecurityMonitoring(entry);
}

/**
 * Example usage:
 *
 * import { logger, createLogger, logSecurityEvent } from '@/lib/logger';
 *
 * // Basic logging
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Database connection failed', error, { database: 'postgres' });
 *
 * // Module-specific logger
 * const apiLogger = createLogger('api');
 * apiLogger.info('Request received', { method: 'POST', path: '/api/chat' });
 *
 * // Security events
 * logSecurityEvent('failed_login', 'medium', {
 *   userId: '123',
 *   ipAddress: '192.168.1.1',
 *   attempts: 3,
 * });
 */
