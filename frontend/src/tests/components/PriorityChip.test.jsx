import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PriorityChip from '../../components/common/PriorityChip.jsx';

const theme = createTheme();

function renderChip(props) {
  return render(
    <ThemeProvider theme={theme}>
      <PriorityChip {...props} />
    </ThemeProvider>
  );
}

describe('PriorityChip', () => {
  it('renders without crashing with no props', () => {
    // No priority — falls back to medium config
    renderChip({});
    // Should render a chip element
    expect(document.querySelector('[class*="MuiChip"]')).toBeTruthy();
  });

  it('renders for critical priority', () => {
    renderChip({ priority: 'critical' });
    // useTranslation returns key as-is: t('task.priority.critical') = 'task.priority.critical'
    expect(screen.getByText('task.priority.critical')).toBeInTheDocument();
  });

  it('renders for high priority', () => {
    renderChip({ priority: 'high' });
    expect(screen.getByText('task.priority.high')).toBeInTheDocument();
  });

  it('renders for medium priority', () => {
    renderChip({ priority: 'medium' });
    expect(screen.getByText('task.priority.medium')).toBeInTheDocument();
  });

  it('renders for low priority', () => {
    renderChip({ priority: 'low' });
    expect(screen.getByText('task.priority.low')).toBeInTheDocument();
  });
});
