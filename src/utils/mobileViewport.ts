// Keep JS scene ownership aligned with the mobile component styles, including landscape phones.
export const MOBILE_VIEWPORT_QUERY = '(max-width: 767.98px), (max-width: 1024px) and (hover: none) and (pointer: coarse)';

export function readIsMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
}
