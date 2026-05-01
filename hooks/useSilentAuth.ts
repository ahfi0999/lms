import { useCallback, useEffect, useState } from 'react';

function useSilentAuth() {
  const [trigger, setTrigger] = useState(false);
  // const router = useRouter();

  const silentAuth = useCallback(() => {
    setTrigger(true);
  }, []);

  useEffect(() => {
    if (!trigger) {
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = '/api/auth/update-session';
    iframe.onload = () => {
      setTrigger(false);
      window.location.reload();
      // router.push(router.asPath);
    };
    document.body.appendChild(iframe);
  }, [trigger]);

  return silentAuth;
}

export default useSilentAuth;
