import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../utils.jsx';
import SnackbarAlert from '../../components/common/SnackbarAlert.jsx';

describe('SnackbarAlert', () => {
  it('does not render message content when snackbar is closed', () => {
    renderWithProviders(<SnackbarAlert />, {
      preloadedState: {
        ui: {
          darkMode: false,
          sidebarOpen: true,
          snackbar: { open: false, message: 'Hidden message', severity: 'success' },
          modals: {},
        },
      },
    });
    // When closed, MUI Snackbar hides its content from the accessibility tree
    expect(screen.queryByText('Hidden message')).not.toBeInTheDocument();
  });

  it('renders message when snackbar is open', () => {
    renderWithProviders(<SnackbarAlert />, {
      preloadedState: {
        ui: {
          darkMode: false,
          sidebarOpen: true,
          snackbar: { open: true, message: 'Task created successfully', severity: 'success' },
          modals: {},
        },
      },
    });
    expect(screen.getByText('Task created successfully')).toBeInTheDocument();
  });

  it('renders with success severity when open', () => {
    renderWithProviders(<SnackbarAlert />, {
      preloadedState: {
        ui: {
          darkMode: false,
          sidebarOpen: true,
          snackbar: { open: true, message: 'Done!', severity: 'success' },
          modals: {},
        },
      },
    });
    expect(screen.getByText('Done!')).toBeInTheDocument();
    // MUI Alert with severity="success" renders a role="alert"
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders with error severity when open', () => {
    renderWithProviders(<SnackbarAlert />, {
      preloadedState: {
        ui: {
          darkMode: false,
          sidebarOpen: true,
          snackbar: { open: true, message: 'Something went wrong', severity: 'error' },
          modals: {},
        },
      },
    });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
