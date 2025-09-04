// src/products.js (총 100개의 방탈출 데이터 - 시/구 분할, 1시간 단위 시간)

const generateRandomData = () => {
  const themes = ['공포/스릴러', '판타지/어드벤처', '추리/미스터리', 'SF/미래', '감성/힐링', '코믹/병맛'];
  const cities = ['서울', '경기', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '제주'];
  const districtsMap = { // 각 도시에 해당하는 구들 (더미 데이터)
    '서울': ['강남구', '홍대구', '건대구', '신림구', '혜화구', '종로구', '마포구', '영등포구', '송파구', '동대문구'],
    '경기': ['수원시', '성남시', '고양시', '용인시', '부천시', '안산시'],
    '부산': ['해운대구', '서면구', '남포동구'],
    '대구': ['동구', '서구', '수성구'],
    '인천': ['부평구', '연수구', '미추홀구'],
    '광주': ['동구', '서구', '남구'],
    '대전': ['서구', '유성구'],
    '울산': ['남구', '중구'],
    '세종': ['어진동', '나성동'],
    '제주': ['제주시', '서귀포시'],
  };

  const timeSlotsHourly = [];
  for (let h = 8; h <= 22; h++) { // 08:00 ~ 22:00
    timeSlotsHourly.push(`${h.toString().padStart(2, '0')}:00`);
  }

  const reviewerNames = ['김민준', '이서연', '박도윤', '최지우', '정하준', '강채원', '조이준', '윤서아'];
  
  const products = [];

  for (let i = 1; i <= 100; i++) {
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomDistrict = districtsMap[randomCity] ? districtsMap[randomCity][Math.floor(Math.random() * districtsMap[randomCity].length)] : '';
    
    const randomRating = parseFloat(((Math.random() * 2) + 3).toFixed(1)); // 3.0 to 5.0
    const randomReviewCount = Math.floor(Math.random() * 200) + 50; // 50 to 250

    const randomAvailableTimes = [];
    const numTimeSlots = Math.floor(Math.random() * 3) + 1; // 1 to 3 time slots
    for (let j = 0; j < numTimeSlots; j++) {
      randomAvailableTimes.push(timeSlotsHourly[Math.floor(Math.random() * timeSlotsHourly.length)]);
    }
    const uniqueAvailableTimes = [...new Set(randomAvailableTimes)].sort(); // 중복 제거 및 정렬

    const basePrice = Math.floor(Math.random() * (25 - 20) + 20) * 1000; // 20000 ~ 25000원
    const priceTable = {
      '2인': Math.round(basePrice * 2.2 / 100) * 100,
      '3인': Math.round(basePrice * 2 / 100) * 100,
      '4인': Math.round(basePrice * 1.8 / 100) * 100,
    };

    const recentReviews = [];
    for (let k = 0; k < 5; k++) {
      const reviewRating = Math.floor(Math.random() * 5) + 1; // 1 to 5
      const randomComment = `정말 ${reviewRating >= 4 ? '재미있었어요!' : (reviewRating <= 2 ? '아쉬웠어요.' : '괜찮았어요.')} 추천합니다!`;
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() - Math.floor(Math.random() * 30));
      recentReviews.push({
        id: k + 1,
        reviewer: reviewerNames[Math.floor(Math.random() * reviewerNames.length)],
        rating: reviewRating,
        comment: randomComment,
        date: reviewDate.toISOString().slice(0, 10),
      });
    }

    products.push({
      id: i,
      title: `${randomCity} ${randomDistrict ? randomDistrict + ' ' : ''}${randomTheme.split('/')[0]} 테마 ${i}`,
      rating: randomRating,
      reviewCount: randomReviewCount,
      theme: randomTheme,
      location: { city: randomCity, district: randomDistrict }, // ⭐ 위치 객체로 변경!
      availableTimes: uniqueAvailableTimes, // ⭐ 1시간 단위 시간으로 변경!
      priceTable: priceTable,
      recentReviews: recentReviews,
      description: `이 테마는 ${randomCity} ${randomDistrict ? randomDistrict + ' ' : ''}에 위치한 ${randomTheme} 방탈출입니다. 스릴 넘치는 경험을 약속합니다.`,
      imageUrl: `/images/theme_${Math.floor(Math.random() * 5) + 1}.jpg`,
    });
  }
  return products;
};

const productsData = generateRandomData();

export default productsData;

// ⭐⭐ ReservationPage.jsx 에서 districtsMap을 사용해야 하므로, districtsMap도 함께 export ⭐⭐
export const districtsMap = {
  '서울': ['강남구', '홍대구', '건대구', '신림구', '혜화구', '종로구', '마포구', '영등포구', '송파구', '동대문구'],
  '경기': ['수원시', '성남시', '고양시', '용인시', '부천시', '안산시'],
  '부산': ['해운대구', '서면구', '남포동구'],
  '대구': ['동구', '서구', '수성구'],
  '인천': ['부평구', '연수구', '미추홀구'],
  '광주': ['동구', '서구', '남구'],
  '대전': ['서구', '유성구'],
  '울산': ['남구', '중구'],
  '세종': ['어진동', '나성동'],
  '제주': ['제주시', '서귀포시'],
};