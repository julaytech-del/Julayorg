import { useSelector } from 'react-redux';

export function usePermissions() {
  const user = useSelector(s => s.auth.user);
  const level = user?.role?.level || 'viewer';
  const perms = user?.role?.permissions || {};
  const isAdmin = user?.isAdmin || level === 'admin';

  const can = (resource, action) => {
    if (isAdmin) return true;
    return !!perms[resource]?.[action];
  };

  return {
    level,
    isAdmin,
    canCreateProject:    can('projects', 'create'),
    canEditProject:      can('projects', 'update'),
    canDeleteProject:    can('projects', 'delete'),
    canCreateTask:       can('tasks', 'create'),
    canEditTask:         can('tasks', 'update'),
    canDeleteTask:       can('tasks', 'delete'),
    canAssignTask:       can('tasks', 'assign'),
    canManageTeam:       can('users', 'create'),
    canManageDepartment: can('departments', 'create'),
    canUseAI:            can('ai', 'use'),
    canViewReports:      can('reports', 'view'),
    canExportReports:    can('reports', 'export'),
  };
}
