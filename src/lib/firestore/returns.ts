import {
  collection, addDoc, getDocs, onSnapshot,
  query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Return } from '@/types';

const COL = 'returns';

export const returnsRef = () => collection(db, COL);

export const addReturn = (data: Omit<Return, 'id'>) =>
  addDoc(returnsRef(), { ...data });

export const getReturns = async (): Promise<Return[]> => {
  const snap = await getDocs(query(returnsRef(), orderBy('returnedAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Return));
};

export const subscribeReturns = (cb: (returns: Return[]) => void) =>
  onSnapshot(query(returnsRef(), orderBy('returnedAt', 'desc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Return)));
  });
