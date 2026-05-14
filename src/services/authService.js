import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// 회원가입 (일반 유저)
export const signUp = async ({ email, password, nickname }) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: nickname });

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email,
    nickname,
    gender: '',
    birth: '',
    isAdmin: false,
    adminRole: null,
    managedStores: [],
    points: 500,
    createdAt: new Date().toISOString(),
  });

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

// 매장관리자 계정 생성 (Vercel Serverless Function 호출)
export const createStoreAdminAccount = async ({ email, password, nickname, storeId }) => {
  const response = await fetch('/api/createStoreAdmin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nickname, storeId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '계정 생성 실패');
  return data.uid;
};

// 첫 로그인 비밀번호 변경
export const changeInitialPassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
  await updateDoc(doc(db, 'users', user.uid), { passwordChanged: true });
};