let requested = false;

/**
 * Ask the browser to keep this site's storage instead of evicting it (Safari
 * clears storage for sites not used in 7 days unless they are on the Home
 * Screen or granted persistence). Runs at most once per page load and never
 * throws; the answer is up to the browser.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (requested) return false;
  requested = true;
  try {
    const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
    if (!storage || typeof storage.persist !== 'function') return false;
    if (typeof storage.persisted === 'function' && (await storage.persisted())) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}

/** Test hook: allow another request in the same module instance. */
export function resetPersistRequestForTests(): void {
  requested = false;
}
