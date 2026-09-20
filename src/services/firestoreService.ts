import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch, 
  query, 
  orderBy,
  FirestoreError
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Product, OrderDetails, StoreInfo, NotificationSettings } from '../types';

export interface FirestoreStatus {
  isCloudConnected: boolean;
  isQuotaExceeded: boolean;
  isUnavailable: boolean;
  errorMessage?: string;
  upgradeUrl?: string;
}

const FIRESTORE_PROJECT_ID = 'gen-lang-client-0393846824';
const FIRESTORE_DB_ID = 'ai-studio-google-13d38afd-435c-44cd-857e-fb078325d070';
export const FIRESTORE_UPGRADE_URL = `https://console.firebase.google.com/project/${FIRESTORE_PROJECT_ID}/firestore/databases/${FIRESTORE_DB_ID}/data?openUpgradeDialog=true`;

export function isQuotaExceededError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    (error as FirestoreError).code === 'resource-exhausted'
  );
}

export function isUnavailableError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('unavailable') ||
    msg.includes('Could not reach Cloud Firestore') ||
    msg.includes('the client is offline') ||
    (error as FirestoreError).code === 'unavailable'
  );
}

// Track whether we've already logged a quota warning so we don't flood the console
let hasWarnedQuota = false;
let hasWarnedUnavailable = false;

function logFirestoreError(action: string, error: unknown) {
  if (isQuotaExceededError(error)) {
    if (!hasWarnedQuota) {
      console.warn(
        `[Firestore] Quota limit reached during "${action}". The application is seamlessly using local storage cache. To enable higher limits, upgrade at: ${FIRESTORE_UPGRADE_URL}`
      );
      hasWarnedQuota = true;
    }
  } else if (isUnavailableError(error)) {
    if (!hasWarnedUnavailable) {
      console.warn(`[Firestore] Cloud Firestore backend is temporarily unreachable during "${action}". Operating in offline mode with local storage cache.`);
      hasWarnedUnavailable = true;
    }
  } else {
    console.error(`[Firestore] Error during "${action}":`, error);
  }
}

// Helper to remove undefined properties which Firestore rejects
function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanForFirestore(value);
    }
  }
  return cleaned as T;
}

// ----------------------
// PRODUCTS
// ----------------------

export function subscribeToProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error, status?: FirestoreStatus) => void
) {
  if (!isFirebaseConfigured) return () => {};

  try {
    const colRef = collection(db, 'products');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: Product[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
        });
        onData(items);
      },
      (error) => {
        logFirestoreError('subscribeToProducts', error);
        if (onError) {
          onError(error, {
            isCloudConnected: false,
            isQuotaExceeded: isQuotaExceededError(error),
            isUnavailable: isUnavailableError(error),
            errorMessage: error.message,
            upgradeUrl: FIRESTORE_UPGRADE_URL
          });
        }
      }
    );
  } catch (e) {
    logFirestoreError('subscribeToProducts.init', e);
    if (onError && e instanceof Error) {
      onError(e, {
        isCloudConnected: false,
        isQuotaExceeded: isQuotaExceededError(e),
        isUnavailable: isUnavailableError(e),
        errorMessage: e.message,
        upgradeUrl: FIRESTORE_UPGRADE_URL
      });
    }
    return () => {};
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'products', product.id);
    const data = cleanForFirestore(product);
    await setDoc(docRef, data, { merge: true });
  } catch (e) {
    logFirestoreError('saveProductToFirestore', e);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (e) {
    logFirestoreError('deleteProductFromFirestore', e);
  }
}

export async function seedProductsIfEmpty(defaultProducts: Product[]): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const colRef = collection(db, 'products');
    const snap = await getDocs(colRef);
    if (snap.empty && defaultProducts.length > 0) {
      const batch = writeBatch(db);
      for (const p of defaultProducts) {
        const docRef = doc(db, 'products', p.id);
        batch.set(docRef, cleanForFirestore(p));
      }
      await batch.commit();
      return true;
    }
  } catch (e) {
    logFirestoreError('seedProductsIfEmpty', e);
  }
  return false;
}

export async function resetCatalogInFirestore(defaultProducts: Product[]): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const colRef = collection(db, 'products');
    const snap = await getDocs(colRef);
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    for (const p of defaultProducts) {
      const docRef = doc(db, 'products', p.id);
      batch.set(docRef, cleanForFirestore(p));
    }
    await batch.commit();
  } catch (e) {
    logFirestoreError('resetCatalogInFirestore', e);
  }
}

// ----------------------
// ORDERS
// ----------------------

export function subscribeToOrders(
  onData: (orders: OrderDetails[]) => void,
  onError?: (err: Error, status?: FirestoreStatus) => void
) {
  if (!isFirebaseConfigured) return () => {};

  try {
    const colRef = collection(db, 'orders');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const items: OrderDetails[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ orderId: docSnap.id, ...(docSnap.data() as Omit<OrderDetails, 'orderId'>) });
        });
        onData(items);
      },
      (error) => {
        logFirestoreError('subscribeToOrders', error);
        if (onError) {
          onError(error, {
            isCloudConnected: false,
            isQuotaExceeded: isQuotaExceededError(error),
            isUnavailable: isUnavailableError(error),
            errorMessage: error.message,
            upgradeUrl: FIRESTORE_UPGRADE_URL
          });
        }
      }
    );
  } catch (e) {
    logFirestoreError('subscribeToOrders.init', e);
    if (onError && e instanceof Error) {
      onError(e, {
        isCloudConnected: false,
        isQuotaExceeded: isQuotaExceededError(e),
        isUnavailable: isUnavailableError(e),
        errorMessage: e.message,
        upgradeUrl: FIRESTORE_UPGRADE_URL
      });
    }
    return () => {};
  }
}

export async function saveOrderToFirestore(order: OrderDetails): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'orders', order.orderId);
    const data = cleanForFirestore(order);
    await setDoc(docRef, data, { merge: true });
  } catch (e) {
    logFirestoreError('saveOrderToFirestore', e);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: OrderDetails['status']): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'orders', orderId);
    await setDoc(docRef, { status }, { merge: true });
  } catch (e) {
    logFirestoreError('updateOrderStatusInFirestore', e);
  }
}

export async function updateOrderTrackingInFirestore(orderId: string, trackingNumber: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'orders', orderId);
    await setDoc(docRef, { trackingNumber }, { merge: true });
  } catch (e) {
    logFirestoreError('updateOrderTrackingInFirestore', e);
  }
}

export async function updateOrderNotesInFirestore(orderId: string, internalNotes: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'orders', orderId);
    await setDoc(docRef, { internalNotes }, { merge: true });
  } catch (e) {
    logFirestoreError('updateOrderNotesInFirestore', e);
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'orders', orderId);
    await deleteDoc(docRef);
  } catch (e) {
    logFirestoreError('deleteOrderFromFirestore', e);
  }
}

export async function clearAllOrdersInFirestore(): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const colRef = collection(db, 'orders');
    const snap = await getDocs(colRef);
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (e) {
    logFirestoreError('clearAllOrdersInFirestore', e);
  }
}

// ----------------------
// STORE INFO & BRANDING
// ----------------------

export function subscribeToStoreInfo(
  onData: (info: StoreInfo) => void,
  onError?: (err: Error, status?: FirestoreStatus) => void
) {
  if (!isFirebaseConfigured) return () => {};

  try {
    const docRef = doc(db, 'store_info', 'main');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onData(docSnap.data() as StoreInfo);
        }
      },
      (error) => {
        logFirestoreError('subscribeToStoreInfo', error);
        if (onError) {
          onError(error, {
            isCloudConnected: false,
            isQuotaExceeded: isQuotaExceededError(error),
            isUnavailable: isUnavailableError(error),
            errorMessage: error.message,
            upgradeUrl: FIRESTORE_UPGRADE_URL
          });
        }
      }
    );
  } catch (e) {
    logFirestoreError('subscribeToStoreInfo.init', e);
    if (onError && e instanceof Error) {
      onError(e, {
        isCloudConnected: false,
        isQuotaExceeded: isQuotaExceededError(e),
        isUnavailable: isUnavailableError(e),
        errorMessage: e.message,
        upgradeUrl: FIRESTORE_UPGRADE_URL
      });
    }
    return () => {};
  }
}

export async function saveStoreInfoToFirestore(info: StoreInfo): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'store_info', 'main');
    await setDoc(docRef, cleanForFirestore(info), { merge: true });
  } catch (e) {
    logFirestoreError('saveStoreInfoToFirestore', e);
  }
}

export async function seedStoreInfoIfEmpty(defaultStoreInfo: StoreInfo): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'store_info', 'main');
    const snap = await getDocs(collection(db, 'store_info'));
    if (snap.empty) {
      await setDoc(docRef, cleanForFirestore(defaultStoreInfo));
    }
  } catch (e) {
    logFirestoreError('seedStoreInfoIfEmpty', e);
  }
}

// ----------------------
// NOTIFICATION SETTINGS
// ----------------------

export function subscribeToNotificationSettings(
  onData: (settings: NotificationSettings) => void,
  onError?: (err: Error, status?: FirestoreStatus) => void
) {
  if (!isFirebaseConfigured) return () => {};

  try {
    const docRef = doc(db, 'store_info', 'notifications');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onData(docSnap.data() as NotificationSettings);
        }
      },
      (error) => {
        logFirestoreError('subscribeToNotificationSettings', error);
        if (onError) {
          onError(error, {
            isCloudConnected: false,
            isQuotaExceeded: isQuotaExceededError(error),
            isUnavailable: isUnavailableError(error),
            errorMessage: error.message,
            upgradeUrl: FIRESTORE_UPGRADE_URL
          });
        }
      }
    );
  } catch (e) {
    logFirestoreError('subscribeToNotificationSettings.init', e);
    if (onError && e instanceof Error) {
      onError(e, {
        isCloudConnected: false,
        isQuotaExceeded: isQuotaExceededError(e),
        isUnavailable: isUnavailableError(e),
        errorMessage: e.message,
        upgradeUrl: FIRESTORE_UPGRADE_URL
      });
    }
    return () => {};
  }
}

export async function saveNotificationSettingsToFirestore(settings: NotificationSettings): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'store_info', 'notifications');
    await setDoc(docRef, cleanForFirestore(settings), { merge: true });
  } catch (e) {
    logFirestoreError('saveNotificationSettingsToFirestore', e);
  }
}

// ----------------------
// ADMIN PIN & SECURITY
// ----------------------

export function subscribeToAdminPin(
  onData: (pin: string) => void,
  onError?: (err: Error, status?: FirestoreStatus) => void
) {
  if (!isFirebaseConfigured) return () => {};

  try {
    const docRef = doc(db, 'store_info', 'security');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && typeof data.adminPin === 'string' && data.adminPin.trim().length >= 4) {
            onData(data.adminPin.trim());
          }
        }
      },
      (error) => {
        logFirestoreError('subscribeToAdminPin', error);
        if (onError) {
          onError(error, {
            isCloudConnected: false,
            isQuotaExceeded: isQuotaExceededError(error),
            isUnavailable: isUnavailableError(error),
            errorMessage: error.message,
            upgradeUrl: FIRESTORE_UPGRADE_URL
          });
        }
      }
    );
  } catch (e) {
    logFirestoreError('subscribeToAdminPin.init', e);
    if (onError && e instanceof Error) {
      onError(e, {
        isCloudConnected: false,
        isQuotaExceeded: isQuotaExceededError(e),
        isUnavailable: isUnavailableError(e),
        errorMessage: e.message,
        upgradeUrl: FIRESTORE_UPGRADE_URL
      });
    }
    return () => {};
  }
}

export async function saveAdminPinToFirestore(pin: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'store_info', 'security');
    await setDoc(docRef, cleanForFirestore({ adminPin: pin.trim(), updatedAt: new Date().toISOString() }), { merge: true });
  } catch (e) {
    logFirestoreError('saveAdminPinToFirestore', e);
  }
}
