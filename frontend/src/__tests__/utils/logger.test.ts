// src/utils/logger.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    global.navigator = {
      sendBeacon: vi.fn(() => true),
    } as any;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should log info messages', () => {
    logger.info('Test message');
    
    expect(console.info).toHaveBeenCalledWith(
      '[INFO]',
      'Test message',
      ''
    );
  });

  it('should include extra data in log', () => {
    const extra = { requestId: '123' };
    
    logger.warn('Warning message', extra);
    
    expect(console.warn).toHaveBeenCalledWith(
      '[WARN]',
      'Warning message',
      extra
    );
  });

  it('should set user ID', () => {
    logger.setUserId('user-456');
    logger.info('User action');
    
    // User ID is internal state, verify it doesn't throw
    expect(console.info).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    logger.error('Error msg');
    
    expect(console.error).toHaveBeenCalledWith('[ERROR]', 'Error msg', '');
  });

  it('should log debug messages', () => {
    logger.debug('Debug msg');
    
    // debug uses console.log
    expect(console.log).toHaveBeenCalledWith('[DEBUG]', 'Debug msg', '');
  });
});
