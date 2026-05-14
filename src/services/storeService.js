// src/services/storeService.js
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// 매장 전체 목록 불러오기
export const getAllStores = async () => {
  const snapshot = await getDocs(collection(db, 'stores'));
  const stores = [];
  for (const storeDoc of snapshot.docs) {
    const storeData = { id: storeDoc.id, ...storeDoc.data() };
    // 지점 서브컬렉션 불러오기
    const branchSnapshot = await getDocs(
      collection(db, 'stores', storeDoc.id, 'branches')
    );
    storeData.branches = [];
    for (const branchDoc of branchSnapshot.docs) {
      const branchData = { id: branchDoc.id, ...branchDoc.data() };
      // 테마 서브컬렉션 불러오기
      const themeSnapshot = await getDocs(
        collection(db, 'stores', storeDoc.id, 'branches', branchDoc.id, 'themes')
      );
      branchData.themes = themeSnapshot.docs.map(t => ({ id: t.id, ...t.data() }));
      storeData.branches.push(branchData);
    }
    stores.push(storeData);
  }
  return stores;
};

// 매장 단건 불러오기
export const getStore = async (storeId) => {
  const storeDoc = await getDoc(doc(db, 'stores', storeId));
  if (!storeDoc.exists()) return null;
  return { id: storeDoc.id, ...storeDoc.data() };
};

// 매장 등록
export const createStore = async (storeData) => {
  const { branches, ...rest } = storeData;
  const storeRef = await addDoc(collection(db, 'stores'), {
    ...rest,
    createdAt: new Date().toISOString(),
  });
  // 지점 + 테마 저장
  if (branches?.length) {
    for (const branch of branches) {
      const { themes, ...branchRest } = branch;
      const branchRef = await addDoc(
        collection(db, 'stores', storeRef.id, 'branches'),
        branchRest
      );
      if (themes?.length) {
        for (const theme of themes) {
          await addDoc(
            collection(db, 'stores', storeRef.id, 'branches', branchRef.id, 'themes'),
            theme
          );
        }
      }
    }
  }
  return storeRef.id;
};

// 매장 기본 정보 수정 (수수료율, 계약일 등)
export const updateStore = async (storeId, data) => {
  await updateDoc(doc(db, 'stores', storeId), data);
};

// 지점 추가
export const addBranch = async (storeId, branchData) => {
  const { themes, ...rest } = branchData;
  const branchRef = await addDoc(
    collection(db, 'stores', storeId, 'branches'),
    rest
  );
  if (themes?.length) {
    for (const theme of themes) {
      await addDoc(
        collection(db, 'stores', storeId, 'branches', branchRef.id, 'themes'),
        theme
      );
    }
  }
  return branchRef.id;
};

// 테마 추가
export const addTheme = async (storeId, branchId, themeData) => {
  const themeRef = await addDoc(
    collection(db, 'stores', storeId, 'branches', branchId, 'themes'),
    themeData
  );
  return themeRef.id;
};

// 테마 수정
export const updateTheme = async (storeId, branchId, themeId, data) => {
  await updateDoc(
    doc(db, 'stores', storeId, 'branches', branchId, 'themes', themeId),
    data
  );
};

// 테마 삭제
export const deleteTheme = async (storeId, branchId, themeId) => {
  await deleteDoc(
    doc(db, 'stores', storeId, 'branches', branchId, 'themes', themeId)
  );
};