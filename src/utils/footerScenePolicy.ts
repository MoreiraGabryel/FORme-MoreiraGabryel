import {withFooterAdmissionLock} from './footerSceneAdmission';

export function isFooterSceneFullyVisible(
  rect: {top: number; bottom: number},
  viewportHeight: number,
) {
  return Number.isFinite(rect.top) && Number.isFinite(rect.bottom) &&
    Number.isFinite(viewportHeight) && viewportHeight > 0 &&
    rect.top <= 1 && rect.bottom >= viewportHeight - 1;
}

export const FOOTER_VISIT_STORAGE_KEY = 'moreiragabryel:footer-scene:v1';
export const FOOTER_MAX_VISITS = 2;

type VisitStorage = Pick<Storage, 'getItem' | 'setItem'>;
type VolatileVisits = {count: number; failed: boolean};
const volatileByStorage = new WeakMap<VisitStorage, VolatileVisits>();
const volatileWithoutStorage: VolatileVisits = {count: 0, failed: true};

export function createFooterVisitCounter(storage?: VisitStorage) {
  let memory = storage ? volatileByStorage.get(storage) : volatileWithoutStorage;
  if (!memory) {
    memory = {count: 0, failed: false};
    volatileByStorage.set(storage!, memory);
  }
  const state = memory;
  const read = () => {
    if (!storage || state.failed) return state.count;
    try {
      const raw = storage.getItem(FOOTER_VISIT_STORAGE_KEY);
      state.count = raw && /^(0|[1-9]\d*)$/.test(raw) ? Math.min(Number(raw), FOOTER_MAX_VISITS) : 0;
      return state.count;
    } catch {
      state.failed = true;
      return state.count;
    }
  };
  const commit = () => {
    const count = read();
    if (count >= FOOTER_MAX_VISITS) return false;
    state.count = count + 1;
    if (storage && !state.failed) {
      try {storage.setItem(FOOTER_VISIT_STORAGE_KEY, String(state.count));}
      catch {state.failed = true;}
    }
    return true;
  };
  return {
    read,
    async consume(signal?: AbortSignal, onCommitted?: () => void) {
      if (signal?.aborted) return false;
      read(); // Detect denied storage, retaining the last known count.
      // Denied storage can only provide a page-local limit, never a cross-tab guarantee.
      if (!storage || state.failed) {
        const admitted = commit();
        if (admitted) {
          try {onCommitted?.();} catch { /* An observer cannot retract committed ownership. */ }
        }
        return admitted;
      }
      // No safe cross-context coordinator means no persistent admission.
      return withFooterAdmissionLock(commit, signal, onCommitted);
    },
  };
}
