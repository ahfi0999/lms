export type Nullable<T> = T | null | undefined;
import { NotificationProps } from '@mantine/notifications';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface ShowNotificationOptions extends NotificationProps {
  type: NotificationType;
}

export interface Attachment {
  id: number;
  title: string;
  description: string | null;
  file: string;
}

export type EmailTemplate = 'lms-invite' | 'reset-password' | 'verify-email';

export type FileInfo =
  | {
      type: 'file';
      name: string;
      path: string;
    }
  | {
      type: 'folder';
      name: string;
      path: string;
      nestedFiles: FileInfo[];
    };

export type TopicFile = Extract<FileInfo, { type: 'file' }>;

export type Result = 'success' | 'error';
