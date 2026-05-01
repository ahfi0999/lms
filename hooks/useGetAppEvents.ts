import { useQuery } from '@tanstack/react-query';
import http from '../lib/http-client';
import { AppEvents } from '../types/app-events';

interface Params {
  courseId: number;
  type: AppEvents['type'];
}

function useGetAppEvents<T>(params: Params) {
  const query = useQuery({
    queryKey: ['app-events', params],
    queryFn: async () => {
      const { data } = await http.get<T[]>(`/api/courses/${params.courseId}/app-events`, {
        params,
      });
      return data;
    },
  });

  return query;
}

export default useGetAppEvents;
