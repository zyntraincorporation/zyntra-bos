import {
  collection, addDoc, getDocs, onSnapshot,
  query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Investment } from '@/types';

const COL = 'investments';

export const investmentsRef = () => collection(db, COL);

export const addInvestment = (data: Omit<Investment, 'id' | 'createdAt'>) =>
  addDoc(investmentsRef(), { ...data, createdAt: serverTimestamp() });

export const getInvestments = async (): Promise<Investment[]> => {
  const snap = await getDocs(query(investmentsRef(), orderBy('date', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Investment));
};

export const subscribeInvestments = (cb: (investments: Investment[]) => void) =>
  onSnapshot(query(investmentsRef(), orderBy('date', 'desc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Investment)));
  });
