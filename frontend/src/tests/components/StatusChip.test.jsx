import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StatusChip from '../../components/common/StatusChip.jsx';

const theme = createTheme();

function renderChip(props) {
  return render(
    <ThemeProvider theme={theme}>
      <StatusChip {...props} />
    </ThemeProvider>
  );
}

describe('StatusChip', () => {
  // The mock t() returns the key. StatusChip calls:
  //   t(`task.status.${status}`, { defaultValue: t(`projects.filters.${status}`, ...) })
  // Since our mock always returns the key itself, we get 'task.status.<status>'

  it('renders for planned status', () => {
    renderChip({ status: 'planned' });
    expect(screen.getByText('task.status.planned')).toBeInTheDocument();
  });

  it('renders for in_progress status', () => {
    renderChip({ status: 'in_progress' });
    expect(screen.getByText('task.status.in_progress')).toBeInTheDocument();
  });

  it('renders for blocked status', () => {
    renderChip({ status: 'blocked' });
    expect(screen.getByText('task.status.blocked')).toBeInTheDocument();
  });

  it('renders for review status', () => {
    renderChip({ status: 'review' });
    expect(screen.getByText('task.status.review')).toBeInTheDocument();
  });

  it('renders for done status', () => {
    renderChip({ status: 'done' });
    expect(screen.getByText('task.status.done')).toBeInTheDocument();
  });

  it('renders a chip element in the DOM', () => {
    renderChip({ status: 'planned' });
    expect(document.querySelector('[class*="MuiChip"]')).toBeTruthy();
  });
});
