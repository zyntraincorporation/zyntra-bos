import {
  collection, addDoc, deleteDoc, doc,
  getDocs, onSnapshot, query, orderBy, serverTimestamp, limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Expense } from '@/types';

const COL = 'expenses';

export const expensesRef = () => collection(db, COL);

export const addExpense = (data: Omit<Expense, 'id' | 'createdAt'>) =>
  addDoc(expensesRef(), { ...data, createdAt: serverTimestamp() });

export const deleteExpense = (id: string) =>
  deleteDoc(doc(db, COL, id));

export const getExpenses = async (max: number = 100): Promise<Expense[]> => {
  const snap = await getDocs(query(expensesRef(), orderBy('date', 'desc'), limit(max)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
};

export const subscribeExpenses = (cb: (expenses: Expense[]) => void, max: number = 100) =>
  onSnapshot(query(expensesRef(), orderBy('date', 'desc'), limit(max)), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
  });
