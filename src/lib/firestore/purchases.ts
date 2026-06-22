import {
  collection, addDoc, getDocs, onSnapshot,
  query, orderBy, serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Purchase } from '@/types';

const COL = 'purchases';

export const purchasesRef = () => collection(db, COL);

export const addPurchase = (data: Omit<Purchase, 'id' | 'createdAt'>) =>
  addDoc(purchasesRef(), { ...data, createdAt: serverTimestamp() });

export const getPurchases = async (): Promise<Purchase[]> => {
  const snap = await getDocs(query(purchasesRef(), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Purchase));
};

export const subscribePurchases = (cb: (purchases: Purchase[]) => void) =>
  onSnapshot(query(purchasesRef(), orderBy('createdAt', 'desc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Purchase)));
  });
