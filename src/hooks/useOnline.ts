import { useState, useEffect } from 'react';

export function useOnline() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      return window.navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
