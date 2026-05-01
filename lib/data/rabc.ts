import { Permission, Role } from '../../types/auth0';

export const permissions = [
  'read:users',
  'create:users',
  'update:users',
  'write:project_files',
  'read:project_files',
  'write:resources',
  'read:resources',
  'view:admin_page',
  'read:courses',
  'read:mycourses',
  'create:courses',
  'update:courses',
  'utils:upload_files',
  'admin:dashboards',
  'read:app_events',
] as const;

export const roles = ['admin', 'learner'] as const;

export const rolePermissions: Record<Role, Permission[]> = {
  admin: ['write:project_files', 'read:project_files'],
  learner: ['read:project_files'],
};
