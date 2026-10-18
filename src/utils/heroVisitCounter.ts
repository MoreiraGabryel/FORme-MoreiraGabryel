export type HeroVisitCount = {previous: number; total: number};

let pageVisit: Promise<HeroVisitCount | null> | undefined;

// Page memory only: no visitor identity, cookies, storage or retry after an uncertain write.
export function countHeroVisitOnce() {
  return pageVisit ??= fetch('/api/visits', {
    method: 'POST', credentials: 'omit', cache: 'no-store', keepalive: true,
  }).then(async response => {
    if (!response.ok) return null;
    const value: HeroVisitCount = await response.json();
    if (!Number.isSafeInteger(value.previous) || value.previous < 0 ||
        !Number.isSafeInteger(value.total) || value.total !== value.previous + 1) return null;
    return {previous: value.previous, total: value.total};
  }).catch(() => null);
}
