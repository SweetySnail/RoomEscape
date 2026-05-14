// src/services/productService.js
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

// 전체 상품 목록 불러오기
export const getAllProducts = async () => {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 상품 단건 불러오기
export const getProduct = async (productId) => {
  const docSnap = await getDoc(doc(db, 'products', productId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
};

// 상품 등록
export const createProduct = async (productData) => {
  const docRef = await addDoc(collection(db, 'products'), {
    ...productData,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

// 상품 수정
export const updateProduct = async (productId, data) => {
  await updateDoc(doc(db, 'products', productId), data);
};

// 상품 삭제
export const deleteProduct = async (productId) => {
  await deleteDoc(doc(db, 'products', productId));
};