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
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// 회원가입
export const signUp = async ({ username, password, email, nickname, gender, birth }) => {
  // Firebase Auth로 계정 생성
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 닉네임 설정
  await updateProfile(user, { displayName: nickname });

  // Firestore에 추가 정보 저장
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    username,
    email,
    nickname,
    gender: gender || '',
    birth: birth || '',
    isAdmin: false,
    adminRole: null,
    managedStores: [],
    points: 0,
    createdAt: new Date().toISOString(),
  });

  return user;
};

// 로그인
export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Firestore에서 추가 정보 불러오기
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