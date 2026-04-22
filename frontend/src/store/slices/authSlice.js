import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api.js';

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(email, password);
    localStorage.setItem('julay_token', res.data.token);
    return res.data;
  } catch (err) { return rejectWithValue(err.message || 'Login failed'); }
});

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data);
    localStorage.setItem('julay_token', res.data.token);
    return res.data;
  } catch (err) { return rejectWithValue(err.message || err.error || 'Registration failed'); }
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.getMe();
    return res.data;
  } catch (err) { return rejectWithValue(err.message); }
});

const rawToken = localStorage.getItem('julay_token');
const storedToken = (rawToken && rawToken !== 'undefined' && rawToken !== 'null') ? rawToken : null;
if (!storedToken && rawToken) localStorage.removeItem('julay_token');

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: storedToken, loading: false, error: null, initialized: !storedToken },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('julay_token');
    },
    clearError(state) { state.error = null; },
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.initialized = true;
      localStorage.setItem('julay_token', action.payload.token);
    }
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, s => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; s.initialized = true; localStorage.setItem('julay_token', a.payload.token); })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(registerUser.pending, s => { s.loading = true; s.error = null; })
      .addCase(registerUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; s.initialized = true; localStorage.setItem('julay_token', a.payload.token); })
      .addCase(registerUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchCurrentUser.pending, s => { s.loading = true; })
      .addCase(fetchCurrentUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; s.initialized = true; })
      .addCase(fetchCurrentUser.rejected, s => { s.loading = false; s.token = null; s.initialized = true; localStorage.removeItem('julay_token'); });
  }
});

export const { logout, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
