import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    snackbar: { open: false, message: '', severity: 'success' },
    modals: {}
  },
  reducers: {
    toggleSidebar(s) { s.sidebarOpen = !s.sidebarOpen; },
    setSidebar(s, a) { s.sidebarOpen = a.payload; },
    showSnackbar(s, a) { s.snackbar = { open: true, message: a.payload.message, severity: a.payload.severity || 'success' }; },
    hideSnackbar(s) { s.snackbar.open = false; },
    openModal(s, a) { s.modals[a.payload] = true; },
    closeModal(s, a) { s.modals[a.payload] = false; }
  }
});

export const { toggleSidebar, setSidebar, showSnackbar, hideSnackbar, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
