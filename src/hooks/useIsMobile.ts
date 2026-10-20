import {useEffect, useState} from 'react';
import {MOBILE_VIEWPORT_QUERY, readIsMobileViewport} from '../utils/mobileViewport';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(readIsMobileViewport);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    const update = () => setIsMobile(mediaQuery.matches);

    update();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update);
      return () => mediaQuery.removeEventListener('change', update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return isMobile;
}
