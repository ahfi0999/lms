import { notifications } from '@mantine/notifications';
import { IconCheck, IconExclamationCircle, IconInfoCircle } from '@tabler/icons-react';
import { ShowNotificationOptions } from '../types/utils';

export function notify(options: ShowNotificationOptions) {
  switch (options.type) {
    case 'success':
      notifications.show({
        icon: <IconCheck />,
        color: 'teal',
        title: 'Success',
        ...options,
      });
      break;
    case 'error':
      notifications.show({
        icon: <IconExclamationCircle />,
        color: 'red',
        title: 'Error',
        ...options,
      });
      break;
    case 'info':
      notifications.show({
        icon: <IconInfoCircle />,
        color: 'blue',
        title: 'Info',
        ...options,
      });
      break;
    case 'warning':
      notifications.show({
        icon: <IconExclamationCircle />,
        color: 'orange',
        title: 'Alert',
        ...options,
      });
      break;
    default:
      {
        const _exhaustiveCheck: never = options.type;
        return _exhaustiveCheck;
      }
      break;
  }
}
