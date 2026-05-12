import {
  doc,
  updateDoc,
  increment,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

// 포인트 적립
export const addPoints = async (uid, amount, reason) => {
  await updateDoc(doc(db, 'users', uid), {
    points: increment(amount),
  });

  await addDoc(collection(db, 'pointHistory'), {
    uid,
    type: 'earn',
    amount,
    reason,
    date: new Date().toISOString(),
  });
};

// 포인트 사용
export const spendPoints = async (uid, amount, reason) => {
  await updateDoc(doc(db, 'users', uid), {
    points: increment(-amount),
  });

  await addDoc(collection(db, 'pointHistory'), {
    uid,
    type: 'use',
    amount,
    reason,
    date: new Date().toISOString(),
  });
};

// 포인트 히스토리 불러오기
export const getPointHistory = async (uid) => {
  const q = query(
    collection(db, 'pointHistory'),
    where('uid', '==', uid),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};