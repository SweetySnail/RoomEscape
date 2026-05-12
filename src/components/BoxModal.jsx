import React, { useState, useEffect } from 'react';
import '../styles/BoxModal.css';
import { isFavorite, toggleFavorite } from '../utils/FavoriteUtils';
import { addReservation, getBookedTimes } from '../services/reservationService';
import { spendPoints } from '../services/pointService';
import { getReviewsByProduct } from '../services/reviewService';
import { getUserData } from '../services/authService';

function BoxModal({ productData, onClose }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPeople, setSelectedPeople] = useState('');
  const [step, setStep] = useState('reservation');
  const [favorited, setFavorited] = useState(isFavorite(productData?.id));
  const [usePoint, setUsePoint] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [bookedTimes, setBookedTimes] = useState([]);

  const selectedPrice = selectedPeople ? productData?.priceTable[selectedPeople] : null;
  const pointDiscount = usePoint ? Math.min(currentPoints, selectedPrice || 0) : 0;
  const finalPrice = (selectedPrice || 0) - pointDiscount;

  // 포인트 불러오기
  useEffect(() => {
    const loadPoints = async () => {
      const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
      if (!loggedInUser?.uid) return;
      try {
        const userData = await getUserData(loggedInUser.uid);
        setCurrentPoints(userData?.points || 0);
      } catch (error) {
        console.error('포인트 불러오기 실패:', error);
      }
    };
    loadPoints();
  }, []);

  // 리뷰 불러오기
  useEffect(() => {
    const loadReviews = async () => {
      if (!productData?.id) return;
      try {
        const reviews = await getReviewsByProduct(productData.id);
        setUserReviews(reviews);
      } catch (error) {
        console.error('리뷰 불러오기 실패:', error);
      }
    };
    loadReviews();
  }, [productData]);

  // early return은 모든 Hook 이후에
  if (!productData) return null;

  // 날짜 선택 시 예약된 시간 조회
  const handleDateSelect = async (dateValue) => {
    setSelectedDate(dateValue);
    setSelectedTime('');
    setSelectedPeople('');
    try {
      const booked = await getBookedTimes(productData.id, dateValue);
      setBookedTimes(booked);
    } catch (error) {
      console.error('예약 시간 조회 실패:', error);
      setBookedTimes([]);
    }
  };

  // 오늘부터 14일치 날짜 생성
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const formatted = date.toLocaleDateString('ko-KR', {
        month: 'long', day: 'numeric', weekday: 'short',
      });
      const value = date.toISOString().slice(0, 10);
      dates.push({ label: formatted, value });
    }
    return dates;
  };
  const dates = generateDates();

  // 결제 성공 처리
  const handlePaymentSuccess = async () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
    try {
      if (usePoint && pointDiscount > 0 && loggedInUser.uid) {
        await spendPoints(loggedInUser.uid, pointDiscount, `${productData.title} 예약 결제`);
      }

      const newRecord = {
        uid: loggedInUser.uid || 'guest',
        productId: productData.id,
        productName: productData.title,
        branch: productData.branch || '',
        theme: productData.theme,
        date: selectedDate,
        time: selectedTime,
        people: selectedPeople,
        price: finalPrice,
        originalPrice: selectedPrice,
        usedPoints: pointDiscount,
        success: null,
        reviewed: false,
        cancelled: false,
        autoSuccess: false,
        escapeMinutes: null,
      };

      await addReservation(newRecord);
      setStep('success');
    } catch (error) {
      console.error('예약 저장 실패:', error);
      alert('예약 저장 중 오류가 발생했어요. 다시 시도해주세요.');
    }
  };

  // ===== 예약 단계 =====
  const renderReservation = () => (
    <>
      {/* 상단: 이미지 + 기본 정보 */}
      <div className="modal-top">
        <img src={productData.imageUrl} alt={productData.title} className="modal-image" />
        <div className="modal-info">

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <h2 className="modal-title">{productData.title}</h2>
            <button
              className={`favorite-btn ${favorited ? 'active' : ''}`}
              onClick={() => {
                const result = toggleFavorite(productData);
                setFavorited(result);
              }}
            >
              {favorited ? '⭐' : '☆'}
            </button>
          </div>

          <div className="modal-badge-row">
            <span className="modal-badge theme">{productData.theme}</span>
            <span className="modal-badge genre">{productData.genre}</span>
          </div>

          <div className="modal-rating">
            ⭐ <strong>{productData.rating}</strong>
            <span className="modal-review-count">({productData.reviewCount}개 리뷰)</span>
          </div>

          <div className="modal-difficulty">
            난이도&nbsp;
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ color: i < productData.difficulty ? '#d4a843' : '#555' }}>
                ★
              </span>
            ))}
          </div>

          <div className="modal-price-table">
            <h4>인원별 가격</h4>
            <div className="price-row-group">
              {Object.entries(productData.priceTable ?? {}).map(([people, price]) => (
                <div key={people} className="price-row">
                  <span className="price-people">{people}</span>
                  <span className="price-amount">{price.toLocaleString()}원</span>
                </div>
              ))}
            </div>
          </div>

          <p className="modal-description">{productData.description}</p>
        </div>
      </div>

      <hr className="modal-divider" />

      {/* 날짜 / 시간 / 인원 선택 */}
      <div className="modal-reservation">
        <h3>📅 날짜 선택</h3>
        <div className="date-scroll">
          {dates.map((date) => (
            <button
              key={date.value}
              className={`date-btn ${selectedDate === date.value ? 'selected' : ''}`}
              onClick={() => handleDateSelect(date.value)}
            >
              {date.label}
            </button>
          ))}
        </div>

        {selectedDate && (
          <>
            <h3>🕐 시간 선택</h3>
            <div className="time-grid">
              {productData.availableTimes.map((time) => {
                const isBooked = bookedTimes.includes(time);
                return (
                  <button
                    key={time}
                    className={`time-btn ${selectedTime === time ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                    onClick={() => {
                      if (isBooked) return;
                      setSelectedTime(time);
                      setSelectedPeople('');
                    }}
                    disabled={isBooked}
                    title={isBooked ? '이미 예약된 시간이에요' : ''}
                  >
                    {time}
                    {isBooked && (
                      <span style={{ fontSize: '0.7em', display: 'block' }}>마감</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {selectedDate && selectedTime && (
          <>
            <h3>👥 인원 선택</h3>
            <div className="people-grid">
              {Object.entries(productData.priceTable ?? {}).map(([people, price]) => (
                <button
                  key={people}
                  className={`people-btn ${selectedPeople === people ? 'selected' : ''}`}
                  onClick={() => setSelectedPeople(people)}
                >
                  <span className="people-label">{people}</span>
                  <span className="people-price">{price.toLocaleString()}원</span>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedDate && selectedTime && selectedPeople && (
          <div className="reservation-confirm">
            <div className="confirm-info">
              <p>📌 <strong>{productData.title}</strong></p>
              <p>📅 {selectedDate} · {selectedTime}</p>
              <p>👥 {selectedPeople} · {selectedPrice?.toLocaleString()}원</p>
            </div>
            <button
              className="reserve-button"
              onClick={() => {
                const user = sessionStorage.getItem('loggedInUser');
                if (!user) {
                  if (window.confirm('로그인 후 예약이 가능해요.\n로그인 페이지로 이동할까요?')) {
                    window.location.href = '/login';
                  }
                  return;
                }
                setStep('payment');
              }}
            >
              결제하기
            </button>
          </div>
        )}
      </div>

      <hr className="modal-divider" />

      {/* 리뷰 */}
      <div className="modal-reviews">
        <h3>💬 최근 리뷰</h3>
        <div className="review-list">
          {/* Firestore 리뷰 */}
          {userReviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <span className="reviewer-name">{review.reviewer}</span>
                <span className="review-rating">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
                <span className="review-date">{review.date}</span>
              </div>
              <p className="review-comment">{review.comment}</p>
            </div>
          ))}

          {/* 더미 리뷰 - Firestore 리뷰 없을 때만 */}
          {userReviews.length === 0 && (productData.recentReviews ?? []).map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <span className="reviewer-name">{review.reviewer}</span>
                <span className="review-rating">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
                <span className="review-date">{review.date}</span>
              </div>
              <p className="review-comment">{review.comment}</p>
            </div>
          ))}

          {userReviews.length === 0 && (productData.recentReviews ?? []).length === 0 && (
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.9em',
              textAlign: 'center',
              padding: '16px 0'
            }}>
              아직 리뷰가 없어요. 첫 리뷰를 작성해보세요!
            </p>
          )}
        </div>
      </div>

      <hr className="modal-divider" />

      {/* 위치 */}
      <div className="modal-location">
        <h3>📍 위치</h3>
        <p>{productData.location.city} {productData.location.district}</p>
      </div>
    </>
  );

  // ===== 결제 단계 =====
  const renderPayment = () => (
    <div className="payment-container">
      <h2 className="payment-title">💳 결제</h2>

      <div className="payment-summary">
        <h3>예약 정보 확인</h3>
        <div className="payment-summary-item">
          <span>테마</span>
          <strong>{productData.title}</strong>
        </div>
        <div className="payment-summary-item">
          <span>날짜</span>
          <strong>{selectedDate}</strong>
        </div>
        <div className="payment-summary-item">
          <span>시간</span>
          <strong>{selectedTime}</strong>
        </div>
        <div className="payment-summary-item">
          <span>인원</span>
          <strong>{selectedPeople}</strong>
        </div>
        <div className="payment-summary-item">
          <span>기본 금액</span>
          <strong>{selectedPrice?.toLocaleString()}원</strong>
        </div>
        <div className="payment-summary-item">
          <span>보유 포인트</span>
          <strong style={{ color: 'var(--accent-gold)' }}>
            💎 {currentPoints.toLocaleString()} P
          </strong>
        </div>
        <div className="payment-summary-item">
          <span>포인트 사용</span>
          <button
            style={{
              padding: '6px 14px',
              border: `1.5px solid ${usePoint ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-sm)',
              background: usePoint ? 'rgba(212,168,67,0.15)' : 'transparent',
              color: usePoint ? 'var(--accent-gold)' : 'var(--text-secondary)',
              cursor: currentPoints > 0 ? 'pointer' : 'not-allowed',
              fontSize: '0.9em',
              fontWeight: 'bold',
            }}
            onClick={() => currentPoints > 0 && setUsePoint(!usePoint)}
          >
            {usePoint
              ? `✅ -${pointDiscount.toLocaleString()}P 사용중`
              : currentPoints > 0 ? '포인트 사용하기' : '포인트 없음'}
          </button>
        </div>
        <div className="payment-summary-item total">
          <span>최종 결제 금액</span>
          <strong>{finalPrice.toLocaleString()}원</strong>
        </div>
      </div>

      <div className="payment-method">
        <h3>결제 수단</h3>
        <div className="payment-method-grid">
          {['신용카드', '카카오페이', '네이버페이', '토스'].map((method) => (
            <button key={method} className="payment-method-btn">{method}</button>
          ))}
        </div>
      </div>

      <div className="payment-notice">
        <p>⚠️ 현재 테스트 환경입니다. 실제 결제가 이루어지지 않아요.</p>
      </div>

      <div className="payment-actions">
        <button className="back-button" onClick={() => setStep('reservation')}>
          ← 뒤로
        </button>
        <button className="confirm-payment-button" onClick={handlePaymentSuccess}>
          결제 완료 (테스트)
        </button>
      </div>
    </div>
  );

  // ===== 성공 단계 =====
  const renderSuccess = () => (
    <div className="success-container">
      <div className="success-icon">🎉</div>
      <h2>예약 완료!</h2>
      <p>캘린더에 예약이 등록되었어요.</p>

      <div className="success-summary">
        <div className="payment-summary-item">
          <span>테마</span>
          <strong>{productData.title}</strong>
        </div>
        <div className="payment-summary-item">
          <span>날짜</span>
          <strong>{selectedDate}</strong>
        </div>
        <div className="payment-summary-item">
          <span>시간</span>
          <strong>{selectedTime}</strong>
        </div>
        <div className="payment-summary-item">
          <span>인원</span>
          <strong>{selectedPeople}</strong>
        </div>
        {pointDiscount > 0 && (
          <div className="payment-summary-item">
            <span>포인트 할인</span>
            <strong style={{ color: 'var(--accent-gold)' }}>
              -{pointDiscount.toLocaleString()}P
            </strong>
          </div>
        )}
        <div className="payment-summary-item total">
          <span>결제 금액</span>
          <strong>{finalPrice.toLocaleString()}원</strong>
        </div>
      </div>

      <div className="success-actions">
        <button className="confirm-payment-button" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={step === 'reservation' ? onClose : undefined}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>×</button>
        {step === 'reservation' && renderReservation()}
        {step === 'payment'     && renderPayment()}
        {step === 'success'     && renderSuccess()}
      </div>
    </div>
  );
}

export default BoxModal;