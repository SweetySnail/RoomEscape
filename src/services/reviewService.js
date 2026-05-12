import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

// 리뷰 추가
export const addReview = async (review) => {
  const docRef = await addDoc(collection(db, 'reviews'), {
    ...review,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

// 테마별 리뷰 불러오기
export const getReviewsByProduct = async (productId) => {
  const q = query(
    collection(db, 'reviews'),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 전체 리뷰 불러오기 (Admin용)
export const getAllReviews = async () => {
  const q = query(
    collection(db, 'reviews'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 내 리뷰 불러오기
export const getMyReviews = async (uid) => {
  const q = query(
    collection(db, 'reviews'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};