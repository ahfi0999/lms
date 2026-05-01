import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import http from '../lib/http-client';

function usePasswordResetMutation(email: string) {
  return useMutation({
    mutationKey: ['passwordReset'],
    mutationFn: async () => {
      try {
        const res = await http.post<string>('/api/users/password-reset', {
          email,
        });
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
        title: 'Password reset email sent.',
        message: 'Please check your email for the password reset link.',
        color: 'teal',
        icon: <IconCheck />,
      });
    },
    onError: () => {
      notifications.show({
        title: 'Something went wrong.',
        message: 'Please try again later.',
        color: 'red',
        icon: <IconX />,
      });
    },
  });
}

export default usePasswordResetMutation;
