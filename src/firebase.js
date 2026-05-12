import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBi-R4m5tyc-FHpgOo2SXa9mMwOYXXt9b4",
  authDomain: "roomescape-80d4d.firebaseapp.com",
  projectId: "roomescape-80d4d",
  storageBucket: "roomescape-80d4d.firebasestorage.app",
  messagingSenderId: "717404686429",
  appId: "1:717404686429:web:8ea8871a2f73332adb25b4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);