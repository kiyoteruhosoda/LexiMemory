// frontend/src/auth/AuthContext.test.tsx

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../auth/AuthContext';
import { authApi } from '../../api/auth';
import { tokenManager } from '../../api/client';

vi.mock('../../api/auth', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));
vi.mock('../../api/client', () => ({
  tokenManager: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
    onUnauthorized: vi.fn(),
  },
}));

// Test component that uses the auth context
function TestComponent() {
  const { state, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="status">{state.status}</div>
      {state.status === 'authed' && (
        <div data-testid="username">{state.me.username}</div>
      )}
      <button onClick={() => login('testuser', 'testpass')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading status', () => {
    vi.mocked(authApi.me).mockResolvedValue({
      userId: '1',
      username: 'testuser',
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('loading');
  });

  it('should login successfully', async () => {
    const mockLoginResponse = {
      ok: true,
      access_token: 'mock-token',
      token_type: 'Bearer',
      expires_in: 900,
    };
    const mockUser = {
      userId: '1',
      username: 'testuser',
    };

    vi.mocked(authApi.me).mockResolvedValue(null as any);
    vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse);
    vi.mocked(authApi.me).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });

    screen.getByText('Login').click();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authed');
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });

    expect(tokenManager.setToken).toHaveBeenCalledWith('mock-token');
  });

  it('should logout successfully', async () => {
    const mockUser = {
      userId: '1',
      username: 'testuser',
    };

    vi.mocked(authApi.me).mockResolvedValue(mockUser);
    vi.mocked(authApi.logout).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authed');
    });

    screen.getByText('Logout').click();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });

    expect(tokenManager.clearToken).toHaveBeenCalled();
  });

  it('should handle login failure', async () => {
    vi.mocked(authApi.me).mockResolvedValue(null as any);
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });

    screen.getByText('Login').click();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });
  });
});
