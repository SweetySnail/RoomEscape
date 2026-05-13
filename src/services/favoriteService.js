import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  collection,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

// 즐겨찾기 추가
export const addFavorite = async (uid, product) => {
  const favoriteId = `${uid}_${product.id}`;
  await setDoc(doc(db, 'favorites', favoriteId), {
    uid,
    productId: product.id,
    title: product.title,
    theme: product.theme,
    imageUrl: product.imageUrl,
    location: product.location,
    rating: product.rating,
    reviewCount: product.reviewCount,
    branch: product.branch || '',
    createdAt: new Date().toISOString(),
  });
};

// 즐겨찾기 제거
export const removeFavorite = async (uid, productId) => {
  const favoriteId = `${uid}_${productId}`;
  await deleteDoc(doc(db, 'favorites', favoriteId));
};

// 즐겨찾기 여부 확인
export const checkIsFavorite = async (uid, productId) => {
  const favoriteId = `${uid}_${productId}`;
  const docSnap = await getDoc(doc(db, 'favorites', favoriteId));
  return docSnap.exists();
};

// 내 즐겨찾기 목록 불러오기
export const getMyFavorites = async (uid) => {
  const q = query(
    collection(db, 'favorites'),
    where('uid', '==', uid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 즐겨찾기 토글
export const toggleFavoriteFirestore = async (uid, product) => {
  const isFav = await checkIsFavorite(uid, product.id);
  if (isFav) {
    await removeFavorite(uid, product.id);
    return false;
  } else {
    await addFavorite(uid, product);
    return true;
  }
};