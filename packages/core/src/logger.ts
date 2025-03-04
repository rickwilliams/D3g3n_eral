/**
 * Logger Utility
 * 
 * This module provides a centralized logging system for the application.
 * It supports different log levels and can be configured to output logs
 * to different destinations (console, file, etc.).
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /** Minimum log level to display (default: INFO in production, DEBUG in development) */
  minLevel?: LogLevel;
  /** Whether to include timestamps in logs (default: true) */
  timestamps?: boolean;
  /** Whether to include log level in logs (default: true) */
  showLevel?: boolean;
}

/**
 * Logger class for centralized logging
 */
class Logger {
  private minLevel: LogLevel;
  private timestamps: boolean;
  private showLevel: boolean;

  /**
   * Create a new Logger instance
   * @param options Logger configuration options
   */
  constructor(options: LoggerOptions = {}) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    this.minLevel = options.minLevel ?? (isProduction ? LogLevel.INFO : LogLevel.DEBUG);
    this.timestamps = options.timestamps ?? true;
    this.showLevel = options.showLevel ?? true;
  }

  /**
   * Format a log message
   * @param level Log level
   * @param message Log message
   * @returns Formatted log message
   */
  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];
    
    if (this.timestamps) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    if (this.showLevel) {
      parts.push(`[${LogLevel[level]}]`);
    }
    
    parts.push(message);
    
    return parts.join(' ');
  }

  /**
   * Log a message at the specified level
   * @param level Log level
   * @param message Log message
   * @param args Additional arguments to log
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.minLevel) {
      return;
    }
    
    const formattedMessage = this.formatMessage(level, message);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, ...args);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, ...args);
        break;
    }
  }

  /**
   * Log a debug message
   * @param message Log message
   * @param args Additional arguments to log
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Log an info message
   * @param message Log message
   * @param args Additional arguments to log
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log a warning message
   * @param message Log message
   * @param args Additional arguments to log
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log an error message
   * @param message Log message
   * @param args Additional arguments to log
   */
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Set the minimum log level
   * @param level Minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

// Export a singleton instance
export const logger = new Logger();
