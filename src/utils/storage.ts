/**
 * Safe Local Storage Utility
 * Prevents Uncaught QuotaExceededError and provides fallback handling for large objects.
 */

import { Product } from '../types';

/**
 * Strips heavy data: URLs from product catalog to ensure fallback caching in localStorage
 * never exceeds the browser's 5MB quota limit.
 */
function createLightweightProducts(products: Product[]): Product[] {
  return products.map(p => {
    // If imageUrl is a huge base64 data url (> 20KB), replace with placeholder or compact version in local fallback cache
    if (p.imageUrl && p.imageUrl.startsWith('data:') && p.imageUrl.length > 20000) {
      return {
        ...p,
        imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80'
      };
    }
    return p;
  });
}

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
      // Special compaction logic for product catalog: strip bulky base64 data URLs for local caching
      if (key === 'trk_products_catalog' && Array.isArray(value)) {
        try {
          const lightweight = createLightweightProducts(value);
          localStorage.setItem(key, JSON.stringify(lightweight));
          return true;
        } catch (secondaryError) {
          // Ignore - memory/Firestore state will keep the full catalog
        }
      }

      // If other keys fail, try removing older temporary items
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
