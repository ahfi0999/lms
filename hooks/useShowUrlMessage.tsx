import { notifications } from '@mantine/notifications';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

function useShowUrlMessage() {
  const router = useRouter();

  useEffect(() => {
    const { message } = router.query;

    if (message) {
      notifications.show({
        title: 'Info',
        message,
        color: 'blue',
        autoClose: 5000,
        icon: <IconInfoCircleFilled />,
        onClose: () => {
          notifications.clean();
          router.replace(router.pathname, undefined, { shallow: true });
        },
      });

      return () => {
        notifications.clean();
      };
    }
  }, [router.query]);

  return null;
}

export default useShowUrlMessage;
