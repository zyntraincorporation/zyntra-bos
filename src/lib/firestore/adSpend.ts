import {
  collection, addDoc, deleteDoc, doc,
  getDocs, onSnapshot, query, orderBy, serverTimestamp, limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdSpend } from '@/types';

const COL = 'adSpend';

export const adSpendRef = () => collection(db, COL);

export const addAdSpend = (data: Omit<AdSpend, 'id' | 'createdAt'>) =>
  addDoc(adSpendRef(), { ...data, createdAt: serverTimestamp() });

export const deleteAdSpend = (id: string) =>
  deleteDoc(doc(db, COL, id));

export const getAdSpend = async (max: number = 100): Promise<AdSpend[]> => {
  const snap = await getDocs(query(adSpendRef(), orderBy('date', 'desc'), limit(max)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdSpend));
};

export const subscribeAdSpend = (cb: (items: AdSpend[]) => void, max: number = 100) =>
  onSnapshot(query(adSpendRef(), orderBy('date', 'desc'), limit(max)), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdSpend)));
  });
