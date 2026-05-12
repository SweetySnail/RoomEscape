import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

// 예약 추가
export const addReservation = async (reservation) => {
  const docRef = await addDoc(collection(db, 'reservations'), {
    ...reservation,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

// 내 예약 목록 불러오기
export const getMyReservations = async (uid) => {
  const q = query(
    collection(db, 'reservations'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 전체 예약 목록 불러오기 (Admin용)
export const getAllReservations = async () => {
  const q = query(
    collection(db, 'reservations'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 예약 결과 업데이트 (성공/실패)
export const updateReservationResult = async (id, success) => {
  await updateDoc(doc(db, 'reservations', id), { success });
};

// 예약 취소
export const cancelReservation = async (id, refundInfo) => {
  await updateDoc(doc(db, 'reservations', id), {
    cancelled: true,
    ...refundInfo,
  });
};