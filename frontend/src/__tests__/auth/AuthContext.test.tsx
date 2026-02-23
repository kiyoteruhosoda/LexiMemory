// frontend/src/auth/AuthContext.test.tsx

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider } from '../../auth/AuthContext';
import { useAuth } from '../../auth/useAuth';
import { authApi } from '../../api/auth';
import type { MeResponse } from '../../api/types';

vi.mock('../../api/auth', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    status: vi.fn(),
  },
}));
vi.mock('../../api/client', () => ({
  tokenManager: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
    onUnauthorized: vi.fn(),
  },
}));
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    setUserId: vi.fn(),
  },
}));

// Test component that uses the auth context
function TestComponent() {
  const { state, login, logout } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  
  return (
    <div>
      <div data-testid="status">{state.status}</div>
      {state.status === 'authed' && (
        <div data-testid="username">{state.me.username}</div>
      )}
      {loginError && <div data-testid="error">{loginError}</div>}
      <button onClick={async () => {
        try {
          await login('testuser', 'testpass');
        } catch (e) {
          setLoginError((e as Error).message);
        }
      }}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with guest status when no session', async () => {
    vi.mocked(authApi.status).mockResolvedValue({ ok: true, authenticated: false, canRefresh: false });
    vi.mocked(authApi.refresh).mockResolvedValue(false);
    vi.mocked(authApi.me).mockResolvedValue(null as unknown as MeResponse);

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });
  });

  it('should login successfully', async () => {
    const mockUser = {
      userId: '1',
      username: 'testuser',
    };

    // Setup initial state: no session
    vi.mocked(authApi.status).mockResolvedValue({ ok: true, authenticated: false, canRefresh: false });
    vi.mocked(authApi.refresh).mockResolvedValue(false);
    // me() always returns mockUser (after login in refresh())
    vi.mocked(authApi.me).mockResolvedValue(mockUser);
    vi.mocked(authApi.login).mockResolvedValue({
      ok: true,
      access_token: 'mock-token',
      token_type: 'Bearer',
      expires_in: 900,
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Wait for initialization to reach guest state
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });

    // Now click login
    screen.getByText('Login').click();

    // Wait for login and refresh to complete (me() now returns mockUser)
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authed');
    }, { timeout: 1000 });
  });

  it('should logout successfully', async () => {
    const mockUser = {
      userId: '1',
      username: 'testuser',
    };

    // Setup: start with authenticated state
    vi.mocked(authApi.status).mockResolvedValue({ 
      ok: true, 
      authenticated: true, 
      canRefresh: false,
      userId: '1',
      username: 'testuser'
    });
    vi.mocked(authApi.refresh).mockResolvedValue(true);
    // First call to me() returns user (authenticated)
    // After logout, subsequent calls return null
    vi.mocked(authApi.me)
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValue(null as unknown as MeResponse);
    vi.mocked(authApi.logout).mockResolvedValue(undefined);

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Wait for initialization with authenticated state
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authed');
    });

    // Now click logout
    screen.getByText('Logout').click();

    // Wait for logout to complete (me() now returns null)
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    }, { timeout: 1000 });
  });

  it('should handle login failure', async () => {
    // Suppress error output for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(authApi.status).mockResolvedValue({ ok: true, authenticated: false, canRefresh: false });
    vi.mocked(authApi.me).mockResolvedValue(null as unknown as MeResponse);
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });

    screen.getByText('Login').click();

    // Wait a bit for error to be handled
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(screen.getByTestId('status')).toHaveTextContent('guest');
    consoleSpy.mockRestore();
  });
});
