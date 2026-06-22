import {
  collection, addDoc, updateDoc, doc,
  getDocs, onSnapshot, query, orderBy,
  where, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, OrderStatus } from '@/types';

const COL = 'orders';

export const ordersRef = () => collection(db, COL);

export const addOrder = (data: Omit<Order, 'id' | 'createdAt'>) =>
  addDoc(ordersRef(), { ...data, createdAt: serverTimestamp() });

export const updateOrder = (id: string, data: Partial<Order>) =>
  updateDoc(doc(db, COL, id), data);

export const updateOrderStatus = (id: string, status: OrderStatus) =>
  updateDoc(doc(db, COL, id), { status });

export const getOrders = async (): Promise<Order[]> => {
  const snap = await getDocs(query(ordersRef(), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
};

export const subscribeOrders = (cb: (orders: Order[]) => void) =>
  onSnapshot(query(ordersRef(), orderBy('createdAt', 'desc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
  });

export const subscribeOrdersByStatus = (status: OrderStatus, cb: (orders: Order[]) => void) =>
  onSnapshot(
    query(ordersRef(), where('status', '==', status), orderBy('createdAt', 'desc')),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)))
  );

/** Generate next order ID like PSL-2026-001 */
export const generateOrderId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const snap = await getDocs(ordersRef());
  const count = snap.size + 1;
  return `PSL-${year}-${String(count).padStart(3, '0')}`;
};
