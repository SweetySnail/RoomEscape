// src/services/storeService.js
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // 추후 활성화
// import { storage } from '../firebase'; // 추후 활성화

// 테마 이미지 업로드 (추후 활성화)
// export const uploadThemeImage = async (file, storeId, themeName) => {
//   const ext = file.name.split('.').pop();
//   const path = `themes/${storeId}/${themeName}_${Date.now()}.${ext}`;
//   const storageRef = ref(storage, path);
//   await uploadBytes(storageRef, file);
//   return await getDownloadURL(storageRef);
// };

// 매장 전체 목록 불러오기
export const getAllStores = async () => {
  const snapshot = await getDocs(collection(db, 'stores'));
  const stores = [];
  for (const storeDoc of snapshot.docs) {
    const storeData = { id: storeDoc.id, ...storeDoc.data() };
    const branchSnapshot = await getDocs(
      collection(db, 'stores', storeDoc.id, 'branches')
    );
    storeData.branches = [];
    for (const branchDoc of branchSnapshot.docs) {
      const branchData = { id: branchDoc.id, ...branchDoc.data() };
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
  const storeData = { id: storeDoc.id, ...storeDoc.data() };
  const branchSnapshot = await getDocs(
    collection(db, 'stores', storeId, 'branches')
  );
  storeData.branches = [];
  for (const branchDoc of branchSnapshot.docs) {
    const branchData = { id: branchDoc.id, ...branchDoc.data() };
    const themeSnapshot = await getDocs(
      collection(db, 'stores', storeId, 'branches', branchDoc.id, 'themes')
    );
    branchData.themes = themeSnapshot.docs.map(t => ({ id: t.id, ...t.data() }));
    storeData.branches.push(branchData);
  }
  return storeData;
};

// 매장 등록
export const createStore = async (storeData) => {
  const { branches, ...rest } = storeData;
  const storeRef = await addDoc(collection(db, 'stores'), {
    ...rest,
    status: 'active',
    createdAt: new Date().toISOString(),
  });
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

// 매장 기본 정보 수정
export const updateStore = async (storeId, data) => {
  await updateDoc(doc(db, 'stores', storeId), data);
};

// 매장 계약 종료
export const deleteStore = async (storeId) => {
  await updateDoc(doc(db, 'stores', storeId), {
    status: 'expired',
    expiredAt: new Date().toISOString(),
  });
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