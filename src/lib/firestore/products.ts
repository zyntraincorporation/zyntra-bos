import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, onSnapshot, query, orderBy,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/types';

const COL = 'products';

export const productsRef = () => collection(db, COL);

export const addProduct = (data: Omit<Product, 'id' | 'createdAt'>) =>
  addDoc(productsRef(), { ...data, createdAt: serverTimestamp() });

export const updateProduct = (id: string, data: Partial<Product>) =>
  updateDoc(doc(db, COL, id), data);

export const deleteProduct = (id: string) =>
  deleteDoc(doc(db, COL, id));

export const adjustStock = (id: string, delta: number) =>
  updateDoc(doc(db, COL, id), { stock: delta });

export const getProducts = async (): Promise<Product[]> => {
  const snap = await getDocs(query(productsRef(), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
};

export const subscribeProducts = (cb: (products: Product[]) => void) =>
  onSnapshot(query(productsRef(), orderBy('createdAt', 'desc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
  });
