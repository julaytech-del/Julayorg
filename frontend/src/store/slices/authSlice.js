import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api.js';

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(email, password);
    localStorage.setItem('work_os_token', res.data.token);
    return res.data;
  } catch (err) { return rejectWithValue(err.message || 'Login failed'); }
});

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data);
    localStorage.setItem('work_os_token', res.data.token);
    return res.data;
  } catch (err) { return rejectWithValue(err.message || 'Registration failed'); }
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.getMe();
    return res.data;
  } catch (err) { return rejectWithValue(err.message); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: localStorage.getItem('work_os_token'), loading: false, error: null, initialized: !localStorage.getItem('work_os_token') },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('work_os_token');
    },
    clearError(state) { state.error = null; }
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, s => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(registerUser.pending, s => { s.loading = true; s.error = null; })
      .addCase(registerUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; })
      .addCase(registerUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchCurrentUser.pending, s => { s.loading = true; })
      .addCase(fetchCurrentUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; s.initialized = true; })
      .addCase(fetchCurrentUser.rejected, s => { s.loading = false; s.token = null; s.initialized = true; localStorage.removeItem('work_os_token'); });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
