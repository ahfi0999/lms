import { z } from 'zod';
import { Attachment } from './utils';
import { unenrollSchema } from '../lib/schemas/zod-schemas';

export type Tabs =
  | 'Course Info'
  | 'Resources'
  | 'Assignments'
  | 'Projects'
  | 'Enrolled'
  | 'Resume'
  | 'Modules'
  | 'Ask AI';

export type CourseListItem = Pick<
  Course,
  'id' | 'title' | 'description' | 'picture' | 'contentLink'
> & {
  liveLink?: string | null;
};

export interface Course {
  id: number;
  title: string;
  description: string;
  picture: string;
  liveLink: string | null;
  modules: Module[];
  modulesOrder: number[];
  projectFiles: Attachment[];
  resourceFiles: Attachment[];
  archived: boolean;
  assignments: Assignment[];
  resumeFiles: string[];
  contentLink: string | null;
}

interface Assignment {
  id: number;
  attachment: Attachment;
}

export interface CourseNavListItem {
  id: number;
  title: string;
  archived: boolean;
}
export interface ModuleNavListItem {
  id: number;
  title: string;
}

export interface Module {
  id: number;
  title: string;
  topics: Topic[];
}

export interface Topic {
  id: number;
  title: string;
  videoLink: string | null;
  attachments: Attachment[];
}

export interface TopicInput {
  title: string;
  videoLink?: string;
  id: number | string;
}

export interface ModuleInput {
  title: string;
  topics: TopicInput[];
}

export type UnenrollData = z.infer<typeof unenrollSchema>;

export interface BulkEnrollResult {
  email: string;
  result: 'success' | 'error';
  message?: string;
}
