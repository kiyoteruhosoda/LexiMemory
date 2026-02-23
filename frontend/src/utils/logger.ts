// src/utils/logger.ts
/**
 * Frontend logging system
 * Logs can be sent to backend for centralized monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private userId: string | null = null;
  private sendToServer: boolean;
  private buffer: LogEntry[] = [];
  private flushInterval: number = 10000; // 10 seconds
  private maxBufferSize: number = 50;

  constructor() {
    this.sendToServer = import.meta.env.PROD; // Only send in production
    if (this.sendToServer) {
      this.startPeriodicFlush();
    }
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.userId || undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry = this.createEntry(level, message, context);

    // Console output (always)
    const consoleMethod = level === 'debug' ? 'log' : level;
    console[consoleMethod](`[${level.toUpperCase()}]`, message, context || '');

    // Buffer for server
    if (this.sendToServer) {
      this.buffer.push(entry);
      if (this.buffer.length >= this.maxBufferSize) {
        this.flush();
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }

  /**
   * Send buffered logs to server
   */
  async flush() {
    if (this.buffer.length === 0) return;

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      await fetch('/api/logs/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToSend }),
        credentials: 'include',
      });
    } catch (err) {
      // Don't spam console if backend is down
      console.warn('Failed to send logs to server:', err);
    }
  }

  private startPeriodicFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      // Use sendBeacon for reliability on page unload
      if (this.buffer.length > 0) {
        const blob = new Blob([JSON.stringify({ logs: this.buffer })], {
          type: 'application/json',
        });
        navigator.sendBeacon('/api/logs/client', blob);
        this.buffer = [];
      }
    });
  }
}

export const logger = new Logger();
