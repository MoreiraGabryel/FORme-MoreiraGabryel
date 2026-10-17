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
const PENDING_KEY = `${FOOTER_VISIT_STORAGE_KEY}:pending`;
const RESERVATION_LIFETIME_MS = 12000;
export type FooterPlaybackReservation = {confirm: () => Promise<boolean>; release: () => void};

type VisitStorage = Pick<Storage, 'getItem' | 'setItem'>;
type VolatileVisits = {count: number; failed: boolean; pending: Set<string>};
const volatileByStorage = new WeakMap<VisitStorage, VolatileVisits>();
const volatileWithoutStorage: VolatileVisits = {count: 0, failed: true, pending: new Set()};

export function createFooterVisitCounter(storage?: VisitStorage) {
  let memory = storage ? volatileByStorage.get(storage) : volatileWithoutStorage;
  if (!memory) {
    memory = {count: 0, failed: false, pending: new Set()};
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
    async reserve(signal: AbortSignal, onCommitted?: () => void): Promise<FooterPlaybackReservation | null> {
      if (signal.aborted || read() >= FOOTER_MAX_VISITS) return null;
      let persistent = Boolean(storage && !state.failed);
      const id = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
      let active = true;
      let granted = false;
      let confirmation: Promise<boolean> | undefined;
      const readPending = (): {id: string; until: number}[] => {
        let stored: string | null;
        try {stored = storage!.getItem(PENDING_KEY);}
        catch (error) {state.failed = true;throw error;}
        const raw: unknown = JSON.parse(stored || '[]');
        return Array.isArray(raw) ? raw.filter(item => item && typeof item.id === 'string' &&
          Number.isFinite(item.until) && item.until > Date.now()) : [];
      };
      const writePending = (items: {id: string; until: number}[]) => {
        const stored = JSON.stringify(items);
        try {storage!.setItem(PENDING_KEY, stored);}
        catch (error) {state.failed = true;throw error;}
      };
      const release = () => {
        if (!active) return;
        active = false;
        signal.removeEventListener('abort', release);
        if (!granted) return;
        if (persistent) {
          void withFooterAdmissionLock(() => {writePending(readPending().filter(item => item.id !== id));return true;});
        } else state.pending.delete(id);
      };
      signal.addEventListener('abort', release, {once: true});
      if (persistent) {
        granted = await withFooterAdmissionLock(() => {
          if (!active || signal.aborted) return false;
          const pending = readPending();
          if (read() + pending.length >= FOOTER_MAX_VISITS || state.failed) return false;
          writePending([...pending, {id, until: Date.now() + RESERVATION_LIFETIME_MS}]);
          granted = true;
          return true;
        }, signal);
        if (!granted && state.failed && active && !signal.aborted) persistent = false;
      }
      if (!persistent && active && !signal.aborted && read() + state.pending.size < FOOTER_MAX_VISITS) {
        state.pending.add(id);
        granted = true;
      }
      if (!granted || !active || signal.aborted) {release();return null;}
      return {
        release,
        confirm() {
          if (confirmation) return confirmation;
          if (!active || signal.aborted) return Promise.resolve(false);
          const acknowledge = () => {
            active = false;
            granted = false;
            signal.removeEventListener('abort', release);
            try {onCommitted?.();} catch { /* Committed ownership cannot be rolled back by an observer. */ }
          };
          confirmation = persistent ? withFooterAdmissionLock(() => {
            if (!active || signal.aborted) return false;
            const pending = readPending();
            if (!pending.some(item => item.id === id) || !commit()) return false;
            // Count is already committed: cleanup failure can only retain a short lease.
            try {writePending(pending.filter(item => item.id !== id));} catch { /* Lease expires. */ }
            return true;
          }, signal, acknowledge) : Promise.resolve().then(() => {
            if (!active || signal.aborted || !state.pending.has(id)) return false;
            state.pending.delete(id);
            if (!commit()) return false;
            acknowledge();
            return true;
          });
          confirmation = confirmation.then(confirmed => {if (!confirmed) release();return confirmed;});
          return confirmation;
        },
      };
    },
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
