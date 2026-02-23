// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB
class IDBRequestMock {
  result: unknown = null;
  error: Error | null = null;
  onsuccess: ((event: { target: IDBRequestMock }) => void) | null = null;
  onerror: ((event: { target: IDBRequestMock }) => void) | null = null;
  
  _succeed(result: unknown) {
    this.result = result;
    if (this.onsuccess) {
      this.onsuccess({ target: this });
    }
  }
  
  _fail(error: Error) {
    this.error = error;
    if (this.onerror) {
      this.onerror({ target: this });
    }
  }
}

class IDBTransactionMock {
  objectStore = vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue(new IDBRequestMock()),
    put: vi.fn().mockReturnValue(new IDBRequestMock()),
    delete: vi.fn().mockReturnValue(new IDBRequestMock()),
    clear: vi.fn().mockReturnValue(new IDBRequestMock()),
  });
  onerror: ((event: { target: IDBTransactionMock }) => void) | null = null;
  oncomplete: ((event: { target: IDBTransactionMock }) => void) | null = null;
  error: Error | null = null;
}

class IDBDatabaseMock {
  name = 'LinguisticNodeDB';
  version = 1;
  objectStoreNames = {
    contains: vi.fn().mockReturnValue(false),
  };
  
  transaction = vi.fn().mockReturnValue(new IDBTransactionMock());
  createObjectStore = vi.fn();
  close = vi.fn();
}

class IDBOpenDBRequestMock extends IDBRequestMock {
  onupgradeneeded: ((event: { target: IDBOpenDBRequestMock }) => void) | null = null;
  onblocked: ((event: { target: IDBOpenDBRequestMock }) => void) | null = null;
}

const indexedDBMock = {
  open: vi.fn().mockImplementation(() => {
    const request = new IDBOpenDBRequestMock();
    setTimeout(() => {
      // Set result before calling onupgradeneeded
      const db = new IDBDatabaseMock();
      request.result = db;
      
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: request });
      }
      request._succeed(db);
    }, 0);
    return request;
  }),
};

(global as unknown as { indexedDB: typeof indexedDBMock }).indexedDB = indexedDBMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock File.prototype.text() for file reading in tests
if (typeof File !== 'undefined' && !File.prototype.text) {
  File.prototype.text = function() {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(this);
    });
  };
}

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
