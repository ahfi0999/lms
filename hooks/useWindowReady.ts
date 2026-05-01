import { useState, useEffect } from 'react';

function useWindowReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

export { useWindowReady };
