import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import authReducer from '../store/slices/authSlice.js';
import projectReducer from '../store/slices/projectSlice.js';
import taskReducer from '../store/slices/taskSlice.js';
import uiReducer from '../store/slices/uiSlice.js';
import aiReducer from '../store/slices/aiSlice.js';

const theme = createTheme();

export const mockUser = {
  _id: 'user1',
  name: 'Test User',
  email: 'test@julay.org',
  role: { name: 'Admin' },
  organization: { _id: 'org1', name: 'Test Org', subscription: { plan: 'free' } },
};

export const mockProject = {
  _id: 'proj1',
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  priority: 'high',
  progress: 40,
  team: [],
  createdAt: new Date().toISOString(),
};

export const mockTask = {
  _id: 'task1',
  title: 'Test Task',
  status: 'planned',
  priority: 'medium',
  type: 'feature',
  project: { _id: 'proj1', name: 'Test Project' },
  assignees: [],
  createdAt: new Date().toISOString(),
};

export function makeStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      projects: projectReducer,
      tasks: taskReducer,
      ui: uiReducer,
      ai: aiReducer,
    },
    preloadedState: {
      auth: { user: mockUser, token: 'test-token', loading: false, error: null, initialized: true },
      ui: { darkMode: false, sidebarOpen: true, snackbar: { open: false, message: '', severity: 'success' }, modals: {} },
      projects: { list: [], loading: false, error: null, selected: null },
      tasks: { list: [], loading: false, error: null, kanban: {} },
      ai: { loading: false, error: null, results: [] },
      ...preloadedState,
    },
    middleware: (gDM) => gDM({ serializableCheck: false }),
  });
}

export function renderWithProviders(ui, { preloadedState = {}, store = makeStore(preloadedState), ...options } = {}) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}
