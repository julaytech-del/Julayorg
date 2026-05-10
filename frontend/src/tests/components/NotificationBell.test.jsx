import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils.jsx';
import NotificationBell from '../../components/common/NotificationBell.jsx';
import { notificationsAPI } from '../../services/api.js';

describe('NotificationBell', () => {
  it('renders the bell icon button', () => {
    renderWithProviders(<NotificationBell />);
    // The bell button has a Tooltip with title "Notifications"
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('bell icon button is present in the DOM', () => {
    renderWithProviders(<NotificationBell />);
    // There should be exactly one button (the notification bell)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('clicking the bell opens the notifications popover', async () => {
    vi.mocked(notificationsAPI.getAll).mockResolvedValue({ data: [] });

    const user = userEvent.setup();
    renderWithProviders(<NotificationBell />);

    const button = screen.getByRole('button');
    await user.click(button);

    // After click, the popover should appear with "Notifications" heading
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no notifications', async () => {
    vi.mocked(notificationsAPI.getAll).mockResolvedValue({ data: [] });

    const user = userEvent.setup();
    renderWithProviders(<NotificationBell />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText("You're all caught up! 🎉")).toBeInTheDocument();
    });
  });

  it('shows notification items when notifications exist', async () => {
    vi.mocked(notificationsAPI.getAll).mockResolvedValue({
      data: [
        {
          _id: 'n1',
          type: 'task_assigned',
          title: 'New task assigned',
          body: 'You have a new task',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const user = userEvent.setup();
    renderWithProviders(<NotificationBell />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('New task assigned')).toBeInTheDocument();
    });
  });
});
