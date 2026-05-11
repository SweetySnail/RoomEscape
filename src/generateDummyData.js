export const generateDummyData = () => {
  // 이미 생성된 경우 스킵
  const existing = localStorage.getItem('reservationRecords');
  if (existing && JSON.parse(existing).length > 10) {
    console.log('더미 데이터가 이미 있어요!');
    return;
  }

  localStorage.removeItem('reservationRecords');
  localStorage.removeItem('userReviews');

  const products = [
    { id: 101, name: '공포의 집 (서초)',    theme: '공포/스릴러', prices: [44000, 60000, 72000] },
    { id: 102, name: '저주의 방 (서초)',    theme: '공포/스릴러', prices: [42000, 57000, 68000] },
    { id: 103, name: '달빛 로맨스 (서초)',  theme: '로맨스',      prices: [38000, 51000, 60000] },
    { id: 104, name: '비밀의 편지 (서초)',  theme: '로맨스',      prices: [36000, 48000, 58000] },
    { id: 105, name: '웃음 폭발 (서초)',   theme: '코미디',      prices: [34000, 45000, 54000] },
    { id: 106, name: '코미디 클럽 (서초)', theme: '코미디',      prices: [32000, 43000, 52000] },
    { id: 201, name: '어둠의 사원 (종로)', theme: '공포/스릴러', prices: [46000, 63000, 76000] },
    { id: 202, name: '우주탈출 (종로)',    theme: 'SF/미래',    prices: [44000, 60000, 72000] },
    { id: 203, name: '미래도시 (종로)',    theme: 'SF/미래',    prices: [42000, 57000, 68000] },
    { id: 204, name: '미스터리 저택 (종로)', theme: '추리/미스터리', prices: [44000, 60000, 72000] },
    { id: 205, name: '사라진 유언 (종로)', theme: '추리/미스터리', prices: [40000, 54000, 64000] },
    { id: 301, name: '지옥의 문 (용답)',   theme: '공포/스릴러', prices: [48000, 66000, 80000] },
    { id: 302, name: '공포특급 (용답)',    theme: '공포/스릴러', prices: [46000, 63000, 76000] },
    { id: 303, name: '혈의 누 (용답)',     theme: '공포/스릴러', prices: [44000, 60000, 72000] },
    { id: 304, name: '코믹수사대 (용답)',  theme: '코미디',      prices: [36000, 48000, 58000] },
    { id: 305, name: '개그콘서트 (용답)',  theme: '코미디',      prices: [34000, 45000, 54000] },
    { id: 306, name: '정글탐험 (용답)',    theme: '판타지/어드벤처', prices: [40000, 54000, 64000] },
    { id: 307, name: '해저탐험 (용답)',    theme: '판타지/어드벤처', prices: [42000, 57000, 68000] },
    { id: 308, name: '사막의 보물 (용답)', theme: '판타지/어드벤처', prices: [44000, 60000, 72000] },
    { id: 401, name: '살인마의 집 (강남)', theme: '공포/스릴러', prices: [48000, 66000, 80000] },
    { id: 402, name: '공포탈출 (강남)',    theme: '공포/스릴러', prices: [44000, 60000, 72000] },
    { id: 403, name: '달콤한 비밀 (강남)', theme: '로맨스',      prices: [40000, 54000, 64000] },
    { id: 404, name: '첫사랑 (강남)',      theme: '로맨스',      prices: [38000, 51000, 60000] },
    { id: 405, name: '로맨스 인 서울 (강남)', theme: '로맨스',  prices: [38000, 51000, 60000] },
    { id: 406, name: '탐정 홈즈 (강남)',   theme: '추리/미스터리', prices: [44000, 60000, 72000] },
    { id: 407, name: '사라진 증인 (강남)', theme: '추리/미스터리', prices: [42000, 57000, 68000] },
    { id: 501, name: '심해공포 (홍대)',    theme: '공포/스릴러', prices: [46000, 63000, 76000] },
    { id: 502, name: '좀비바이러스 (홍대)', theme: '공포/스릴러', prices: [44000, 60000, 72000] },
    { id: 503, name: '우리의 이야기 (홍대)', theme: '로맨스',   prices: [38000, 51000, 60000] },
    { id: 504, name: '벚꽃 연인 (홍대)',   theme: '로맨스',      prices: [36000, 48000, 58000] },
    { id: 505, name: '미래전쟁 (홍대)',    theme: 'SF/미래',    prices: [44000, 60000, 72000] },
    { id: 506, name: '로봇의 반란 (홍대)', theme: 'SF/미래',    prices: [42000, 57000, 68000] },
    { id: 601, name: '귀신의 집 (부산)',   theme: '공포/스릴러', prices: [46000, 63000, 76000] },
    { id: 602, name: '핏빛 병원 (부산)',   theme: '공포/스릴러', prices: [44000, 60000, 72000] },
    { id: 603, name: '사랑의 미로 (부산)', theme: '로맨스',      prices: [38000, 51000, 60000] },
    { id: 604, name: '프로포즈 (부산)',    theme: '로맨스',      prices: [40000, 54000, 64000] },
    { id: 605, name: '우주선 탈출 (부산)', theme: 'SF/미래',    prices: [44000, 60000, 72000] },
    { id: 606, name: '타임머신 (부산)',    theme: 'SF/미래',    prices: [42000, 57000, 68000] },
    { id: 607, name: '코미디 탈출 (부산)', theme: '코미디',      prices: [34000, 45000, 54000] },
  ];

  const people = ['2인', '3인', '4인'];
  const times = ['11:00', '13:00', '15:00', '17:00', '19:00'];
  const successOptions = [true, true, true, false, null];
  const records = [];
  const reviews = [];
  let reviewId = 1;
  const reviewers = ['김민준', '이서연', '박도윤', '최지우', '정하준', '강채원', '조이준', '윤서아'];
  const comments = [
    '정말 재밌었어요!', '또 오고 싶어요!', '강력 추천합니다!',
    '몰입감이 최고예요!', '친구들이랑 왔는데 대박이었어요!',
    '분위기가 너무 좋아요!', '힌트 없이 성공했어요!', '다음에 또 올게요!',
  ];

  // 4월 데이터
  products.forEach(p => {
    const count = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < count; i++) {
      const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      const pIdx = Math.floor(Math.random() * 3);
      const price = p.prices[pIdx];
      const success = successOptions[Math.floor(Math.random() * successOptions.length)];
      const cancelled = Math.random() < 0.08;
      const id = Date.now() - Math.floor(Math.random() * 1000000) - 2000000 + i;

      records.push({
        id, productId: p.id, productName: p.name, theme: p.theme,
        date: `2026-04-${day}`,
        time: times[Math.floor(Math.random() * times.length)],
        people: people[pIdx], price, originalPrice: price,
        usedPoints: 0,
        success: cancelled ? null : success,
        cancelled, reviewed: false, autoSuccess: false,
      });

      if (success === true && !cancelled && Math.random() < 0.5) {
        reviews.push({
          id: reviewId++, productId: p.id, productName: p.name,
          reviewer: reviewers[Math.floor(Math.random() * reviewers.length)],
          rating: Math.floor(Math.random() * 2) + 4,
          comment: comments[Math.floor(Math.random() * comments.length)],
          date: `2026-04-${day}`, reservationId: id,
        });
      }
    }
  });

  // 5월 데이터
  products.forEach(p => {
    const count = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < count; i++) {
      const day = String(Math.floor(Math.random() * 10) + 1).padStart(2, '0');
      const pIdx = Math.floor(Math.random() * 3);
      const price = p.prices[pIdx];
      const success = successOptions[Math.floor(Math.random() * successOptions.length)];
      const cancelled = Math.random() < 0.06;
      const id = Date.now() - Math.floor(Math.random() * 100000) + i;

      records.push({
        id, productId: p.id, productName: p.name, theme: p.theme,
        date: `2026-05-${day}`,
        time: times[Math.floor(Math.random() * times.length)],
        people: people[pIdx], price, originalPrice: price,
        usedPoints: 0,
        success: cancelled ? null : success,
        cancelled, reviewed: false, autoSuccess: false,
      });

      if (success === true && !cancelled && Math.random() < 0.5) {
        reviews.push({
          id: reviewId++, productId: p.id, productName: p.name,
          reviewer: reviewers[Math.floor(Math.random() * reviewers.length)],
          rating: Math.floor(Math.random() * 2) + 4,
          comment: comments[Math.floor(Math.random() * comments.length)],
          date: `2026-05-${day}`, reservationId: id,
        });
      }
    }
  });

  localStorage.setItem('reservationRecords', JSON.stringify(records));
  localStorage.setItem('userReviews', JSON.stringify(reviews));

  console.log(`✅ 더미 데이터 생성 완료!`);
  console.log(`예약: ${records.length}건 (4월: ${records.filter(r=>r.date.startsWith('2026-04')).length}건, 5월: ${records.filter(r=>r.date.startsWith('2026-05')).length}건)`);
  console.log(`리뷰: ${reviews.length}건`);
};