import { useRouter } from 'next/router';
import { useCallback } from 'react';

function useRefreshPageData() {
  const router = useRouter();

  const refreshData = useCallback(() => {
    router.replace(router.asPath);
  }, [router]);

  return refreshData;
}

export default useRefreshPageData;
