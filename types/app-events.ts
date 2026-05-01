import { AppEventType, User } from '@prisma/client';

export type AppEvents =
  | {
      id: number;
      type: 'COURSE_ACCESS';
      user: User;
      data: {
        action: 'enroll' | 'unenroll';
        students: string[];
        courseId: number;
      };
      createdAt: string;
    }
  | {
      id: number;
      type: 'TODO';
      data: {};
    };

export type CourseAccessEvent = Extract<AppEvents, { type: 'COURSE_ACCESS' }>;

export type AppEvent = keyof typeof AppEventType;
