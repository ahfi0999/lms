import { QueryClient } from '@tanstack/react-query';
import { notify } from './notify';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        notify({
          message: 'Something went wrong. Please try again.',
          type: 'error',
        });
      },
    },
  },
});

export default queryClient;
