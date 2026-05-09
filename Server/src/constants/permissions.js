const PERMISSION_DEFINITIONS = [
  { key: 'dashboard.view', module: 'dashboard', description: 'View dashboard page' },
  { key: 'projects.view', module: 'projects', description: 'View projects page' },
  { key: 'projects.manage', module: 'projects', description: 'Create and edit projects' },
  { key: 'team.view', module: 'team', description: 'View team page' },
  { key: 'team.manage', module: 'team', description: 'Create and edit team users' },
  { key: 'tasks.view', module: 'tasks', description: 'View tasks page' },
  { key: 'tasks.manage', module: 'tasks', description: 'Create and edit tasks' },
  { key: 'logs.view', module: 'logs', description: 'View logs page' },
  { key: 'logs.manage', module: 'logs', description: 'Create and edit logs' },
  { key: 'timeline.view', module: 'timeline', description: 'View timeline page' },
  { key: 'settings.view', module: 'settings', description: 'View settings page' },
  { key: 'notifications.view', module: 'notifications', description: 'View notifications page' },
  { key: 'permissions.manage', module: 'permissions', description: 'Manage permission groups' }
];

const SYSTEM_GROUPS = {
  ADMIN_FULL_ACCESS: 'ADMIN_FULL_ACCESS',
  DEFAULT_USER: 'DEFAULT_USER'
};

module.exports = {
  PERMISSION_DEFINITIONS,
  SYSTEM_GROUPS
};
