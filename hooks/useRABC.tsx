import { useQuery } from '@tanstack/react-query';
import http from '../lib/http-client';
import { IRABCData, Permission } from '../types/auth0';
import { useCallback } from 'react';

function useRABC() {
  const query = useQuery({
    queryKey: ['rabc'],
    queryFn: async () => {
      const res = await http.get<IRABCData>('/api/users/rabc');
      return res.data;
    },
    staleTime: Infinity,
    refetchOnMount: false,
  });

  const checkPermission = useCallback(
    (permission: Permission | Permission[], method: 'or' | 'and' = 'and') => {
      const permissions = Array.isArray(permission) ? permission : [permission];
      if (method === 'or') {
        return permissions.some((p) => query.data?.permissions.includes(p));
      }
      return permissions.every((p) => query.data?.permissions.includes(p));
    },
    [query.data?.permissions]
  );

  return {
    roles: query.data?.roles || [],
    permissions: query.data?.permissions || [],
    check: checkPermission,
    isSuccess: query.isSuccess,
  };
}

export default useRABC;
