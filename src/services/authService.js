import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// 회원가입
export const signUp = async ({ email, password, nickname }) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: nickname });

  // Firestore에 유저 정보 저장
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email,
    nickname,
    gender: '',
    birth: '',
    isAdmin: false,
    adminRole: null,
    managedStores: [],
    points: 500,          // ← 신규가입 500포인트 지급
    createdAt: new Date().toISOString(),
  });

  // 포인트 지급 히스토리 기록
  await addDoc(collection(db, 'pointHistory'), {
    uid: user.uid,
    type: 'earn',
    amount: 500,
    reason: '🎉 신규가입 축하 포인트',
    date: new Date().toISOString(),
    balance: 500,
  });

  return user;
};

// 로그인
export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) throw new Error('유저 정보를 찾을 수 없어요.');

  return { uid: user.uid, ...userDoc.data() };
};

// 로그아웃
export const logOut = async () => {
  await signOut(auth);
};

// 유저 정보 불러오기
export const getUserData = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return userDoc.data();
};

// 닉네임 변경
export const updateNickname = async (uid, nickname) => {
  await updateDoc(doc(db, 'users', uid), { nickname });
  await updateProfile(auth.currentUser, { displayName: nickname });
};

// 유저 정보 업데이트
export const updateUserData = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), data);
};