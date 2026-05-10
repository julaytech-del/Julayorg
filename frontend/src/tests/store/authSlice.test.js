import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout, clearError, setCredentials } from '../../store/slices/authSlice.js';

function makeAuthStore(preloadedState) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState,
    middleware: (gDM) => gDM({ serializableCheck: false }),
  });
}

describe('authSlice', () => {
  describe('initial state', () => {
    it('has correct initial state shape', () => {
      const store = makeAuthStore();
      const state = store.getState().auth;
      expect(state).toMatchObject({
        user: null,
        loading: false,
        error: null,
      });
      // token comes from localStorage (null in jsdom unless set)
      expect('token' in state).toBe(true);
      expect('initialized' in state).toBe(true);
    });
  });

  describe('logout action', () => {
    it('clears user and token', () => {
      const store = makeAuthStore({
        auth: {
          user: { _id: 'u1', name: 'Test User' },
          token: 'abc123',
          loading: false,
          error: null,
          initialized: true,
        },
      });

      store.dispatch(logout());
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe('clearError action', () => {
    it('sets error to null', () => {
      const store = makeAuthStore({
        auth: {
          user: null,
          token: null,
          loading: false,
          error: 'Something went wrong',
          initialized: true,
        },
      });

      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });
  });

  describe('setCredentials action', () => {
    it('sets user and token from payload', () => {
      const store = makeAuthStore({
        auth: { user: null, token: null, loading: false, error: null, initialized: false },
      });

      const user = { _id: 'u1', name: 'Jane Doe', email: 'jane@example.com' };
      const token = 'my-jwt-token';

      store.dispatch(setCredentials({ user, token }));

      const state = store.getState().auth;
      expect(state.user).toEqual(user);
      expect(state.token).toBe(token);
      expect(state.initialized).toBe(true);
    });
  });
});
