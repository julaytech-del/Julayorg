import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aiAPI } from '../../services/api.js';

export const generatePlan = createAsyncThunk('ai/generatePlan', async (data, { rejectWithValue }) => {
  try { const res = await aiAPI.generatePlan(data); return res.data; }
  catch (err) { return rejectWithValue({ message: err.message || 'Failed to generate plan', code: err.code }); }
});

export const assignTeam = createAsyncThunk('ai/assignTeam', async (projectId, { rejectWithValue }) => {
  try { const res = await aiAPI.assignTeam(projectId); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const getStandup = createAsyncThunk('ai/getStandup', async (projectId, { rejectWithValue }) => {
  try { const res = await aiAPI.getStandup(projectId); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const analyzePerformance = createAsyncThunk('ai/analyzePerformance', async (projectId, { rejectWithValue }) => {
  try { const res = await aiAPI.getPerformance(projectId); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const replanProject = createAsyncThunk('ai/replan', async ({ projectId, reason }, { rejectWithValue }) => {
  try { const res = await aiAPI.replan(projectId, reason); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

const aiSlice = createSlice({
  name: 'ai',
  initialState: { loading: false, result: null, standupReport: null, performanceReport: null, replanResult: null, error: null, step: '' },
  reducers: {
    clearAIResult(s) { s.result = null; s.error = null; },
    setStep(s, a) { s.step = a.payload; }
  },
  extraReducers: builder => {
    builder
      .addCase(generatePlan.pending, s => { s.loading = true; s.error = null; s.result = null; })
      .addCase(generatePlan.fulfilled, (s, a) => { s.loading = false; s.result = a.payload; })
      .addCase(generatePlan.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(getStandup.pending, s => { s.loading = true; })
      .addCase(getStandup.fulfilled, (s, a) => { s.loading = false; s.standupReport = a.payload; })
      .addCase(getStandup.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(analyzePerformance.pending, s => { s.loading = true; })
      .addCase(analyzePerformance.fulfilled, (s, a) => { s.loading = false; s.performanceReport = a.payload; })
      .addCase(analyzePerformance.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(replanProject.pending, s => { s.loading = true; })
      .addCase(replanProject.fulfilled, (s, a) => { s.loading = false; s.replanResult = a.payload; })
      .addCase(replanProject.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export const { clearAIResult, setStep } = aiSlice.actions;
export default aiSlice.reducer;
