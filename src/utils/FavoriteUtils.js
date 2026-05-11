// 즐겨찾기 목록 불러오기
export const getFavorites = () => {
  return JSON.parse(localStorage.getItem('favoriteThemes') || '[]');
};

// 즐겨찾기 여부 확인
export const isFavorite = (productId) => {
  const favorites = getFavorites();
  return favorites.some(f => f.id === productId);
};

// 즐겨찾기 추가/제거 토글
export const toggleFavorite = (product) => {
  const favorites = getFavorites();
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
  return !exists; // true면 추가됨, false면 제거됨
};