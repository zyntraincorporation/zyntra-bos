import {
  collection, addDoc, updateDoc, doc,
  getDocs, onSnapshot, query, orderBy,
  where, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer } from '@/types';

const COL = 'customers';

export const customersRef = () => collection(db, COL);

export const addCustomer = (data: Omit<Customer, 'id' | 'createdAt'>) =>
  addDoc(customersRef(), { ...data, createdAt: serverTimestamp() });

export const updateCustomer = (id: string, data: Partial<Customer>) =>
  updateDoc(doc(db, COL, id), data);

export const getCustomers = async (): Promise<Customer[]> => {
  const snap = await getDocs(query(customersRef(), orderBy('totalOrders', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
};

export const findCustomerByPhone = async (phone: string): Promise<Customer | null> => {
  const snap = await getDocs(query(customersRef(), where('phone', '==', phone)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Customer;
};

export const subscribeCustomers = (cb: (customers: Customer[]) => void) =>
  onSnapshot(query(customersRef(), orderBy('totalOrders', 'desc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
  });
