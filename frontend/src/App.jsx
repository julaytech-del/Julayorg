import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import { fetchCurrentUser } from './store/slices/authSlice.js';
import MainLayout from './components/Layout/MainLayout.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProjectList from './pages/Projects/ProjectList.jsx';
import ProjectDetail from './pages/Projects/ProjectDetail.jsx';
import KanbanBoard from './pages/Kanban/KanbanBoard.jsx';
import GanttView from './pages/Timeline/GanttView.jsx';
import AIStudio from './pages/AI/AIStudio.jsx';
import TeamView from './pages/Team/TeamView.jsx';
import DepartmentsView from './pages/Departments/DepartmentsView.jsx';
import Landing from './pages/Landing.jsx';
import SnackbarAlert from './components/common/SnackbarAlert.jsx';

function ProtectedRoute({ children }) {
  const { token, initialized, loading } = useSelector(s => s.auth);
  if (!initialized && loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { token } = useSelector(s => s.auth);
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const dispatch = useDispatch();
  const { token, initialized } = useSelector(s => s.auth);

  useEffect(() => {
    if (token && !initialized) dispatch(fetchCurrentUser());
  }, []);

  if (token && !initialized) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress size={48} /></Box>;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="projects/:id/kanban" element={<KanbanBoard />} />
          <Route path="projects/:id/timeline" element={<GanttView />} />
          <Route path="ai" element={<AIStudio />} />
          <Route path="team" element={<TeamView />} />
          <Route path="departments" element={<DepartmentsView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SnackbarAlert />
    </>
  );
}
