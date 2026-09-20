import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Product, OrderDetails, StoreInfo, NotificationSettings } from '../types';

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
  onError?: (err: Error) => void
) {
  if (!isFirebaseConfigured) return () => {};

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
      console.error('[Firestore] Error subscribing to products:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  if (!isFirebaseConfigured) return;
  const docRef = doc(db, 'products', product.id);
  const data = cleanForFirestore(product);
  await setDoc(docRef, data, { merge: true });
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  const docRef = doc(db, 'products', productId);
  await deleteDoc(docRef);
}

export async function seedProductsIfEmpty(defaultProducts: Product[]): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const colRef = collection(db, 'products');
    const snap = await getDocs(colRef);
    if (snap.empty && defaultProducts.length > 0) {
      console.log('[Firestore] Seeding initial products catalog...');
      const batch = writeBatch(db);
      for (const p of defaultProducts) {
        const docRef = doc(db, 'products', p.id);
        batch.set(docRef, cleanForFirestore(p));
      }
      await batch.commit();
      console.log('[Firestore] Initial products seeded successfully.');
      return true;
    }
  } catch (e) {
    console.error('[Firestore] Failed to seed products:', e);
  }
  return false;
}

export async function resetCatalogInFirestore(defaultProducts: Product[]): Promise<void> {
  if (!isFirebaseConfigured) return;
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
}

// ----------------------
// ORDERS
// ----------------------

export function subscribeToOrders(
  onData: (orders: OrderDetails[]) => void,
  onError?: (err: Error) => void
) {
  if (!isFirebaseConfigured) return () => {};

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
      // If index is missing for orderBy, fallback to unordered listener
      console.warn('[Firestore] Ordered query failed, falling back to basic query:', error);
      return onSnapshot(
        colRef,
        (fallbackSnap) => {
          const items: OrderDetails[] = [];
          fallbackSnap.forEach((docSnap) => {
            items.push({ orderId: docSnap.id, ...(docSnap.data() as Omit<OrderDetails, 'orderId'>) });
          });
          items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          onData(items);
        },
        onError
      );
    }
  );
}

export async function saveOrderToFirestore(order: OrderDetails): Promise<void> {
  if (!isFirebaseConfigured) return;
  const docRef = doc(db, 'orders', order.orderId);
  const data = cleanForFirestore(order);
  await setDoc(docRef, data, { merge: true });
}

export async function updateOrderStatusInFirestore(orderId: string, status: OrderDetails['status']): Promise<void> {
  if (!isFirebaseConfigured) return;
  const docRef = doc(db, 'orders', orderId);
  await setDoc(docRef, { status }, { merge: true });
}

export async function updateOrderTrackingInFirestore(orderId: string, trackingNumber: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  const docRef = doc(db, 'orders', orderId);
  await setDoc(docRef, { trackingNumber }, { merge: true });
}

export async function updateOrderNotesInFirestore(orderId: string, internalNotes: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  const docRef = doc(db, 'orders', orderId);
  await setDoc(docRef, { internalNotes }, { merge: true });
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  const docRef = doc(db, 'orders', orderId);
  await deleteDoc(docRef);
}

export async function clearAllOrdersInFirestore(): Promise<void> {
  if (!isFirebaseConfigured) return;
  const colRef = collection(db, 'orders');
  const snap = await getDocs(colRef);
  const batch = writeBatch(db);
  snap.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}

// ----------------------
// STORE INFO & BRANDING
// ----------------------

export function subscribeToStoreInfo(
  onData: (info: StoreInfo) => void,
  onError?: (err: Error) => void
) {
  if (!isFirebaseConfigured) return () => {};

  const docRef = doc(db, 'store_info', 'main');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as StoreInfo);
      }
    },
    (error) => {
      console.error('[Firestore] Error subscribing to store info:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveStoreInfoToFirestore(info: StoreInfo): Promise<void> {
  if (!isFirebaseConfigured) return;
  const docRef = doc(db, 'store_info', 'main');
  await setDoc(docRef, cleanForFirestore(info), { merge: true });
}

export async function seedStoreInfoIfEmpty(defaultStoreInfo: StoreInfo): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, 'store_info', 'main');
    const snap = await getDocs(collection(db, 'store_info'));
    if (snap.empty) {
      console.log('[Firestore] Seeding default store info...');
      await setDoc(docRef, cleanForFirestore(defaultStoreInfo));
    }
  } catch (e) {
    console.error('[Firestore] Failed to seed store info:', e);
  }
}

// ----------------------
// NOTIFICATION SETTINGS
// ----------------------

export function subscribeToNotificationSettings(
  onData: (settings: NotificationSettings) => void,
  onError?: (err: Error) => void
) {
  if (!isFirebaseConfigured) return () => {};

  const docRef = doc(db, 'store_info', 'notifications');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as NotificationSettings);
      }
    },
    (error) => {
      console.error('[Firestore] Error subscribing to notification settings:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveNotificationSettingsToFirestore(settings: NotificationSettings): Promise<void> {
  if (!isFirebaseConfigured) return;
  const docRef = doc(db, 'store_info', 'notifications');
  await setDoc(docRef, cleanForFirestore(settings), { merge: true });
}

// ----------------------
// ADMIN PIN & SECURITY
// ----------------------

export function subscribeToAdminPin(
  onData: (pin: string) => void,
  onError?: (err: Error) => void
) {
  if (!isFirebaseConfigured) return () => {};

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
      console.error('[Firestore] Error subscribing to admin PIN:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveAdminPinToFirestore(pin: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  const docRef = doc(db, 'store_info', 'security');
  await setDoc(docRef, cleanForFirestore({ adminPin: pin.trim(), updatedAt: new Date().toISOString() }), { merge: true });
}
