import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, makeStore } from '../utils.jsx';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null, XAxis: () => null, YAxis: () => null,
  Tooltip: () => null, Cell: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

vi.mock('react-router-dom', async () => {
  const real = await vi.importActual('react-router-dom');
  return { ...real, Navigate: ({ to }) => <div data-testid="navigate" data-to={to} /> };
});

vi.mock('../../services/api.js', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../../services/api.js';
import OwnerAdminPanel from '../../pages/OwnerAdmin/OwnerAdminPanel.jsx';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const OWNER_EMAIL = 'assimohammad489@gmail.com';

const ownerState = {
  auth: {
    user: { _id: 'owner1', name: 'Owner', email: OWNER_EMAIL, role: { name: 'Admin' }, organization: { _id: 'o1', name: 'Julay', subscription: { plan: 'enterprise' } } },
    token: 'owner-token',
    loading: false,
    error: null,
    initialized: true,
  },
};

const mockStats = {
  totalOrgs: 12, totalUsers: 47, paidOrgs: 5, freeOrgs: 7,
  mrr: 580, planBreakdown: [{ _id: 'free', count: 7 }, { _id: 'starter', count: 3 }, { _id: 'professional', count: 2 }],
  recentSignups: [{ _id: 'rs1', name: 'Acme Inc', createdAt: new Date().toISOString(), 'subscription.plan': 'starter' }],
  conversionRate: 42,
};

const mockOrgs = [
  { _id: 'org1', name: 'Acme Inc', industry: 'Tech', subscription: { plan: 'starter' }, createdAt: new Date().toISOString(), memberCount: 5, projectCount: 3 },
  { _id: 'org2', name: 'Beta Corp', industry: 'Finance', subscription: { plan: 'free' }, createdAt: new Date().toISOString(), memberCount: 2, projectCount: 1 },
];

const mockUsers = [
  { _id: 'u1', name: 'Alice Smith', email: 'alice@acme.com', createdAt: new Date().toISOString(), twoFactor: { enabled: true }, organization: { name: 'Acme Inc', subscription: { plan: 'starter' } } },
  { _id: 'u2', name: 'Bob Jones', email: 'bob@beta.com', createdAt: new Date().toISOString(), twoFactor: { enabled: false }, organization: { name: 'Beta Corp', subscription: { plan: 'free' } } },
];

const mockSettings = {
  maintenanceMode: false, maintenanceMessage: '', allowNewSignups: true, allowGoogleAuth: true,
  featureFlags: { aiEnabled: true, automationsEnabled: true, reportsEnabled: true, portfoliosEnabled: true, webhooksEnabled: true, ganttEnabled: true, sprintsEnabled: true, timeTrackingEnabled: true, calendarEnabled: true },
  contactEmail: 'support@julay.org', supportUrl: '', termsUrl: '', privacyUrl: '',
};

const mockPlans = {
  free:         { price: 0,   maxMembers: 5,   maxProjects: 3,   maxStorage: 1,  aiCredits: 0,   automations: false, reports: false },
  starter:      { price: 19,  maxMembers: 10,  maxProjects: 10,  maxStorage: 5,  aiCredits: 100, automations: true,  reports: false },
  professional: { price: 59,  maxMembers: 25,  maxProjects: 50,  maxStorage: 20, aiCredits: 500, automations: true,  reports: true  },
  business:     { price: 99,  maxMembers: 100, maxProjects: 200, maxStorage: 100,aiCredits: 2000,automations: true,  reports: true  },
  enterprise:   { price: 299, maxMembers: -1,  maxProjects: -1,  maxStorage: -1, aiCredits: -1,  automations: true,  reports: true  },
};

const mockAnnouncements = [
  { _id: 'ann1', message: 'New feature: Gantt!', type: 'info', active: true, dismissible: true, targetPlans: [], createdAt: new Date().toISOString() },
  { _id: 'ann2', message: 'Maintenance tonight', type: 'warning', active: false, dismissible: true, targetPlans: ['free'], createdAt: new Date().toISOString() },
];

const mockSystem = {
  database: { status: 'connected', state: 1 },
  server: { uptime: 86400, uptimeFormatted: '1d 0h 0m', nodeVersion: 'v22.0.0', platform: 'linux', arch: 'x64' },
  memory: { heapUsed: 120, heapTotal: 256, rss: 180 },
  os: { loadAvg1: '0.45', loadAvg5: '0.52', totalMem: 8, freeMem: 4, cpus: 4 },
  activity: { newUsersToday: 3, newUsersWeek: 18, newOrgsToday: 1, activeToday: 22 },
};

// ── Helper ───────────────────────────────────────────────────────────────────

function setupApiMocks() {
  api.get.mockImplementation((url) => {
    if (url === '/owner/stats')         return Promise.resolve({ data: mockStats });
    if (url === '/owner/growth')        return Promise.resolve({ data: [] });
    if (url === '/owner/organizations') return Promise.resolve({ data: mockOrgs, total: 2 });
    if (url === '/owner/users')         return Promise.resolve({ data: mockUsers, total: 2 });
    if (url === '/owner/settings')      return Promise.resolve({ data: mockSettings });
    if (url === '/owner/plans')         return Promise.resolve({ data: mockPlans });
    if (url === '/owner/announcements') return Promise.resolve({ data: mockAnnouncements });
    if (url === '/owner/system')        return Promise.resolve({ data: mockSystem });
    return Promise.resolve({ data: [] });
  });
  api.post.mockResolvedValue({ data: { _id: 'new1', message: 'Test', type: 'info', active: true } });
  api.put.mockResolvedValue({ data: mockSettings });
  api.patch.mockResolvedValue({ data: {} });
  api.delete.mockResolvedValue({ data: {} });
}

function renderPanel(stateOverride = ownerState) {
  return renderWithProviders(<OwnerAdminPanel />, { preloadedState: stateOverride });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('OwnerAdminPanel', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    setupApiMocks();
  });

  // ── Access control ──────────────────────────────────────────────────────────

  describe('Access Control', () => {
    it('shows loading spinner while auth is initializing', () => {
      renderPanel({ auth: { ...ownerState.auth, initialized: false } });
      expect(document.querySelector('.MuiCircularProgress-root')).toBeTruthy();
    });

    it('redirects to /login when not authenticated', async () => {
      renderPanel({ auth: { user: null, token: null, initialized: true, loading: false, error: null } });
      await waitFor(() => expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login'));
    });

    it('shows Access Denied for non-owner users', async () => {
      renderPanel({
        auth: { user: { _id: 'u99', name: 'Regular', email: 'regular@example.com', role: { name: 'Member' }, organization: null }, token: 'tok', initialized: true, loading: false, error: null },
      });
      await waitFor(() => expect(screen.getByText('Access Denied')).toBeInTheDocument());
    });

    it('renders the panel for the owner', async () => {
      renderPanel();
      await waitFor(() => expect(screen.getByText('Owner Control Panel')).toBeInTheDocument());
    });
  });

  // ── Overview stats ──────────────────────────────────────────────────────────

  describe('Overview Stats', () => {
    it('displays total orgs, users, MRR and conversion rate', async () => {
      renderPanel();
      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument();   // totalOrgs
        expect(screen.getByText('47')).toBeInTheDocument();   // totalUsers
        expect(screen.getByText('$580')).toBeInTheDocument(); // MRR
        expect(screen.getByText('42%')).toBeInTheDocument();  // conversion
      });
    });

    it('shows maintenance mode banner when enabled', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/owner/stats') return Promise.resolve({ data: mockStats });
        if (url === '/owner/growth') return Promise.resolve({ data: [] });
        if (url === '/owner/organizations') return Promise.resolve({ data: mockOrgs, total: 2 });
        if (url === '/owner/users') return Promise.resolve({ data: mockUsers, total: 2 });
        if (url === '/owner/settings') return Promise.resolve({ data: { ...mockSettings, maintenanceMode: true } });
        return Promise.resolve({ data: [] });
      });
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      // Navigate to Settings tab to trigger fetchSettings, then the banner renders at top
      await user.click(screen.getByRole('tab', { name: /Settings/i }));
      await waitFor(() => expect(screen.getByText(/Maintenance Mode is ON/)).toBeInTheDocument());
    });
  });

  // ── Tab 0: Organizations ────────────────────────────────────────────────────

  describe('Tab 0 — Organizations', () => {
    it('displays org names from API', async () => {
      renderPanel();
      await waitFor(() => {
        expect(screen.getByText('Acme Inc')).toBeInTheDocument();
        expect(screen.getByText('Beta Corp')).toBeInTheDocument();
      });
    });

    it('opens change plan dialog when star icon is clicked', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Acme Inc'));
      // MUI Tooltip doesn't put title attr on button — find by SVG icon data-testid
      const starBtn = document.querySelector('[data-testid="StarIcon"]').closest('button');
      await user.click(starBtn);
      await waitFor(() => expect(screen.getByText(/Change Plan/)).toBeInTheDocument());
    });

    it('saves plan change via API', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Acme Inc'));
      const starBtn = document.querySelector('[data-testid="StarIcon"]').closest('button');
      await user.click(starBtn);
      await waitFor(() => screen.getByText(/Change Plan/));
      await user.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(api.patch).toHaveBeenCalledWith(expect.stringContaining('/owner/organizations/org1/plan'), expect.any(Object)));
    });

    it('opens delete org confirmation dialog', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Acme Inc'));
      // Find all delete icon buttons (org rows come before user rows)
      const deleteBtn = document.querySelectorAll('[data-testid="DeleteIcon"]')[0].closest('button');
      await user.click(deleteBtn);
      await waitFor(() => expect(screen.getByText('Delete Organization')).toBeInTheDocument());
    });

    it('calls delete API after confirmation', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Acme Inc'));
      const deleteBtn = document.querySelectorAll('[data-testid="DeleteIcon"]')[0].closest('button');
      await user.click(deleteBtn);
      await waitFor(() => screen.getByText('Delete Organization'));
      await user.click(screen.getByRole('button', { name: /Delete permanently/i }));
      await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/owner/organizations/org1'));
    });
  });

  // ── Tab 1: Users ────────────────────────────────────────────────────────────

  describe('Tab 1 — Users', () => {
    it('switches to Users tab and shows users', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Users/i }));
      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      });
    });

    it('shows 2FA status icons', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Users/i }));
      await waitFor(() => screen.getByText('Alice Smith'));
      const checkIcons = document.querySelectorAll('[data-testid="CheckCircleIcon"]');
      expect(checkIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('opens delete user confirmation', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Users/i }));
      await waitFor(() => screen.getByText('Alice Smith'));
      const deleteBtn = document.querySelector('[data-testid="DeleteIcon"]').closest('button');
      await user.click(deleteBtn);
      await waitFor(() => expect(screen.getByText('Delete User')).toBeInTheDocument());
    });

    it('calls delete user API on confirmation', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Users/i }));
      await waitFor(() => screen.getByText('Alice Smith'));
      const deleteBtn = document.querySelector('[data-testid="DeleteIcon"]').closest('button');
      await user.click(deleteBtn);
      await waitFor(() => screen.getByText('Delete User'));
      await user.click(screen.getByRole('button', { name: /Delete permanently/i }));
      await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/owner/users/u1'));
    });
  });

  // ── Tab 3: Growth ───────────────────────────────────────────────────────────

  describe('Tab 3 — Growth', () => {
    it('shows bar chart and plan breakdown', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Growth/i }));
      await waitFor(() => {
        expect(screen.getByText('New Signups (Last 6 Months)')).toBeInTheDocument();
        expect(screen.getByText('Plan Breakdown')).toBeInTheDocument();
      });
    });
  });

  // ── Tab 4: Settings ─────────────────────────────────────────────────────────

  describe('Tab 4 — Settings', () => {
    it('loads and displays settings', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Settings/i }));
      await waitFor(() => {
        expect(screen.getByText('Maintenance Mode')).toBeInTheDocument();
        expect(screen.getByText('Allow New Signups')).toBeInTheDocument();
        expect(screen.getByText('Feature Flags')).toBeInTheDocument();
      });
    });

    it('toggles maintenance mode switch', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Settings/i }));
      await waitFor(() => screen.getByText('Maintenance Mode'));
      const switches = screen.getAllByRole('checkbox');
      await user.click(switches[0]);
      await waitFor(() => expect(screen.getByText(/Maintenance Mode is ON/)).toBeInTheDocument());
    });

    it('calls PUT /owner/settings on Save', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Settings/i }));
      await waitFor(() => screen.getByText('Save Settings'));
      await user.click(screen.getByRole('button', { name: /Save Settings/i }));
      await waitFor(() => expect(api.put).toHaveBeenCalledWith('/owner/settings', expect.any(Object)));
    });

    it('shows feature flag toggles for all 9 features', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Settings/i }));
      await waitFor(() => screen.getByText('Feature Flags'));
      const features = ['AI Assistant', 'Automations', 'Reports', 'Portfolios', 'Webhooks', 'Gantt Chart', 'Sprints', 'Time Tracking', 'Calendar'];
      features.forEach(f => expect(screen.getByText(f)).toBeInTheDocument());
    });
  });

  // ── Tab 5: Plans & Pricing ──────────────────────────────────────────────────

  describe('Tab 5 — Plans & Pricing', () => {
    it('displays all 5 plan cards', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Plans/i }));
      await waitFor(() => {
        ['free','starter','professional','business','enterprise'].forEach(p => {
          expect(screen.getAllByText(p).length).toBeGreaterThanOrEqual(1);
        });
      });
    });

    it('shows price fields with correct defaults', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Plans/i }));
      await waitFor(() => screen.getAllByText('free'));
      const priceInputs = screen.getAllByLabelText(/Price/i);
      expect(priceInputs[0]).toHaveValue(0);  // free plan price
    });

    it('calls PUT /owner/plans/free on Save', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Plans/i }));
      await waitFor(() => screen.getAllByRole('button', { name: /Save/i }));
      const saveBtns = screen.getAllByRole('button', { name: /Save/i });
      await user.click(saveBtns[0]);
      await waitFor(() => expect(api.put).toHaveBeenCalledWith('/owner/plans/free', expect.any(Object)));
    });
  });

  // ── Tab 6: Announcements ────────────────────────────────────────────────────

  describe('Tab 6 — Announcements', () => {
    it('lists existing announcements', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Announcements/i }));
      await waitFor(() => {
        expect(screen.getByText('New feature: Gantt!')).toBeInTheDocument();
        expect(screen.getByText('Maintenance tonight')).toBeInTheDocument();
      });
    });

    it('opens create announcement dialog', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Announcements/i }));
      await waitFor(() => screen.getByText('New feature: Gantt!'));
      // Button text is "New Announcement" with an Add icon
      const addBtn = screen.getByRole('button', { name: /New Announcement/i });
      await user.click(addBtn);
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    });

    it('creates announcement via API', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Announcements/i }));
      await waitFor(() => screen.getByText('New feature: Gantt!'));
      await user.click(screen.getByRole('button', { name: /New Announcement/i }));
      await waitFor(() => screen.getByLabelText(/Message/i));
      await user.type(screen.getByLabelText(/Message/i), 'Test announcement');
      await user.click(screen.getByRole('button', { name: /^Save$/i }));
      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/owner/announcements', expect.objectContaining({ message: 'Test announcement' })));
    });

    it('toggles announcement active state', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Announcements/i }));
      await waitFor(() => screen.getByText('New feature: Gantt!'));
      const toggles = screen.getAllByRole('checkbox');
      await user.click(toggles[0]);
      await waitFor(() => expect(api.put).toHaveBeenCalledWith('/owner/announcements/ann1', expect.objectContaining({ active: false })));
    });

    it('deletes announcement via API', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Announcements/i }));
      await waitFor(() => screen.getByText('New feature: Gantt!'));
      const deleteBtn = document.querySelector('[data-testid="DeleteIcon"]').closest('button');
      await user.click(deleteBtn);
      await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/owner/announcements/ann1'));
    });
  });

  // ── Tab 7: Email Blast ──────────────────────────────────────────────────────

  describe('Tab 7 — Email Blast', () => {
    it('shows email blast form', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Email Blast/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Body/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send Email Blast/i })).toBeInTheDocument();
      });
    });

    it('send button is disabled when subject or body is empty', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Email Blast/i }));
      await waitFor(() => screen.getByRole('button', { name: /Send Email Blast/i }));
      expect(screen.getByRole('button', { name: /Send Email Blast/i })).toBeDisabled();
    });

    it('shows confirm dialog before sending', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Email Blast/i }));
      await waitFor(() => screen.getByLabelText(/Subject/i));
      await user.type(screen.getByLabelText(/Subject/i), 'Hello Users');
      await user.type(screen.getByLabelText(/Body/i), '<p>Important update</p>');
      await user.click(screen.getByRole('button', { name: /Send Email Blast/i }));
      await waitFor(() => expect(screen.getByText('Confirm Email Blast')).toBeInTheDocument());
    });

    it('calls POST /owner/email-blast after confirm', async () => {
      api.post.mockResolvedValue({ data: { sent: 25, failed: 0 } });
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Email Blast/i }));
      await waitFor(() => screen.getByLabelText(/Subject/i));
      await user.type(screen.getByLabelText(/Subject/i), 'Hello Users');
      await user.type(screen.getByLabelText(/Body/i), '<p>Update</p>');
      await user.click(screen.getByRole('button', { name: /Send Email Blast/i }));
      await waitFor(() => screen.getByText('Confirm Email Blast'));
      await user.click(screen.getByRole('button', { name: /^Send$/i }));
      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/owner/email-blast', expect.objectContaining({ subject: 'Hello Users' })));
    });
  });

  // ── Tab 8: System Health ────────────────────────────────────────────────────

  describe('Tab 8 — System', () => {
    it('shows system health after clicking Refresh', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /System/i }));
      // Find the System tab's Refresh button (not the global one in header)
      await waitFor(() => {
        const refreshBtns = screen.getAllByRole('button', { name: /Refresh/i });
        expect(refreshBtns.length).toBeGreaterThanOrEqual(1);
      });
      const refreshBtns = screen.getAllByRole('button', { name: /Refresh/i });
      // Click the last Refresh button (the one in the system tab, not header)
      await user.click(refreshBtns[refreshBtns.length - 1]);
      await waitFor(() => {
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('connected')).toBeInTheDocument();
        expect(screen.getByText('1d 0h 0m')).toBeInTheDocument();
        expect(screen.getByText('v22.0.0')).toBeInTheDocument();
      });
    });

    it('shows activity stats', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /System/i }));
      await waitFor(() => screen.getAllByRole('button', { name: /Refresh/i }));
      const refreshBtns = screen.getAllByRole('button', { name: /Refresh/i });
      await user.click(refreshBtns[refreshBtns.length - 1]);
      await waitFor(() => {
        // newUsersToday=3, activeToday=22
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('22')).toBeInTheDocument();
      });
    });
  });

  // ── Tab 9: Mobile ───────────────────────────────────────────────────────────

  describe('Tab 9 — Mobile', () => {
    it('shows Android live status and APK link', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Mobile/i }));
      await waitFor(() => {
        expect(screen.getByText('Android')).toBeInTheDocument();
        expect(screen.getByText('julay.org/julay.apk')).toBeInTheDocument();
      });
    });

    it('shows iOS pending setup status', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Mobile/i }));
      await waitFor(() => {
        expect(screen.getByText('iOS')).toBeInTheDocument();
        expect(screen.getByText('Pending Setup')).toBeInTheDocument();
      });
    });

    it('shows auto-sync pipeline chips', async () => {
      const user = userEvent.setup();
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await user.click(screen.getByRole('tab', { name: /Mobile/i }));
      await waitFor(() => {
        expect(screen.getByText('Push to main')).toBeInTheDocument();
        expect(screen.getByText('Deploy to julay.org')).toBeInTheDocument();
      });
    });
  });

  // ── API error handling ──────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('shows Access Denied when stats returns 403', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/owner/stats') return Promise.reject({ response: { status: 403 } });
        return Promise.resolve({ data: [] });
      });
      renderPanel();
      await waitFor(() => expect(screen.getByText('Access Denied')).toBeInTheDocument());
    });

    it('renders empty state when orgs list is empty', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/owner/stats')         return Promise.resolve({ data: mockStats });
        if (url === '/owner/growth')        return Promise.resolve({ data: [] });
        if (url === '/owner/organizations') return Promise.resolve({ data: [], total: 0 });
        if (url === '/owner/users')         return Promise.resolve({ data: [], total: 0 });
        return Promise.resolve({ data: [] });
      });
      renderPanel();
      await waitFor(() => screen.getByText('Owner Control Panel'));
      await waitFor(() => expect(screen.getByText('No organizations found')).toBeInTheDocument());
    });
  });

});
