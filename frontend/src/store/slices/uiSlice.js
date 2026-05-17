import { createSlice } from '@reduxjs/toolkit';

const loadTimers = () => {
  try { return JSON.parse(localStorage.getItem('julay_timers') || '[]'); }
  catch { return []; }
};
const saveTimers = (timers) => localStorage.setItem('julay_timers', JSON.stringify(timers));

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    snackbar: { open: false, message: '', severity: 'success' },
    modals: {},
    darkMode: localStorage.getItem('julay_dark') === 'true',
    accentColor: localStorage.getItem('julay_accent') || '#4F46E5',
    dashboardRefresh: 0,
    activeTimers: loadTimers(),  // [{ taskId, taskTitle, startedAt }]
  },
  reducers: {
    toggleSidebar(s) { s.sidebarOpen = !s.sidebarOpen; },
    setSidebar(s, a) { s.sidebarOpen = a.payload; },
    showSnackbar(s, a) { s.snackbar = { open: true, message: a.payload.message, severity: a.payload.severity || 'success' }; },
    hideSnackbar(s) { s.snackbar.open = false; },
    openModal(s, a) { s.modals[a.payload] = true; },
    closeModal(s, a) { s.modals[a.payload] = false; },
    toggleDarkMode(s) {
      s.darkMode = !s.darkMode;
      localStorage.setItem('julay_dark', String(s.darkMode));
    },
    setAccentColor(s, a) {
      s.accentColor = a.payload;
      localStorage.setItem('julay_accent', a.payload);
    },
    triggerDashboardRefresh(s) { s.dashboardRefresh += 1; },
    startGlobalTimer(s, a) {
      const exists = s.activeTimers.some(t => t.taskId === a.payload.taskId);
      if (exists) return;
      s.activeTimers.push({ taskId: a.payload.taskId, taskTitle: a.payload.taskTitle, startedAt: a.payload.startedAt });
      saveTimers(s.activeTimers);
    },
    stopGlobalTimer(s, a) {
      // a.payload = taskId  (or undefined = stop all)
      s.activeTimers = a.payload
        ? s.activeTimers.filter(t => t.taskId !== a.payload)
        : [];
      saveTimers(s.activeTimers);
    },
  }
});

export const {
  toggleSidebar, setSidebar, showSnackbar, hideSnackbar,
  openModal, closeModal, toggleDarkMode, setAccentColor, triggerDashboardRefresh,
  startGlobalTimer, stopGlobalTimer,
} = uiSlice.actions;
export default uiSlice.reducer;
