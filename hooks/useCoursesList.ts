import { useQuery } from '@tanstack/react-query';
import http from '../lib/http-client';
import { Course } from '../types/courses';
// import type { Course } from '@prisma/client';

function useCoursesList() {
  const query = useQuery({
    queryKey: ['all-courses-list'],
    queryFn: async () => {
      const { data } = await http.get<Pick<Course, 'id' | 'title'>[]>(
        '/api/courses/all-courses-list'
      );
      return data;
    },
  });

  return query;
}

export default useCoursesList;
