import {
  collection, addDoc, deleteDoc, doc,
  getDocs, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Expense } from '@/types';

const COL = 'expenses';

export const expensesRef = () => collection(db, COL);

export const addExpense = (data: Omit<Expense, 'id' | 'createdAt'>) =>
  addDoc(expensesRef(), { ...data, createdAt: serverTimestamp() });

export const deleteExpense = (id: string) =>
  deleteDoc(doc(db, COL, id));

export const getExpenses = async (): Promise<Expense[]> => {
  const snap = await getDocs(query(expensesRef(), orderBy('date', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
};

export const subscribeExpenses = (cb: (expenses: Expense[]) => void) =>
  onSnapshot(query(expensesRef(), orderBy('date', 'desc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
  });
