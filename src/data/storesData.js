const storesData = [
  {
    id: 1,
    ownerName: '김득춘',
    storeName: '블랙이스케이프',
    adminUsername: 'admin_kim',
    branches: ['블랙이스케이프 서초점', '블랙이스케이프 종로점', '블랙이스케이프 용답점'],
    themes: [
      // 서초점
      '공포의 집 (서초)', '저주의 방 (서초)', '달빛 로맨스 (서초)', '비밀의 편지 (서초)',
      '웃음 폭발 (서초)', '코미디 클럽 (서초)',
      // 종로점
      '어둠의 사원 (종로)', '우주탈출 (종로)', '미래도시 (종로)', '미스터리 저택 (종로)', '사라진 유언 (종로)',
      // 용답점
      '지옥의 문 (용답)', '공포특급 (용답)', '혈의 누 (용답)',
      '코믹수사대 (용답)', '개그콘서트 (용답)',
      '정글탐험 (용답)', '해저탐험 (용답)', '사막의 보물 (용답)',
    ],
    discountRate: 10,
    contractDate: '2026-01-01',
    contact: '010-1234-5678',
    email: 'kim@blackescape.co.kr',
  },
  {
    id: 2,
    ownerName: '이수진',
    storeName: '미스터리박스',
    adminUsername: 'admin_lee',
    branches: ['미스터리박스 강남점', '미스터리박스 홍대점'],
    themes: [
      // 강남점
      '살인마의 집 (강남)', '공포탈출 (강남)',
      '달콤한 비밀 (강남)', '첫사랑 (강남)', '로맨스 인 서울 (강남)',
      '탐정 홈즈 (강남)', '사라진 증인 (강남)',
      // 홍대점
      '심해공포 (홍대)', '좀비바이러스 (홍대)',
      '우리의 이야기 (홍대)', '벚꽃 연인 (홍대)',
      '미래전쟁 (홍대)', '로봇의 반란 (홍대)',
    ],
    discountRate: 8,
    contractDate: '2026-02-01',
    contact: '010-2345-6789',
    email: 'lee@mysterybox.co.kr',
  },
  {
    id: 3,
    ownerName: '박준혁',
    storeName: '이스케이프킹',
    adminUsername: 'admin_park',
    branches: ['이스케이프킹 부산점'],
    themes: [
      '귀신의 집 (부산)', '핏빛 병원 (부산)',
      '사랑의 미로 (부산)', '프로포즈 (부산)',
      '우주선 탈출 (부산)', '타임머신 (부산)',
      '코미디 탈출 (부산)',
    ],
    discountRate: 12,
    contractDate: '2026-03-01',
    contact: '010-3456-7890',
    email: 'park@escapeking.co.kr',
  },
];

export default storesData;