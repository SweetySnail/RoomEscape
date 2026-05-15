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
  const productId = String(product.id);
  const favoriteId = `${uid}_${productId}`;
  await setDoc(doc(db, 'favorites', favoriteId), {
    uid,
    productId,
    title: product.title,
    genre: product.genre || product.theme || '',
    imageUrl: product.imageUrl || '',
    address: product.address || '',
    branch: product.branch || '',
    rating: product.rating || 0,
    reviewCount: product.reviewCount || 0,
    createdAt: new Date().toISOString(),
  });
};

// 즐겨찾기 제거
export const removeFavorite = async (uid, productId) => {
  const favoriteId = `${uid}_${String(productId)}`;
  await deleteDoc(doc(db, 'favorites', favoriteId));
};

// 즐겨찾기 여부 확인
export const checkIsFavorite = async (uid, productId) => {
  const favoriteId = `${uid}_${String(productId)}`;
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
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// 즐겨찾기 토글
export const toggleFavoriteFirestore = async (uid, product) => {
  const productId = String(product.id);
  const isFav = await checkIsFavorite(uid, productId);
  if (isFav) {
    await removeFavorite(uid, productId);
    return false;
  } else {
    await addFavorite(uid, product);
    return true;
  }
};