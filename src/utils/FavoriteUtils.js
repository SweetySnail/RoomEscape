import { toggleFavoriteFirestore } from '../services/favoriteService';

// 즐겨찾기 여부 확인 (동기 - localStorage 기반 초기 렌더용)
export const isFavorite = (productId) => {
  const favorites = JSON.parse(localStorage.getItem('favoriteThemes') || '[]');
  return favorites.some(f => f.id === productId);
};

// 즐겨찾기 토글 (비동기 - Firestore 우선)
export const toggleFavorite = async (product) => {
  const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');

  // 로그인한 경우 Firestore 사용
  if (loggedInUser?.uid) {
    return await toggleFavoriteFirestore(loggedInUser.uid, product);
  }

  // 비로그인 시 localStorage 사용
  const favorites = JSON.parse(localStorage.getItem('favoriteThemes') || '[]');
  const exists = favorites.some(f => f.id === product.id);
  let updated;
  if (exists) {
    updated = favorites.filter(f => f.id !== product.id);
  } else {
    updated = [...favorites, {
      id: product.id,
      title: product.title,
      theme: product.theme,
      imageUrl: product.imageUrl,
      location: product.location,
      rating: product.rating,
      reviewCount: product.reviewCount,
    }];
  }
  localStorage.setItem('favoriteThemes', JSON.stringify(updated));
  return !exists;
};