import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tasksAPI } from '../../services/api.js';

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (filters, { rejectWithValue }) => {
  try { const res = await tasksAPI.getAll(filters); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchTask = createAsyncThunk('tasks/fetchOne', async (id, { rejectWithValue }) => {
  try { const res = await tasksAPI.getOne(id); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const createTask = createAsyncThunk('tasks/create', async (data, { rejectWithValue }) => {
  try { const res = await tasksAPI.create(data); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await tasksAPI.update(id, data); return res.data; }
  catch (err) { return rejectWithValue(err.message); }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (id, { rejectWithValue }) => {
  try { await tasksAPI.delete(id); return id; }
  catch (err) { return rejectWithValue(err.message); }
});

export const updateTaskStatus = createAsyncThunk('tasks/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try { const res = await tasksAPI.updateStatus(id, status); return { id, status }; }
  catch (err) { return rejectWithValue(err.message); }
});

export const addComment = createAsyncThunk('tasks/addComment', async ({ id, content }, { rejectWithValue }) => {
  try { const res = await tasksAPI.addComment(id, content); return { taskId: id, comments: res.data }; }
  catch (err) { return rejectWithValue(err.message); }
});

export const reorderTasks = createAsyncThunk('tasks/reorder', async (tasks, { rejectWithValue }) => {
  try { await tasksAPI.reorder(tasks); return tasks; }
  catch (err) { return rejectWithValue(err.message); }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState: { tasks: [], currentTask: null, loading: false, error: null },
  reducers: {
    setCurrentTask(s, a) { s.currentTask = a.payload; },
    clearCurrentTask(s) { s.currentTask = null; },
    updateTaskLocal(s, a) {
      const idx = s.tasks.findIndex(t => t._id === a.payload._id);
      if (idx !== -1) s.tasks[idx] = { ...s.tasks[idx], ...a.payload };
      if (s.currentTask?._id === a.payload._id) s.currentTask = { ...s.currentTask, ...a.payload };
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTasks.pending, s => { s.loading = true; })
      .addCase(fetchTasks.fulfilled, (s, a) => { s.loading = false; s.tasks = a.payload; })
      .addCase(fetchTasks.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchTask.fulfilled, (s, a) => { s.currentTask = a.payload; })
      .addCase(createTask.fulfilled, (s, a) => { s.tasks.unshift(a.payload); })
      .addCase(updateTask.fulfilled, (s, a) => {
        const idx = s.tasks.findIndex(t => t._id === a.payload._id);
        if (idx !== -1) s.tasks[idx] = a.payload;
        if (s.currentTask?._id === a.payload._id) s.currentTask = a.payload;
      })
      .addCase(deleteTask.fulfilled, (s, a) => { s.tasks = s.tasks.filter(t => t._id !== a.payload); })
      .addCase(updateTaskStatus.fulfilled, (s, a) => {
        const task = s.tasks.find(t => t._id === a.payload.id);
        if (task) task.status = a.payload.status;
      })
      .addCase(addComment.fulfilled, (s, a) => {
        const task = s.tasks.find(t => t._id === a.payload.taskId);
        if (task) task.comments = a.payload.comments;
        if (s.currentTask?._id === a.payload.taskId) s.currentTask.comments = a.payload.comments;
      })
      .addCase(reorderTasks.fulfilled, (s, a) => {
        for (const { id, status, position } of a.payload) {
          const task = s.tasks.find(t => t._id === id);
          if (task) { task.status = status; task.position = position; }
        }
      });
  }
});

export const { setCurrentTask, clearCurrentTask, updateTaskLocal } = taskSlice.actions;
export default taskSlice.reducer;
