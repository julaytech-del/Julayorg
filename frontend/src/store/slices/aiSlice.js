import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aiAPI } from '../../services/api.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Generation runs in the background on the server (to survive the ~60s proxy
// gateway timeout). We get a jobId immediately, then poll until it's ready.
export const generatePlan = createAsyncThunk('ai/generatePlan', async (data, { rejectWithValue }) => {
  try {
    const start = await aiAPI.generatePlan(data); // 202 -> { success, jobId }
    const jobId = start?.jobId;
    // Backward-compat: server responded synchronously with the full result.
    if (!jobId) return start?.data ?? start;

    for (let i = 0; i < 100; i++) { // up to ~200s
      await sleep(2000);
      const s = await aiAPI.generatePlanStatus(jobId);
      if (s?.status === 'done') return s.data;
      if (s?.status === 'error') return rejectWithValue({ message: s.message || 'Failed to generate plan', code: s.code });
    }
    return rejectWithValue({ message: 'Generation is taking longer than expected. Please try again.' });
  } catch (err) {
    return rejectWithValue({ message: err.message || 'Failed to generate plan', code: err.code });
  }
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
      .addCase(getStandup.pending, s => { s.loading = true; s.standupReport = null; s.error = null; })
      .addCase(getStandup.fulfilled, (s, a) => { s.loading = false; s.standupReport = a.payload; })
      .addCase(getStandup.rejected, (s, a) => { s.loading = false; s.error = a.payload || 'Failed to generate standup'; })
      .addCase(analyzePerformance.pending, s => { s.loading = true; s.performanceReport = null; s.error = null; })
      .addCase(analyzePerformance.fulfilled, (s, a) => { s.loading = false; s.performanceReport = a.payload; })
      .addCase(analyzePerformance.rejected, (s, a) => { s.loading = false; s.error = a.payload || 'Failed to analyze performance'; })
      .addCase(replanProject.pending, s => { s.loading = true; })
      .addCase(replanProject.fulfilled, (s, a) => { s.loading = false; s.replanResult = a.payload; })
      .addCase(replanProject.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export const { clearAIResult, setStep } = aiSlice.actions;
export default aiSlice.reducer;
