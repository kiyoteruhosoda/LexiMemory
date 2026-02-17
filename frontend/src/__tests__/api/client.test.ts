// src/api/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from '../../api/client';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('ApiError', () => {
    it('should create error with status and message', () => {
      const error = new ApiError(404, 'Not found');
      expect(error.status).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.errorCode).toBeUndefined();
    });

    it('should include error code and request ID', () => {
      const error = new ApiError(400, 'Bad request', 'VALIDATION_ERROR', 'req-123');
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.requestId).toBe('req-123');
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { ok: true, data: 'test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await api.get('/test');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('should throw ApiError on failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            error_code: 'NOT_FOUND',
            message: 'Resource not found',
            request_id: 'req-456',
          },
        }),
      });

      try {
        await api.get('/missing');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Resource not found');
        expect((error as ApiError).status).toBe(404);
        expect((error as ApiError).errorCode).toBe('NOT_FOUND');
      }
    });
  });

  describe('POST requests', () => {
    it('should make POST request with body', async () => {
      const requestBody = { username: 'test', password: 'pass' };
      const mockResponse = { ok: true, userId: '123' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await api.post('/auth/login', requestBody);
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          credentials: 'include',
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('should make PUT request', async () => {
      const mockResponse = { ok: true };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await api.put('/words/123', { headword: 'updated' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      const mockResponse = { ok: true };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await api.del('/words/123');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAllow401', () => {
    it('should return undefined on 401', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await api.getAllow401('/auth/me');
      expect(result).toBeUndefined();
    });

    it('should return data on success', async () => {
      const mockData = { userId: '123', username: 'test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await api.getAllow401('/auth/me');
      expect(result).toEqual(mockData);
    });
  });

  describe('204 No Content', () => {
    it('should return undefined for 204 responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await api.del('/resource/123');
      expect(result).toBeUndefined();
    });
  });
});
