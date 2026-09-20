/**
 * IndexedDB persistent storage utility for large items (e.g. uploaded images and full product catalog).
 * IndexedDB provides 500MB+ of safe, persistent storage in the browser without the 5MB quota limits of localStorage.
 */

import { Product } from '../types';

const DB_NAME = 'trackmaster_store_db';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'products_catalog';
const STORE_IMAGES = 'custom_images';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.warn('[IndexedDB] Failed to open database:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function idbSaveProducts(products: Product[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTS);
    
    // Clear and put all
    store.clear();
    for (const p of products) {
      store.put(p);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error saving products:', err);
  }
}

export async function idbGetProducts(): Promise<Product[] | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_PRODUCTS, 'readonly');
    const store = tx.objectStore(STORE_PRODUCTS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const items = request.result as Product[];
        if (Array.isArray(items) && items.length > 0) {
          resolve(items);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    return null;
  }
}

export async function idbSaveSingleProduct(product: Product): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTS);
    store.put(product);
  } catch (err) {
    console.warn('[IndexedDB] Error saving single product:', err);
  }
}

export async function idbDeleteSingleProduct(productId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTS);
    store.delete(productId);
  } catch (err) {
    console.warn('[IndexedDB] Error deleting product from idb:', err);
  }
}
