import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import uiReducer, { toggleDarkMode, showSnackbar, hideSnackbar, toggleSidebar } from '../../store/slices/uiSlice.js';

function makeUiStore(preloadedState) {
  return configureStore({
    reducer: { ui: uiReducer },
    preloadedState,
    middleware: (gDM) => gDM({ serializableCheck: false }),
  });
}

describe('uiSlice', () => {
  describe('toggleDarkMode', () => {
    it('toggles darkMode from false to true', () => {
      const store = makeUiStore({
        ui: { darkMode: false, sidebarOpen: true, snackbar: { open: false, message: '', severity: 'success' }, modals: {} },
      });
      store.dispatch(toggleDarkMode());
      expect(store.getState().ui.darkMode).toBe(true);
    });

    it('toggles darkMode from true to false', () => {
      const store = makeUiStore({
        ui: { darkMode: true, sidebarOpen: true, snackbar: { open: false, message: '', severity: 'success' }, modals: {} },
      });
      store.dispatch(toggleDarkMode());
      expect(store.getState().ui.darkMode).toBe(false);
    });
  });

  describe('showSnackbar', () => {
    it('sets message, severity, and open=true', () => {
      const store = makeUiStore({
        ui: { darkMode: false, sidebarOpen: true, snackbar: { open: false, message: '', severity: 'success' }, modals: {} },
      });
      store.dispatch(showSnackbar({ message: 'Task created!', severity: 'success' }));
      const { snackbar } = store.getState().ui;
      expect(snackbar.open).toBe(true);
      expect(snackbar.message).toBe('Task created!');
      expect(snackbar.severity).toBe('success');
    });

    it('defaults severity to success when not provided', () => {
      const store = makeUiStore({
        ui: { darkMode: false, sidebarOpen: true, snackbar: { open: false, message: '', severity: 'error' }, modals: {} },
      });
      store.dispatch(showSnackbar({ message: 'Hello' }));
      expect(store.getState().ui.snackbar.severity).toBe('success');
    });

    it('supports error severity', () => {
      const store = makeUiStore({
        ui: { darkMode: false, sidebarOpen: true, snackbar: { open: false, message: '', severity: 'success' }, modals: {} },
      });
      store.dispatch(showSnackbar({ message: 'Something failed', severity: 'error' }));
      const { snackbar } = store.getState().ui;
      expect(snackbar.severity).toBe('error');
      expect(snackbar.open).toBe(true);
    });
  });

  describe('hideSnackbar', () => {
    it('sets open to false', () => {
      const store = makeUiStore({
        ui: { darkMode: false, sidebarOpen: true, snackbar: { open: true, message: 'Hi', severity: 'success' }, modals: {} },
      });
      store.dispatch(hideSnackbar());
      expect(store.getState().ui.snackbar.open).toBe(false);
    });
  });

  describe('toggleSidebar', () => {
    it('toggles sidebarOpen from true to false', () => {
      const store = makeUiStore({
        ui: { darkMode: false, sidebarOpen: true, snackbar: { open: false, message: '', severity: 'success' }, modals: {} },
      });
      store.dispatch(toggleSidebar());
      expect(store.getState().ui.sidebarOpen).toBe(false);
    });

    it('toggles sidebarOpen from false to true', () => {
      const store = makeUiStore({
        ui: { darkMode: false, sidebarOpen: false, snackbar: { open: false, message: '', severity: 'success' }, modals: {} },
      });
      store.dispatch(toggleSidebar());
      expect(store.getState().ui.sidebarOpen).toBe(true);
    });
  });
});
