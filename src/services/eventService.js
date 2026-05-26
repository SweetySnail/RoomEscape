// src/services/eventService.js
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

const COL = 'events';

// 전체 이벤트 (관리자용)
export const getAllEvents = async () => {
  const snapshot = await getDocs(
    query(collection(db, COL), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// 특정 매장 이벤트 (매장관리자용)
export const getEventsByStore = async (storeId) => {
  const snapshot = await getDocs(
    query(collection(db, COL), where('storeId', '==', storeId), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// 활성 이벤트 (일반 사용자용 — 오늘 날짜 기준)
export const getActiveEvents = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const snapshot = await getDocs(
    query(collection(db, COL), where('isActive', '==', true))
  );
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(e => e.startDate <= today && e.endDate >= today);
};

// 이벤트 단건 조회
export const getEvent = async (eventId) => {
  const docSnap = await getDoc(doc(db, COL, eventId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
};

// 이벤트 생성
export const createEvent = async (eventData) => {
  const docRef = await addDoc(collection(db, COL), {
    ...eventData,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

// 이벤트 수정
export const updateEvent = async (eventId, data) => {
  await updateDoc(doc(db, COL, eventId), data);
};

// 이벤트 삭제
export const deleteEvent = async (eventId) => {
  await deleteDoc(doc(db, COL, eventId));
};