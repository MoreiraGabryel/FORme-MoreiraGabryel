// IndexedDB readwrite transactions with overlapping scope are exclusive across
// connections, including on HTTP LAN origins where Web Locks are unavailable.
// This store is ONLY a mutex: the existing localStorage key remains the budget.
const DATABASE = 'moreiragabryel:footer-scene-admission:v1';
const STORE = 'mutex';

export function withFooterAdmissionLock(commit: () => boolean, signal?: AbortSignal, onCommitted?: () => void): Promise<boolean> {
  return new Promise(resolve => {
    if (signal?.aborted || typeof indexedDB === 'undefined') {resolve(false);return;}
    let database: IDBDatabase | undefined;
    let transaction: IDBTransaction | undefined;
    let settled = false;
    let admitted = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', abort);
      database?.close();
      // The mutex cannot roll back a budget already committed to localStorage.
      resolve(admitted || result);
    };
    const abort = () => {
      try {transaction?.abort();} catch { /* Already completed or aborted. */ }
      finish(false);
    };
    signal?.addEventListener('abort', abort, {once: true});
    try {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => {request.result.createObjectStore(STORE);};
      request.onerror = () => finish(false);
      request.onblocked = () => finish(false);
      request.onsuccess = () => {
        database = request.result;
        if (settled || signal?.aborted) {database.close();finish(false);return;}
        database.onversionchange = () => {abort();};
        try {
          transaction = database.transaction(STORE, 'readwrite');
          transaction.oncomplete = () => finish(admitted);
          transaction.onabort = () => finish(false);
          transaction.onerror = () => finish(false);
          const admission = transaction.objectStore(STORE).get('admission');
          admission.onsuccess = () => {
            if (settled || signal?.aborted) {abort();return;}
            // Never await here: this synchronous read/check/write runs while
            // the readwrite transaction exclusively owns the shared store.
            try {admitted = commit();} catch {abort();}
            if (admitted) {
              try {onCommitted?.();} catch { /* An observer cannot retract committed ownership. */ }
            }
          };
        } catch {finish(false);}
      };
    } catch {finish(false);}
  });
}
