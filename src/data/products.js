const productsData = [
  {
    id: 1,
    title: '공포의 지하실',
    rating: 4.5,
    reviewCount: 120,
    theme: '공포/스릴러',
    location: '강남', // ⭐⭐⭐ 새로 추가! ⭐⭐⭐
    availableTimes: ['오전 (9-12시)', '오후 (12-18시)'], // ⭐⭐⭐ 새로 추가! ⭐⭐⭐
    // ... 다른 속성들 ...
  },
  {
    id: 2,
    title: '마법사의 오두막',
    rating: 3.8,
    reviewCount: 90,
    theme: '판타지/어드벤처',
    location: '홍대', // ⭐⭐⭐ 새로 추가! ⭐⭐⭐
    availableTimes: ['오후 (12-18시)'], // ⭐⭐⭐ 새로 추가! ⭐⭐⭐
    // ... 다른 속성들 ...
  },
  {
    id: 3,
    title: '미스터리 연구소',
    rating: 4.2,
    reviewCount: 150,
    theme: '추리/미스터리',
    location: '강남', // ⭐⭐⭐ 새로 추가! ⭐⭐⭐
    availableTimes: ['저녁 (18-22시)'], // ⭐⭐⭐ 새로 추가! ⭐⭐⭐
  },
  {
    id: 4,
    title: '우주선 탈출 대작전',
    rating: 4.7,
    reviewCount: 200,
    theme: 'SF/미래',
    location: '건대', // ⭐⭐⭐ 새로 추가! ⭐⭐⭐
    availableTimes: ['오전 (9-12시)', '저녁 (18-22시)'], // ⭐⭐⭐ 새로 추가! ⭐⭐⭐
  },
  // ... 나머지 상품들도 location, availableTimes, theme 추가 ...
];

export default productsData;