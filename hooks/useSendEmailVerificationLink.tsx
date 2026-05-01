import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import http from '../lib/http-client';

function useSendEmailVerificationLink() {
  return useMutation({
    mutationKey: ['verifyEmail'],
    mutationFn: async () => {
      try {
        const res = await http.put('/api/users/send-email-verfication-link');
        return res.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return Promise.reject(error.response?.data);
        }
        return Promise.reject(error);
      }
    },
    onSuccess: () => {
      notifications.show({
        title: 'Verification email sent',
        message: 'Check your inbox and follow instructions to verify your email',
        color: 'teal',
        icon: <IconCheck />,
      });
    },
    onError: () => {
      notifications.show({
        title: 'Failed to send verification email',
        message: 'Please try again later',
        color: 'red',
        icon: <IconX />,
      });
    },
  });
}

export default useSendEmailVerificationLink;
