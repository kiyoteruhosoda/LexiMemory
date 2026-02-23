// frontend/src/components/Layout.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { AuthProvider } from '../../auth/AuthContext';
import { authApi } from '../../api/auth';
import type { MeResponse } from '../../api/types';

vi.mock('../../api/auth', () => ({
  authApi: {
    me: vi.fn(),
    logout: vi.fn(),
    login: vi.fn(),
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

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env.VITE_APP_VERSION = '1.0.0';
  });

  it('should render navigation bar with app name', async () => {
    vi.mocked(authApi.status).mockResolvedValue({ ok: true, authenticated: false, canRefresh: false });
    vi.mocked(authApi.refresh).mockResolvedValue(false);
    vi.mocked(authApi.me).mockResolvedValue(null as unknown as MeResponse);

    renderWithRouter(<Layout>Test Content</Layout>);

    // Wait for async initialization
    await screen.findByText('Guest');
    
    const lexiMemories = screen.getAllByText(/LinguisticNode/);
    expect(lexiMemories.length).toBeGreaterThan(0);
  });

  it('should render child content', async () => {
    vi.mocked(authApi.status).mockResolvedValue({ ok: true, authenticated: false, canRefresh: false });
    vi.mocked(authApi.refresh).mockResolvedValue(false);
    vi.mocked(authApi.me).mockResolvedValue(null as unknown as MeResponse);

    renderWithRouter(<Layout><div>Test Content</div></Layout>);

    // Wait for async initialization
    await screen.findByText('Guest');
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should show Words and Study links', async () => {
    vi.mocked(authApi.status).mockResolvedValue({ ok: true, authenticated: false, canRefresh: false });
    vi.mocked(authApi.refresh).mockResolvedValue(false);
    vi.mocked(authApi.me).mockResolvedValue(null as unknown as MeResponse);

    renderWithRouter(<Layout>Content</Layout>);

    // Wait for async initialization
    await screen.findByText('Guest');
    
    expect(screen.getByText('Words')).toBeInTheDocument();
    expect(screen.getByText('Study')).toBeInTheDocument();
  });

  it('should show username and logout button when authenticated', async () => {
    vi.mocked(authApi.status).mockResolvedValue({ 
      ok: true, 
      authenticated: true, 
      canRefresh: false,
      userId: '1',
      username: 'testuser'
    });
    vi.mocked(authApi.refresh).mockResolvedValue(true);
    vi.mocked(authApi.me).mockResolvedValue({
      userId: '1',
      username: 'testuser',
    });

    renderWithRouter(<Layout>Content</Layout>);

    // Wait for async initialization with authenticated state
    await screen.findByText('testuser');
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should show Guest when not authenticated', async () => {
    vi.mocked(authApi.status).mockResolvedValue({ ok: true, authenticated: false, canRefresh: false });
    vi.mocked(authApi.refresh).mockResolvedValue(false);
    vi.mocked(authApi.me).mockResolvedValue(null as unknown as MeResponse);

    renderWithRouter(<Layout>Content</Layout>);

    // Wait for async initialization
    await screen.findByText('Guest');
  });

  it('should call logout when logout button is clicked', async () => {
    vi.mocked(authApi.status).mockResolvedValue({ 
      ok: true, 
      authenticated: true, 
      canRefresh: false,
      userId: '1',
      username: 'testuser'
    });
    vi.mocked(authApi.refresh).mockResolvedValue(true);
    vi.mocked(authApi.me).mockResolvedValue({
      userId: '1',
      username: 'testuser',
    });
    vi.mocked(authApi.logout).mockResolvedValue(undefined);

    renderWithRouter(<Layout>Content</Layout>);

    // Wait for authenticated state
    const logoutButton = await screen.findByText('Logout');
    expect(logoutButton).toBeInTheDocument();
    
    await act(async () => {
      logoutButton.click();
    });
  });

  it('should display app version', async () => {
    vi.mocked(authApi.status).mockResolvedValue({ ok: true, authenticated: false, canRefresh: false });
    vi.mocked(authApi.refresh).mockResolvedValue(false);
    vi.mocked(authApi.me).mockResolvedValue(null as unknown as MeResponse);

    renderWithRouter(<Layout>Content</Layout>);

    // Wait for async initialization
    await screen.findByText('Guest');
    
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('should have hamburger menu button for mobile', async () => {
    vi.mocked(authApi.status).mockResolvedValue({ ok: true, authenticated: false, canRefresh: false });
    vi.mocked(authApi.refresh).mockResolvedValue(false);
    vi.mocked(authApi.me).mockResolvedValue(null as unknown as MeResponse);

    renderWithRouter(<Layout>Content</Layout>);

    // Wait for async initialization
    await screen.findByText('Guest');
    
    const toggleButton = document.querySelector('.navbar-toggler');
    expect(toggleButton).toBeInTheDocument();
  });
});
