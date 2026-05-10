import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const theme = createTheme();

function renderSpinner(props) {
  return render(
    <ThemeProvider theme={theme}>
      <LoadingSpinner {...props} />
    </ThemeProvider>
  );
}

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    const { container } = renderSpinner();
    expect(container).toBeTruthy();
  });

  it('shows a CircularProgress spinner in the DOM', () => {
    renderSpinner();
    // MUI CircularProgress renders with role="progressbar"
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the default loading message', () => {
    renderSpinner();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows a custom message when provided', () => {
    renderSpinner({ message: 'Fetching data...' });
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('renders in fullPage mode without crashing', () => {
    renderSpinner({ fullPage: true });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not show message when message prop is empty string', () => {
    renderSpinner({ message: '' });
    // progressbar should still render
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
