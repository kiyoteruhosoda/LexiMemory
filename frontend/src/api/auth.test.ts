// src/api/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from './auth';
import * as client from './client';

vi.mock('./client', () => ({
  api: {
    post: vi.fn(),
    postAuth: vi.fn(),
    getAllow401: vi.fn(),
  },
  tokenManager: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
    getToken: vi.fn(),
    onUnauthorized: vi.fn(),
  },
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('me', () => {
    it('should return user data on success', async () => {
      const mockUser = { userId: '123', username: 'testuser' };
      vi.mocked(client.api.getAllow401).mockResolvedValueOnce(mockUser);

      const result = await authApi.me();
      expect(result).toEqual(mockUser);
      expect(client.api.getAllow401).toHaveBeenCalledWith('/auth/me');
    });

    it('should return null on 401', async () => {
      vi.mocked(client.api.getAllow401).mockResolvedValueOnce(undefined);

      const result = await authApi.me();
      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      const mockResponse = { ok: true, userId: '456', username: 'newuser' };
      vi.mocked(client.api.postAuth).mockResolvedValueOnce(mockResponse);

      const result = await authApi.register('newuser', 'password123');
      expect(result).toEqual(mockResponse);
      expect(client.api.postAuth).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        password: 'password123',
      });
    });
  });

  describe('login', () => {
    it('should login user and store token', async () => {
      const mockResponse = { 
        ok: true, 
        access_token: 'test-token-123',
        token_type: 'Bearer',
        expires_in: 900
      };
      vi.mocked(client.api.postAuth).mockResolvedValueOnce(mockResponse);

      const result = await authApi.login('existinguser', 'pass');
      expect(result).toEqual(mockResponse);
      expect(client.api.postAuth).toHaveBeenCalledWith('/auth/login', {
        username: 'existinguser',
        password: 'pass',
      });
      expect(client.tokenManager.setToken).toHaveBeenCalledWith('test-token-123');
    });
  });

  describe('logout', () => {
    it('should logout user and clear token', async () => {
      vi.mocked(client.api.post).mockResolvedValueOnce({ ok: true });

      await authApi.logout();
      expect(client.api.post).toHaveBeenCalledWith('/auth/logout');
      expect(client.tokenManager.clearToken).toHaveBeenCalled();
    });
  });
});
