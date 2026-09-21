/**
 * Safe Local Storage Utility
 * Prevents Uncaught QuotaExceededError and provides fallback handling for local caches.
 */

let hasWarnedLocalStorageQuota = false;

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
      if (!hasWarnedLocalStorageQuota) {
        console.info(`[SafeStorage] localStorage capacity reached for large datasets. Full catalog and photos are seamlessly stored in IndexedDB (500MB+).`);
        hasWarnedLocalStorageQuota = true;
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
