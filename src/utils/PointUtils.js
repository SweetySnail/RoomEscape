// 포인트 불러오기
export const getPoints = () => {
  return parseInt(localStorage.getItem('userPoints') || '0');
};

// 포인트 적립
export const addPoints = (amount, reason) => {
  const current = getPoints();
  const updated = current + amount;
  localStorage.setItem('userPoints', updated.toString());

  // 포인트 히스토리 기록
  const history = getPointHistory();
  history.push({
    id: Date.now(),
    type: 'earn',
    amount,
    reason,
    date: new Date().toISOString().slice(0, 10),
    balance: updated,
  });
  localStorage.setItem('pointHistory', JSON.stringify(history));
  return updated;
};

// 포인트 사용
export const spendPoints = (amount, reason) => {
  const current = getPoints();
  if (current < amount) return false; // 잔액 부족

  const updated = current - amount;
  localStorage.setItem('userPoints', updated.toString());

  const history = getPointHistory();
  history.push({
    id: Date.now(),
    type: 'use',
    amount,
    reason,
    date: new Date().toISOString().slice(0, 10),
    balance: updated,
  });
  localStorage.setItem('pointHistory', JSON.stringify(history));
  return true;
};

// 포인트 히스토리 불러오기
export const getPointHistory = () => {
  return JSON.parse(localStorage.getItem('pointHistory') || '[]');
};