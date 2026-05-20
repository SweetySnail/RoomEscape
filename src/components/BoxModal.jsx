// src/components/BoxModal.jsx
import React, { useState, useEffect } from 'react';
import '../styles/BoxModal.css';
import { toggleFavorite } from '../utils/FavoriteUtils';
import { checkIsFavorite } from '../services/favoriteService';
import { addReservation, getBookedTimes } from '../services/reservationService';
import { spendPoints } from '../services/pointService';
import { getReviewsByProduct } from '../services/reviewService';
import { getUserData } from '../services/authService';

// 난이도 숫자 변환
const difficultyToNumber = (difficulty) => {
  const map = { easy: 1, normal: 2, hard: 4, expert: 5 };
  return map[difficulty] ?? (typeof difficulty === 'number' ? difficulty : 3);
};

// 인원별 가격 파싱 (pricing 배열 or priceTable 객체 둘 다 지원)
const getPriceMap = (productData) => {
  if (productData.pricing?.length > 0) {
    const map = {};
    productData.pricing.forEach(p => {
      map[`${p.people}인`] = Number(p.price);
    });
    return map;
  }
  if (productData.priceTable) return productData.priceTable;
  return {};
};

// 위치 텍스트 파싱
const getLocation = (productData) => {
  if (productData.address) return productData.address;
  if (productData.location) return `${productData.location.city} ${productData.location.district}`;
  return '-';
};

// 장르/테마 텍스트
const getGenre = (productData) => productData.genre || productData.theme || '-';

function BoxModal({ productData, onClose }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPeople, setSelectedPeople] = useState('');
  const [step, setStep] = useState('reservation');
  const [favorited, setFavorited] = useState(false);
  const [usePoint, setUsePoint] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [guestEmail, setGuestEmail] = useState('');
  const [toast, setToast] = useState(null); // { msg, type }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const priceMap = getPriceMap(productData);
  const selectedPrice = selectedPeople ? priceMap[selectedPeople] : null;
  const pointDiscount = usePoint ? Math.min(currentPoints, selectedPrice || 0) : 0;
  const finalPrice = (selectedPrice || 0) - pointDiscount;
  const difficultyNum = difficultyToNumber(productData?.difficulty);

  // 운영 시간 파싱
  const availableTimes = productData?.availableTimes?.length > 0
    ? productData.availableTimes
    : [];

  useEffect(() => {
    const load = async () => {
      const user = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
      if (!user?.uid) return;
      try {
        const userData = await getUserData(user.uid);
        setCurrentPoints(userData?.points || 0);
      } catch (e) {
        console.error('포인트 불러오기 실패:', e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!productData?.id) return;
      try {
        const reviews = await getReviewsByProduct(productData.id);
        setUserReviews(reviews);
      } catch (e) {
        console.error('리뷰 불러오기 실패:', e);
      }
    };
    load();
  }, [productData]);

  useEffect(() => {
    const load = async () => {
      const user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
      if (!user?.uid || !productData?.id) return;
      try {
        const status = await checkIsFavorite(user.uid, productData.id);
        setFavorited(status);
      } catch (e) {
        console.error('즐겨찾기 확인 실패:', e);
      }
    };
    load();
  }, [productData]);

  if (!productData) return null;

  const handleDateSelect = async (dateValue) => {
    setSelectedDate(dateValue);
    setSelectedTime('');
    setSelectedPeople('');
    showToast('날짜가 선택됐어요 ✓', 'info');
    try {
      const booked = await getBookedTimes(productData.id, dateValue);
      setBookedTimes(booked);
    } catch (e) {
      setBookedTimes([]);
    }
  };

  const generateDates = () => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return {
        label: date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }),
        value: date.toISOString().slice(0, 10),
      };
    });
  };

  const handlePaymentSuccess = async () => {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
    try {
      if (user?.uid && usePoint && pointDiscount > 0) {
        await spendPoints(user.uid, pointDiscount, `${productData.title} 예약 결제`);
      }
      await addReservation({
        uid: user?.uid || 'guest',
        productId: productData.id,
        productName: productData.title,
        branch: productData.branch || '',
        theme: getGenre(productData),
        date: selectedDate,
        time: selectedTime,
        people: selectedPeople,
        price: finalPrice,
        originalPrice: selectedPrice,
        usedPoints: user?.uid ? pointDiscount : 0,
        success: null,
        reviewed: false,
        cancelled: false,
        autoSuccess: false,
        escapeMinutes: null,
        guestEmail: user?.uid ? null : guestEmail,
      });
      setStep('success');
      showToast('🎉 예약이 완료됐어요!', 'success');
    } catch (e) {
      console.error('예약 저장 실패:', e);
      alert('예약 저장 중 오류가 발생했어요. 다시 시도해주세요.');
    }
  };

  // ===== 예약 단계 =====
  const renderReservation = () => (
    <>
      <div className="modal-top">
        {productData.imageUrl ? (
          <img src={productData.imageUrl} alt={productData.title} className="modal-image" />
        ) : (
          <div className="modal-image" style={{
            background: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '4em',
          }}>🔐</div>
        )}

        <div className="modal-info">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <h2 className="modal-title">{productData.title}</h2>
            <button
              className={`favorite-btn ${favorited ? 'active' : ''}`}
              onClick={async () => {
                const result = await toggleFavorite(productData);
                setFavorited(result);
              }}
            >
              {favorited ? '⭐' : '☆'}
            </button>
          </div>

          <div className="modal-badge-row">
            <span className="modal-badge genre">{getGenre(productData)}</span>
            {productData.branch && (
              <span className="modal-badge theme">🏪 {productData.branch}</span>
            )}
          </div>

          <div className="modal-rating">
            ⭐ <strong>{(productData.rating || 0).toFixed(1)}</strong>
            <span className="modal-review-count">({productData.reviewCount || 0}개 리뷰)</span>
          </div>

          <div className="modal-difficulty">
            난이도&nbsp;
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ color: i < difficultyNum ? '#d4a843' : '#555' }}>★</span>
            ))}
            <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({productData.difficulty})
            </span>
          </div>

          {productData.duration && (
            <div style={{ fontSize: '0.9em', color: 'var(--text-muted)', marginTop: '4px' }}>
              ⏱ 진행시간: {productData.duration}분
            </div>
          )}

          <div className="modal-price-table">
            <h4>인원별 가격</h4>
            <div className="price-row-group">
              {Object.keys(priceMap).length > 0 ? (
                Object.entries(priceMap).map(([people, price]) => (
                  <div key={people} className="price-row">
                    <span className="price-people">{people}</span>
                    <span className="price-amount">{Number(price).toLocaleString()}원</span>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>가격 정보가 없어요.</p>
              )}
            </div>
          </div>

          <p className="modal-description">{productData.description}</p>
        </div>
      </div>

      <hr className="modal-divider" />

      <div className="modal-reservation">
        <h3>📅 날짜 선택</h3>
        <div className="date-scroll">
          {generateDates().map((date) => (
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
            {availableTimes.length > 0 ? (
              <div className="time-grid">
                {availableTimes.map((time) => {
                  const isBooked = bookedTimes.includes(time);
                  return (
                    <button
                      key={time}
                      className={`time-btn ${selectedTime === time ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                      onClick={() => { if (!isBooked) { setSelectedTime(time); setSelectedPeople(''); showToast(`${time} 선택됨 ✓`, 'info'); } }}
                      disabled={isBooked}
                    >
                      {time}
                      {isBooked && <span style={{ fontSize: '0.7em', display: 'block' }}>마감</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.9em' }}>
                ⚠️ 아직 운영 시간이 설정되지 않았어요. 매장에 문의해주세요.
              </div>
            )}
          </>
        )}

        {selectedDate && selectedTime && (
          <>
            <h3>👥 인원 선택</h3>
            <div className="people-grid">
              {Object.entries(priceMap).map(([people, price]) => (
                <button
                  key={people}
                  className={`people-btn ${selectedPeople === people ? 'selected' : ''}`}
                  onClick={() => { setSelectedPeople(people); showToast(`${people} 선택됨 ✓`, 'info'); }}
                >
                  <span className="people-label">{people}</span>
                  <span className="people-price">{Number(price).toLocaleString()}원</span>
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
            {productData.paymentType === 'external' ? (
              <button
                className="reserve-button"
                onClick={async () => {
                  // 외부 결제: 예약 신청 저장 후 외부 URL 오픈
                  const user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
                  try {
                    await addReservation({
                      uid: user?.uid || 'guest',
                      productId: productData.id,
                      productName: productData.title,
                      branch: productData.branch || '',
                      theme: getGenre(productData),
                      date: selectedDate,
                      time: selectedTime,
                      people: selectedPeople,
                      price: selectedPrice,
                      originalPrice: selectedPrice,
                      usedPoints: 0,
                      success: null,
                      reviewed: false,
                      cancelled: false,
                      autoSuccess: false,
                      escapeMinutes: null,
                      paymentType: 'external',
                    });
                    if (productData.reservationUrl) {
                      window.open(productData.reservationUrl, '_blank', 'noopener,noreferrer');
                    }
                    setStep('success');
                    showToast('🎉 예약 신청이 완료됐어요!', 'success');
                  } catch (e) {
                    console.error('예약 저장 실패:', e);
                    alert('예약 저장 중 오류가 발생했어요.');
                  }
                }}
              >
                예약 신청 → 외부 결제
              </button>
            ) : (
              (() => {
                const user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
                if (!user?.uid) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <p style={{ fontSize: '0.82em', color: '#ff6b7a', margin: 0 }}>
                        ⚠️ 플랫폼 내 결제는 로그인이 필요합니다.
                      </p>
                      <button
                        className="reserve-button"
                        onClick={() => window.location.href = '/login'}
                      >
                        로그인하러 가기
                      </button>
                    </div>
                  );
                }
                return (
                  <button className="reserve-button" onClick={() => setStep('payment')}>
                    결제하기
                  </button>
                );
              })()
            )}
          </div>
        )}
      </div>

      <hr className="modal-divider" />

      {/* 리뷰 */}
      <div className="modal-reviews">
        <h3>💬 최근 리뷰</h3>
        <div className="review-list">
          {userReviews.length > 0 ? (
            userReviews.map((review) => (
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
            ))
          ) : (productData.recentReviews ?? []).length > 0 ? (
            productData.recentReviews.map((review) => (
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
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9em', textAlign: 'center', padding: '16px 0' }}>
              아직 리뷰가 없어요. 첫 리뷰를 작성해보세요!
            </p>
          )}
        </div>
      </div>

      <hr className="modal-divider" />

      <div className="modal-location">
        <h3>📍 위치</h3>
        <p>{getLocation(productData)}</p>
      </div>
    </>
  );

  // ===== 결제 단계 =====
  const renderPayment = () => {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
    return (
      <div className="payment-container">
        <h2 className="payment-title">💳 결제</h2>
        <div className="payment-summary">
          <h3>예약 정보 확인</h3>
          {[
            { label: '테마', value: productData.title },
            { label: '날짜', value: selectedDate },
            { label: '시간', value: selectedTime },
            { label: '인원', value: selectedPeople },
            { label: '기본 금액', value: `${selectedPrice?.toLocaleString()}원` },
          ].map(({ label, value }) => (
            <div key={label} className="payment-summary-item">
              <span>{label}</span><strong>{value}</strong>
            </div>
          ))}

          {user?.uid && (
            <>
              <div className="payment-summary-item">
                <span>보유 포인트</span>
                <strong style={{ color: 'var(--accent-gold)' }}>💎 {currentPoints.toLocaleString()} P</strong>
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
                    fontSize: '0.9em', fontWeight: 'bold',
                  }}
                  onClick={() => currentPoints > 0 && setUsePoint(!usePoint)}
                >
                  {usePoint ? `✅ -${pointDiscount.toLocaleString()}P 사용중` : currentPoints > 0 ? '포인트 사용하기' : '포인트 없음'}
                </button>
              </div>
            </>
          )}

          <div className="payment-summary-item total">
            <span>최종 결제 금액</span>
            <strong>{finalPrice.toLocaleString()}원</strong>
          </div>
        </div>

        {!user?.uid && (
          <div className="guest-email-section">
            <h3>📧 예약 확인 이메일</h3>
            <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
              비회원 예약 시 예약 내역을 이메일로 확인할 수 있어요.
            </p>
            <input
              type="email"
              className="guest-email-input"
              placeholder="이메일 주소를 입력해주세요 (선택)"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
            <div className="guest-login-nudge">
              <span>💡 </span>
              <span
                style={{ color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => window.location.href = '/login'}
              >로그인</span>
              <span>하시면 포인트 적립 및 예약 관리가 가능해요!</span>
            </div>
          </div>
        )}

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
          <button className="back-button" onClick={() => setStep('reservation')}>← 뒤로</button>
          <button className="confirm-payment-button" onClick={handlePaymentSuccess}>
            결제 완료 (테스트)
          </button>
        </div>
      </div>
    );
  };

  // ===== 성공 단계 =====
  const renderSuccess = () => (
    <div className="success-container">
      <div className="success-icon">🎉</div>
      <h2>예약 완료!</h2>
      <p>캘린더에 예약이 등록되었어요.</p>
      <div className="success-summary">
        {[
          { label: '테마', value: productData.title },
          { label: '날짜', value: selectedDate },
          { label: '시간', value: selectedTime },
          { label: '인원', value: selectedPeople },
        ].map(({ label, value }) => (
          <div key={label} className="payment-summary-item">
            <span>{label}</span><strong>{value}</strong>
          </div>
        ))}
        {pointDiscount > 0 && (
          <div className="payment-summary-item">
            <span>포인트 할인</span>
            <strong style={{ color: 'var(--accent-gold)' }}>-{pointDiscount.toLocaleString()}P</strong>
          </div>
        )}
        <div className="payment-summary-item total">
          <span>결제 금액</span><strong>{finalPrice.toLocaleString()}원</strong>
        </div>
      </div>
      <div className="success-actions">
        <button className="confirm-payment-button" onClick={onClose}>확인</button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={step === 'reservation' ? onClose : undefined}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>×</button>
        {/* 토스트 메시지 */}
        {toast && (
          <div className={`modal-toast modal-toast-${toast.type}`}>
            {toast.msg}
          </div>
        )}
        {step === 'reservation' && renderReservation()}
        {step === 'payment'     && renderPayment()}
        {step === 'success'     && renderSuccess()}
      </div>
    </div>
  );
}

export default BoxModal;