import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectsAPI, goalsAPI } from '../../services/api.js';

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (filters, { rejectWithValue }) => {
  try { const res = await projectsAPI.getAll(filters); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchProject = createAsyncThunk('projects/fetchOne', async (id, { rejectWithValue }) => {
  try { const res = await projectsAPI.getOne(id); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const createProject = createAsyncThunk('projects/create', async (data, { rejectWithValue }) => {
  try { const res = await projectsAPI.create(data); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await projectsAPI.update(id, data); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id, { rejectWithValue }) => {
  try { await projectsAPI.delete(id); return id; }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchGoals = createAsyncThunk('projects/fetchGoals', async (projectId, { rejectWithValue }) => {
  try { const res = await goalsAPI.getAll(projectId); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const createGoal = createAsyncThunk('projects/createGoal', async ({ projectId, data }, { rejectWithValue }) => {
  try { const res = await goalsAPI.create(projectId, data); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const updateGoal = createAsyncThunk('projects/updateGoal', async ({ projectId, goalId, data }, { rejectWithValue }) => {
  try { const res = await goalsAPI.update(projectId, goalId, data); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const deleteGoal = createAsyncThunk('projects/deleteGoal', async ({ projectId, goalId }, { rejectWithValue }) => {
  try { await goalsAPI.delete(projectId, goalId); return goalId; }
  catch (err) { return rejectWithValue(err.message); }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState: { projects: [], currentProject: null, goals: [], loading: false, error: null },
  reducers: { clearCurrentProject(s) { s.currentProject = null; s.goals = []; } },
  extraReducers: builder => {
    builder
      .addCase(fetchProjects.pending, s => { s.loading = true; })
      .addCase(fetchProjects.fulfilled, (s, a) => { s.loading = false; s.projects = a.payload; })
      .addCase(fetchProjects.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchProject.pending, s => { s.loading = true; })
      .addCase(fetchProject.fulfilled, (s, a) => { s.loading = false; s.currentProject = a.payload; s.goals = a.payload.goals || []; })
      .addCase(fetchProject.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createProject.fulfilled, (s, a) => { s.projects.unshift(a.payload); })
      .addCase(updateProject.fulfilled, (s, a) => {
        const idx = s.projects.findIndex(p => p._id === a.payload._id);
        if (idx !== -1) s.projects[idx] = a.payload;
        if (s.currentProject?._id === a.payload._id) s.currentProject = { ...s.currentProject, ...a.payload };
      })
      .addCase(deleteProject.fulfilled, (s, a) => { s.projects = s.projects.filter(p => p._id !== a.payload); })
      .addCase(fetchGoals.fulfilled, (s, a) => { s.goals = a.payload; })
      .addCase(createGoal.fulfilled, (s, a) => { s.goals.push(a.payload); })
      .addCase(updateGoal.fulfilled, (s, a) => {
        const idx = s.goals.findIndex(g => g._id === a.payload._id);
        if (idx !== -1) s.goals[idx] = a.payload;
      })
      .addCase(deleteGoal.fulfilled, (s, a) => { s.goals = s.goals.filter(g => g._id !== a.payload); });
  }
});

export const { clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
