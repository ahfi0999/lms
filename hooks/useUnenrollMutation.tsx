import { useMutation, useQuery } from '@tanstack/react-query';
import http from '../lib/http-client';
import { notify } from '../lib/notify';
import { UnenrollData } from '../types/courses';
import { useRouter } from 'next/router';

function useUnenrollMutation(handleSuccess?: () => void) {
  const router = useRouter();
  return useMutation({
    mutationKey: ['unenroll'],
    mutationFn: async (data: UnenrollData) => {
      const response = await http.post('/api/courses/unenroll', data);
      return response.data;
    },
    onSuccess: () => {
      if (handleSuccess) {
        handleSuccess();
      } else {
        router.replace(router.asPath);
      }
      notify({
        type: 'success',
        message: 'User unenrolled successfully',
        id: 'unenroll',
      });
    },
    onError: () => {
      notify({
        type: 'error',
        message: 'Something went wrong',
      });
    },
  });
}

export default useUnenrollMutation;
