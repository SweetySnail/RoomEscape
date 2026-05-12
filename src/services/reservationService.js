import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
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

// 특정 테마의 특정 날짜 예약된 시간 불러오기
export const getBookedTimes = async (productId, date) => {
  const q = query(
    collection(db, 'reservations'),
    where('productId', '==', productId),
    where('date', '==', date),
    where('cancelled', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().time);
};

// 예약 결과 업데이트 (성공/실패 + 탈출 시간)
export const updateReservationResult = async (id, updateData) => {
  await updateDoc(doc(db, 'reservations', id), updateData);
};

// 리뷰 완료 표시
export const markAsReviewed = async (reservationId) => {
  await updateDoc(doc(db, 'reservations', reservationId), {
    reviewed: true,
  });
};

// 예약 취소
export const cancelReservation = async (id, refundInfo) => {
  await updateDoc(doc(db, 'reservations', id), {
    cancelled: true,
    ...refundInfo,
  });
};