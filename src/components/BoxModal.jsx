import React, { useState } from 'react';
import '../styles/BoxModal.css';

function BoxModal({ productData, onClose }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPeople, setSelectedPeople] = useState('');
  const [step, setStep] = useState('reservation'); // 'reservation' | 'payment' | 'success'

  if (!productData) return null;

  // 오늘부터 14일치 날짜 생성
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const formatted = date.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
      const value = date.toISOString().slice(0, 10);
      dates.push({ label: formatted, value });
    }
    return dates;
  };
  const dates = generateDates();

  // 선택된 인원에 따른 가격
  const selectedPrice = selectedPeople
    ? productData.priceTable[selectedPeople]
    : null;

  // 결제 성공 처리 → 캘린더에 등록
  const handlePaymentSuccess = () => {
    const newRecord = {
      id: Date.now(),
      date: selectedDate,
      productName: productData.title,
      time: selectedTime,
      people: selectedPeople,
      price: selectedPrice,
      rating: null,
      theme: productData.theme,
      success: null, // 성공/실패는 나중에 캘린더에서 기록
    };

    // localStorage에 예약 기록 저장
    const existing = JSON.parse(localStorage.getItem('reservationRecords') || '[]');
    existing.push(newRecord);
    localStorage.setItem('reservationRecords', JSON.stringify(existing));

    setStep('success');
  };

  // ===== 예약 단계 =====
  const renderReservation = () => (
    <>
      {/* 상단: 이미지 + 기본 정보 */}
      <div className="modal-top">
        <img src={productData.imageUrl} alt={productData.title} className="modal-image" />
        <div className="modal-info">
          <h2 className="modal-title">{productData.title}</h2>
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
              <span key={i} style={{ color: i < productData.difficulty ? '#6f00ff' : '#ddd' }}>★</span>
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

      {/* 날짜 선택 */}
      <div className="modal-reservation">
        <h3>📅 날짜 선택</h3>
        <div className="date-scroll">
          {dates.map((date) => (
            <button
              key={date.value}
              className={`date-btn ${selectedDate === date.value ? 'selected' : ''}`}
              onClick={() => { setSelectedDate(date.value); setSelectedTime(''); }}
            >
              {date.label}
            </button>
          ))}
        </div>

        {/* 시간 선택 */}
        {selectedDate && (
          <>
            <h3>🕐 시간 선택</h3>
            <div className="time-grid">
              {productData.availableTimes.map((time) => (
                <button
                  key={time}
                  className={`time-btn ${selectedTime === time ? 'selected' : ''}`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </>
        )}

        {/* 인원 선택 */}
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

        {/* 예약 확인 → 결제로 이동 */}
        {selectedDate && selectedTime && selectedPeople && (
          <div className="reservation-confirm">
            <div className="confirm-info">
              <p>📌 <strong>{productData.title}</strong></p>
              <p>📅 {selectedDate} · {selectedTime}</p>
              <p>👥 {selectedPeople} · {selectedPrice?.toLocaleString()}원</p>
            </div>
            <button className="reserve-button" onClick={() => setStep('payment')}>
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
          {(productData.recentReviews ?? []).map((review) => (
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
        <div className="payment-summary-item total">
          <span>결제 금액</span>
          <strong>{selectedPrice?.toLocaleString()}원</strong>
        </div>
      </div>

      <div className="payment-method">
        <h3>결제 수단</h3>
        <div className="payment-method-grid">
          {['신용카드', '카카오페이', '네이버페이', '토스'].map((method) => (
            <button key={method} className="payment-method-btn">
              {method}
            </button>
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
        <div className="payment-summary-item total">
          <span>결제 금액</span>
          <strong>{selectedPrice?.toLocaleString()}원</strong>
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
        {step === 'payment' && renderPayment()}
        {step === 'success' && renderSuccess()}
      </div>
    </div>
  );
}

export default BoxModal;