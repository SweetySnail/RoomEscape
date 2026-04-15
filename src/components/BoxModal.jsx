import React, { useState } from 'react';
import '../styles/BoxModal.css';

function BoxModal({ productData, onClose }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>×</button>

        {/* ===== 상단: 이미지 + 기본 정보 ===== */}
        <div className="modal-top">
          <img
            src={productData.imageUrl}
            alt={productData.title}
            className="modal-image"
          />
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
                {Object.entries(productData.priceTable).map(([people, price]) => (
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

        {/* ===== 중단: 예약 날짜 + 시간 선택 ===== */}
        <div className="modal-reservation">
          <h3>📅 예약 가능한 날짜 · 시간</h3>

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

          {selectedDate && (
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
          )}

          {selectedDate && selectedTime && (
            <div className="reservation-confirm">
              <p>
                📌 선택: <strong>{selectedDate}</strong> · <strong>{selectedTime}</strong>
              </p>
              <button className="reserve-button">예약하기</button>
            </div>
          )}
        </div>

        <hr className="modal-divider" />

        {/* ===== 리뷰 ===== */}
        <div className="modal-reviews">
          <h3>💬 최근 리뷰</h3>
          <div className="review-list">
            {productData.recentReviews.map((review) => (
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

        {/* ===== 위치 ===== */}
        <div className="modal-location">
          <h3>📍 위치</h3>
          <p>{productData.location.city} {productData.location.district}</p>
        </div>

      </div>
    </div>
  );
}

export default BoxModal;