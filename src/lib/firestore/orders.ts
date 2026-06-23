import {
  collection, addDoc, updateDoc, doc,
  getDocs, onSnapshot, query, orderBy,
  where, serverTimestamp, limit, runTransaction,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, OrderStatus } from '@/types';

const COL     = 'orders';
const META_DOC = () => doc(db, 'settings', 'orderCounter');

export const ordersRef = () => collection(db, COL);

export const addOrder = (data: Omit<Order, 'id' | 'createdAt'>) =>
  addDoc(ordersRef(), { ...data, createdAt: serverTimestamp() });

export const updateOrder = (id: string, data: Partial<Order>) =>
  updateDoc(doc(db, COL, id), data);

export const updateOrderStatus = (id: string, status: OrderStatus) =>
  updateDoc(doc(db, COL, id), { status });

export const getOrders = async (max: number = 100): Promise<Order[]> => {
  const snap = await getDocs(query(ordersRef(), orderBy('createdAt', 'desc'), limit(max)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
};

export const subscribeOrders = (cb: (orders: Order[]) => void, max: number = 100) =>
  onSnapshot(query(ordersRef(), orderBy('createdAt', 'desc'), limit(max)), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
  });

export const subscribeOrdersByStatus = (status: OrderStatus, cb: (orders: Order[]) => void, max: number = 100) =>
  onSnapshot(
    query(ordersRef(), where('status', '==', status), orderBy('createdAt', 'desc'), limit(max)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)))
  );

/**
 * Generate next order ID like PSL-2026-001.
 * Uses a Firestore counter document to avoid a full collection scan.
 */
export const generateOrderId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const counterRef = META_DOC();

  try {
    let nextCount = 1;
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const data = snap.data();
      // Reset counter if year changed
      if (data?.year !== year) {
        nextCount = 1;
        tx.set(counterRef, { year, count: 1 });
      } else {
        nextCount = (data.count ?? 0) + 1;
        tx.update(counterRef, { count: nextCount });
      }
    });
    return `PSL-${year}-${String(nextCount).padStart(3, '0')}`;
  } catch {
    // Fallback: timestamp-based ID
    return `PSL-${year}-${Date.now().toString().slice(-4)}`;
  }
};
