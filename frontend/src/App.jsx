import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress, LinearProgress } from '@mui/material';
import { fetchCurrentUser } from './store/slices/authSlice.js';

// ─── Eagerly loaded (needed immediately, before auth check) ───────────────────
import Landing from './pages/Landing.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import MainLayout from './components/Layout/MainLayout.jsx';
import SnackbarAlert from './components/common/SnackbarAlert.jsx';
import FormViewRenderer from './pages/Views/FormViewRenderer.jsx';
import NotFound from './pages/NotFound.jsx';

// ─── Lazily loaded (only when user navigates to that route) ───────────────────
const Dashboard           = React.lazy(() => import('./pages/Dashboard.jsx'));
const ProjectList         = React.lazy(() => import('./pages/Projects/ProjectList.jsx'));
const ProjectDetail       = React.lazy(() => import('./pages/Projects/ProjectDetail.jsx'));
const KanbanBoard         = React.lazy(() => import('./pages/Kanban/KanbanBoard.jsx'));
const GanttView           = React.lazy(() => import('./pages/Timeline/GanttView.jsx'));
const AIStudio            = React.lazy(() => import('./pages/AI/AIStudio.jsx'));
const TeamView            = React.lazy(() => import('./pages/Team/TeamView.jsx'));
const DepartmentsView     = React.lazy(() => import('./pages/Departments/DepartmentsView.jsx'));
const AppsHub             = React.lazy(() => import('./pages/Apps/AppsHub.jsx'));
const ShareWithAI         = React.lazy(() => import('./pages/Apps/ShareWithAI.jsx'));
const PDFViewer           = React.lazy(() => import('./pages/Apps/PDFViewer.jsx'));
const CalendarView        = React.lazy(() => import('./pages/Calendar/CalendarView.jsx'));
const WorkloadView        = React.lazy(() => import('./pages/Workload/WorkloadView.jsx'));
const AutomationsPage     = React.lazy(() => import('./pages/Automations/AutomationsPage.jsx'));
const ReportsPage         = React.lazy(() => import('./pages/Reports/ReportsPage.jsx'));
const WebhooksPage        = React.lazy(() => import('./pages/Settings/WebhooksPage.jsx'));
const FormViewBuilder     = React.lazy(() => import('./pages/Views/FormViewBuilder.jsx'));
const CustomDashboard     = React.lazy(() => import('./pages/Dashboard/CustomDashboard.jsx'));
const MyTasksPage         = React.lazy(() => import('./pages/MyTasks/MyTasksPage.jsx'));
const SprintBoard         = React.lazy(() => import('./pages/Sprint/SprintBoard.jsx'));
const PortfolioView       = React.lazy(() => import('./pages/Portfolio/PortfolioView.jsx'));
const ActivityLogPage     = React.lazy(() => import('./pages/Activity/ActivityLogPage.jsx'));
const SettingsPage        = React.lazy(() => import('./pages/Settings/SettingsPage.jsx'));

// ─── Page loading fallback ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
      <LinearProgress sx={{ height: 2, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' } }} />
    </Box>
  );
}

function ProtectedRoute({ children }) {
  const { token, initialized, loading } = useSelector(s => s.auth);
  if (!initialized && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>J</span>
        </Box>
        <CircularProgress size={24} sx={{ color: '#6366F1' }} />
      </Box>
    );
  }
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: '1.4rem' }}>J</span>
        </Box>
        <CircularProgress size={24} sx={{ color: '#6366F1' }} />
      </Box>
    );
  }

  return (
    <>
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* ── Public form renderer (no auth) ── */}
        <Route path="/forms/:token" element={<FormViewRenderer />} />

        {/* ── Protected dashboard ── */}
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={
            <Suspense fallback={<PageLoader />}><Dashboard /></Suspense>
          } />
          <Route path="projects" element={
            <Suspense fallback={<PageLoader />}><ProjectList /></Suspense>
          } />
          <Route path="projects/:id" element={
            <Suspense fallback={<PageLoader />}><ProjectDetail /></Suspense>
          } />
          <Route path="projects/:id/kanban" element={
            <Suspense fallback={<PageLoader />}><KanbanBoard /></Suspense>
          } />
          <Route path="projects/:id/timeline" element={
            <Suspense fallback={<PageLoader />}><GanttView /></Suspense>
          } />
          <Route path="ai" element={
            <Suspense fallback={<PageLoader />}><AIStudio /></Suspense>
          } />
          <Route path="team" element={
            <Suspense fallback={<PageLoader />}><TeamView /></Suspense>
          } />
          <Route path="departments" element={
            <Suspense fallback={<PageLoader />}><DepartmentsView /></Suspense>
          } />
          <Route path="apps" element={
            <Suspense fallback={<PageLoader />}><AppsHub /></Suspense>
          } />
          <Route path="apps/share" element={
            <Suspense fallback={<PageLoader />}><ShareWithAI /></Suspense>
          } />
          <Route path="apps/pdf" element={
            <Suspense fallback={<PageLoader />}><PDFViewer /></Suspense>
          } />
          <Route path="calendar" element={
            <Suspense fallback={<PageLoader />}><CalendarView /></Suspense>
          } />
          <Route path="workload" element={
            <Suspense fallback={<PageLoader />}><WorkloadView /></Suspense>
          } />
          <Route path="automations" element={
            <Suspense fallback={<PageLoader />}><AutomationsPage /></Suspense>
          } />
          <Route path="reports" element={
            <Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>
          } />
          <Route path="settings/webhooks" element={
            <Suspense fallback={<PageLoader />}><WebhooksPage /></Suspense>
          } />
          <Route path="views/forms" element={
            <Suspense fallback={<PageLoader />}><FormViewBuilder /></Suspense>
          } />
          <Route path="custom-dashboard" element={
            <Suspense fallback={<PageLoader />}><CustomDashboard /></Suspense>
          } />
          <Route path="my-tasks" element={
            <Suspense fallback={<PageLoader />}><MyTasksPage /></Suspense>
          } />
          <Route path="sprints" element={
            <Suspense fallback={<PageLoader />}><SprintBoard /></Suspense>
          } />
          <Route path="portfolio" element={
            <Suspense fallback={<PageLoader />}><PortfolioView /></Suspense>
          } />
          <Route path="activity" element={
            <Suspense fallback={<PageLoader />}><ActivityLogPage /></Suspense>
          } />
          <Route path="settings" element={
            <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>
          } />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <SnackbarAlert />
    </>
  );
}
