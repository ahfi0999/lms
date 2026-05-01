import { useQuery } from '@tanstack/react-query';
import http from '../lib/http-client';

const getUserPermissions = async () => {
  const response = await http.get<string[]>('/users/permissions');
  return response.data;
};

export default function useGetUserPermissions(isAuthenticated: boolean) {
  const query = useQuery({
    queryKey: ['getUserPermissions'],
    queryFn: getUserPermissions,
    enabled: isAuthenticated,
  });

  return query;
}
