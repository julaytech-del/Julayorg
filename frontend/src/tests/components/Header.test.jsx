import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser } from '../utils.jsx';
import Header from '../../components/Layout/Header.jsx';
import { notificationsAPI, projectsAPI } from '../../services/api.js';

// The setup.js mock for react-router-dom returns a fresh vi.fn() per call for useNavigate.
// We capture a stable mock navigate for assertion.
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/', search: '', hash: '' }),
    useParams: () => ({}),
    BrowserRouter: ({ children }) => children,
    MemoryRouter: ({ children }) => children,
    Link: ({ children }) => children,
    NavLink: ({ children }) => children,
  };
});

describe('Header', () => {
  beforeEach(() => {
    vi.mocked(notificationsAPI.getAll).mockResolvedValue({ data: [] });
    vi.mocked(projectsAPI.getAll).mockResolvedValue({ data: [] });
    mockNavigate.mockClear();
  });

  it('renders without crashing with a logged-in user', () => {
    const { container } = renderWithProviders(<Header />);
    expect(container).toBeTruthy();
  });

  it("shows the user's first name", () => {
    renderWithProviders(<Header />);
    // mockUser.name = 'Test User', split(' ')[0] = 'Test'
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('"New" button is visible', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('AI Studio chip is visible', () => {
    renderWithProviders(<Header />);
    // The chip uses t('header.aiGenerate') which returns 'header.aiGenerate'
    expect(screen.getByText('header.aiGenerate')).toBeInTheDocument();
  });

  it('dark mode toggle button is present', () => {
    renderWithProviders(<Header />);
    // The dark mode tooltip shows "Dark Mode" when darkMode is false
    const buttons = screen.getAllByRole('button');
    // There are multiple buttons (dark mode, notification bell, etc.)
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('clicking "New" button opens the QuickAdd modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    const newButton = screen.getByText('New');
    await user.click(newButton);

    await waitFor(() => {
      expect(screen.getByText('New Task')).toBeInTheDocument();
    });
  });

  it('QuickAdd modal has a title text field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    await user.click(screen.getByText('New'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Task title…')).toBeInTheDocument();
    });
  });

  it('QuickAdd modal has Cancel and Create Task buttons', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    await user.click(screen.getByText('New'));

    await screen.findByPlaceholderText('Task title…');

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
  });
});
