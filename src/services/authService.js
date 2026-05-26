import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
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

// ===== 소셜 로그인 공통 처리 =====
// 구글/카카오 등 소셜 로그인 후 Firestore 유저 문서 생성 or 기존 반환
const handleSocialLogin = async (user, nickname) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // 첫 소셜 로그인 → 신규 유저 생성
    const finalNickname = nickname || user.displayName || `탈출러${Math.floor(Math.random()*9000)+1000}`;
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      nickname: finalNickname,
      gender: '',
      birth: '',
      isAdmin: false,
      adminRole: null,
      managedStores: [],
      points: 500,
      createdAt: new Date().toISOString(),
      provider: user.providerData[0]?.providerId || 'social',
    });
    await addDoc(collection(db, 'pointHistory'), {
      uid: user.uid,
      type: 'earn',
      amount: 500,
      reason: '🎉 신규가입 축하 포인트',
      date: new Date().toISOString(),
      balance: 500,
    });
    return { uid: user.uid, ...(await getDoc(userRef)).data() };
  }

  // 기존 유저 → 그냥 반환
  return { uid: user.uid, ...userSnap.data() };
};

// ===== 구글 로그인 (팝업 방식) =====
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return handleSocialLogin(result.user);
};

// ===== 회원가입 (일반 유저) =====
export const signUp = async ({ email, password, nickname }) => {
  const reserved = ['👑 총관리자 👑', '총관리자', 'superadmin', 'SUPERADMIN'];
  if (reserved.some(r => nickname.trim() === r)) {
    throw new Error('사용할 수 없는 닉네임이에요.');
  }
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
    provider: 'email',
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

// ===== 로그인 (이메일) =====
export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) throw new Error('유저 정보를 찾을 수 없어요.');

  return { uid: user.uid, ...userDoc.data() };
};

// ===== 로그아웃 =====
export const logOut = async () => {
  await signOut(auth);
};

// ===== 유저 정보 불러오기 =====
export const getUserData = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return userDoc.data();
};

// ===== 닉네임 변경 =====
export const updateNickname = async (uid, nickname) => {
  await updateDoc(doc(db, 'users', uid), { nickname });
  await updateProfile(auth.currentUser, { displayName: nickname });
};

// ===== 유저 정보 업데이트 =====
export const updateUserData = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), data);
};

// ===== 매장관리자 계정 생성 =====
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

// ===== 첫 로그인 비밀번호 변경 =====
export const changeInitialPassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
  await updateDoc(doc(db, 'users', user.uid), { passwordChanged: true });
};