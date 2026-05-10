import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../utils.jsx';
import Login from '../../../pages/Auth/Login.jsx';
import { authAPI } from '../../../services/api.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/login', search: '', hash: '' }),
    useParams: () => ({}),
    BrowserRouter: ({ children }) => children,
    MemoryRouter: ({ children }) => children,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    NavLink: ({ children }) => children,
  };
});

describe('Login page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.mocked(authAPI.login).mockResolvedValue({
      data: { token: 'test-token', user: { _id: 'u1', name: 'Test User', email: 'test@test.com' } },
    });
  });

  it('renders email and password fields', () => {
    renderWithProviders(<Login />, { preloadedState: { auth: { user: null, token: null, loading: false, error: null, initialized: true } } });
    // The label uses t('auth.login.email') -> 'auth.login.email'
    expect(screen.getByLabelText(/auth\.login\.email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.login\.password/i)).toBeInTheDocument();
  });

  it('submit button is present', () => {
    renderWithProviders(<Login />, { preloadedState: { auth: { user: null, token: null, loading: false, error: null, initialized: true } } });
    // The submit button text is t('auth.login.submit')
    expect(screen.getByRole('button', { name: /auth\.login\.submit/i })).toBeInTheDocument();
  });

  it('shows error alert when auth.error is set in store', () => {
    renderWithProviders(<Login />, {
      preloadedState: {
        auth: { user: null, token: null, loading: false, error: 'Invalid credentials', initialized: true },
      },
    });
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('submitting the form calls loginUser and navigates on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, {
      preloadedState: { auth: { user: null, token: null, loading: false, error: null, initialized: true } },
    });

    await user.type(screen.getByLabelText(/auth\.login\.email/i), 'user@test.com');
    await user.type(screen.getByLabelText(/auth\.login\.password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }));

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
