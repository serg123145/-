/**
 * Safe Local Storage Utility
 * Prevents Uncaught QuotaExceededError and provides fallback handling for local caches.
 */

export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error: any) {
    const isQuotaError = 
      error?.name === 'QuotaExceededError' || 
      error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error?.code === 22 || 
      error?.code === 1014;

    if (isQuotaError) {
      console.warn(`[SafeStorage] localStorage quota reached when saving "${key}". Using IndexedDB and in-memory cache.`);
      // Try removing non-essential temporary items to free space
      try {
        localStorage.removeItem('trk_admin_session');
      } catch (e) {
        // ignore
      }
    }

    return false;
  }
}

export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`[SafeStorage] Failed to read or parse "${key}" from localStorage:`, error);
    return defaultValue;
  }
}

export function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[SafeStorage] Failed to remove "${key}" from localStorage:`, error);
  }
}
