import { permissions, roles } from '../lib/data/rabc';

export interface IAuthData {
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
  sub: string;
  sid: string;
}

export type Permission = (typeof permissions)[number];
export type Role = (typeof roles)[number];

export interface IRABCData {
  roles: Role[];
  permissions: Permission[];
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  lastLogin: string;
  emailVerified: boolean;
}

export interface ExportedUser {
  user_id: string;
  name: string;
  email: string;
  last_login: string;
}
