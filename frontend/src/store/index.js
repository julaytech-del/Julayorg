import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import projectReducer from './slices/projectSlice.js';
import taskReducer from './slices/taskSlice.js';
import uiReducer from './slices/uiSlice.js';
import aiReducer from './slices/aiSlice.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    tasks: taskReducer,
    ui: uiReducer,
    ai: aiReducer
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false })
});

export default store;
