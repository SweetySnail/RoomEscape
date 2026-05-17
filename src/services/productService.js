// src/services/productService.js
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

// 전체 상품 목록 불러오기 (active인 것만)
export const getAllProducts = async () => {
  const snapshot = await getDocs(collection(db, 'products'));
  const today = new Date().toISOString().slice(0, 10);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => {
      if (p.active === false) return false;
      // 기간 한정 상품은 운영 기간 외엔 숨김
      if (p.isTemporary && p.operationEnd && p.operationEnd < today) return false;
      if (p.isTemporary && p.operationStart && p.operationStart > today) return false;
      return true;
    });
};

// 기간 한정 상품만 불러오기
export const getTemporaryProducts = async () => {
  const snapshot = await getDocs(collection(db, 'products'));
  const today = new Date().toISOString().slice(0, 10);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => {
      if (p.active === false) return false;
      if (!p.isTemporary) return false;
      if (p.operationEnd && p.operationEnd < today) return false;
      return true;
    })
    .sort((a, b) => {
      // D-Day 적게 남은 순 정렬
      const diffA = a.operationEnd ? new Date(a.operationEnd) - new Date() : 9999999999;
      const diffB = b.operationEnd ? new Date(b.operationEnd) - new Date() : 9999999999;
      return diffA - diffB;
    });
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