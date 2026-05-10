import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Silence console.error for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
    originalError.call(console, ...args);
  };
});
afterAll(() => { console.error = originalError; });

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: vi.fn(), language: 'en' },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  Trans: ({ children }) => children,
}));

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '' }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    BrowserRouter: ({ children }) => children,
    MemoryRouter: ({ children }) => children,
    Link: ({ children, to }) => children,
    NavLink: ({ children }) => children,
  };
});

// Mock axios / api service
vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  tasksAPI: {
    getAll: vi.fn(() => Promise.resolve({ data: [] })),
    create: vi.fn(() => Promise.resolve({ data: { _id: 'task1', title: 'Test' } })),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    addComment: vi.fn(() => Promise.resolve({ data: {} })),
    getKanban: vi.fn(() => Promise.resolve({ data: {} })),
  },
  projectsAPI: {
    getAll: vi.fn(() => Promise.resolve({ data: [] })),
    create: vi.fn(() => Promise.resolve({ data: { _id: 'proj1', name: 'Test Project' } })),
    getById: vi.fn(() => Promise.resolve({ data: {} })),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
  authAPI: {
    login: vi.fn(() => Promise.resolve({ data: { token: 'tok', user: { _id: 'u1', name: 'Test' } } })),
    register: vi.fn(() => Promise.resolve({ data: { token: 'tok', user: { _id: 'u1', name: 'Test' } } })),
    googleCode: vi.fn(() => Promise.resolve({ data: { token: 'tok', user: { _id: 'u1', name: 'Test' } } })),
  },
  myTasksAPI: {
    getTasks: vi.fn(() => Promise.resolve({ data: [] })),
  },
  notificationsAPI: {
    getAll: vi.fn(() => Promise.resolve({ data: [] })),
    getCount: vi.fn(() => Promise.resolve({ data: { count: 0 } })),
    markRead: vi.fn(() => Promise.resolve({ data: {} })),
    markAllRead: vi.fn(() => Promise.resolve({ data: {} })),
  },
  dashboardAPI: {
    getStats: vi.fn(() => Promise.resolve({ data: null })),
  },
  usersAPI: {
    getProfile: vi.fn(() => Promise.resolve({ data: {} })),
    updateProfile: vi.fn(() => Promise.resolve({ data: {} })),
  },
  aiAPI: {
    generate: vi.fn(() => Promise.resolve({ data: { result: '' } })),
  },
}));

// Stub window.matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Stub IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Stub ResizeObserver — must be a class so that `new ResizeObserver(cb)` works
// (MUI Tabs and TextareaAutosize use `new ResizeObserver(...)`)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
