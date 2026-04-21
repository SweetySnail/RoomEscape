export const getRefundInfo = (reservationDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resDate = new Date(reservationDate);
  resDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((resDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays >= 7) {
    return { rate: 100, label: '전액 환불', color: '#155724', bg: '#d4edda' };
  } else if (diffDays >= 3) {
    return { rate: 50,  label: '50% 환불', color: '#856404', bg: '#fff3cd' };
  } else if (diffDays >= 1) {
    return { rate: 0,   label: '환불 불가', color: '#721c24', bg: '#f8d7da' };
  } else {
    return { rate: 0,   label: '당일 취소 - 환불 불가', color: '#721c24', bg: '#f8d7da' };
  }
};