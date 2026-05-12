import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserData } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('loggedInUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await getUserData(firebaseUser.uid);
          const fullUser = { uid: firebaseUser.uid, ...userData };
          setUser(fullUser);
          sessionStorage.setItem('loggedInUser', JSON.stringify(fullUser));
        } catch (error) {
          console.error('유저 데이터 불러오기 실패:', error);
          setUser(null);
          sessionStorage.removeItem('loggedInUser');
        }
      } else {
        setUser(null);
        sessionStorage.removeItem('loggedInUser');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};