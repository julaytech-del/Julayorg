import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser } from '../utils.jsx';
import { dashboardAPI, myTasksAPI } from '../../services/api.js';

// Mock recharts — jsdom has no SVG layout engine, ResponsiveContainer size is 0x0
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
}));

// Mock OnboardingWizard to avoid its complex API calls during Dashboard tests
vi.mock('../../components/common/OnboardingWizard.jsx', () => ({
  default: () => null,
}));

// Import Dashboard after mocks are set up
import Dashboard from '../../pages/Dashboard.jsx';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(dashboardAPI.getStats).mockResolvedValue({ data: null });
    vi.mocked(myTasksAPI.getTasks).mockResolvedValue({ data: [] });
  });

  it('renders without crashing with a logged-in user', async () => {
    const { container } = renderWithProviders(<Dashboard />);
    expect(container).toBeTruthy();
    // Wait for async effects to settle
    await waitFor(() => {
      expect(container.firstChild).toBeTruthy();
    });
  });

  it('shows greeting with the user first name', async () => {
    renderWithProviders(<Dashboard />);
    // The greeting includes user?.name?.split(' ')[0] = 'Test' from mockUser.name = 'Test User'
    await waitFor(() => {
      // Greeting text + name appear in the welcome banner
      expect(screen.getByText(/Test/)).toBeInTheDocument();
    });
  });

  it('shows "My Work" section heading', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('My Work')).toBeInTheDocument();
    });
  });

  it('shows "All caught up!" when there are no pending tasks', async () => {
    vi.mocked(myTasksAPI.getTasks).mockResolvedValue({ data: [] });
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      // myTasksAPI.getTasks returns [] so pendingTasks is empty => "All caught up! 🎉"
      expect(screen.getByText('All caught up! 🎉')).toBeInTheDocument();
    });
  });

  it('shows task cards when myTasksAPI returns pending tasks', async () => {
    vi.mocked(myTasksAPI.getTasks).mockResolvedValue({
      data: [
        {
          _id: 'task1',
          title: 'Fix login bug',
          status: 'in_progress',
          priority: 'high',
          project: { name: 'Test Project' },
          dueDate: null,
        },
      ],
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Fix login bug')).toBeInTheDocument();
    });
  });

  it('renders the KPI stat card section (even when stats is null)', async () => {
    vi.mocked(dashboardAPI.getStats).mockResolvedValue({ data: null });
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      // Stat card titles use t() which returns the key
      expect(screen.getByText('dashboard.stats.totalProjects')).toBeInTheDocument();
      expect(screen.getByText('dashboard.stats.activeTasks')).toBeInTheDocument();
    });
  });
});
