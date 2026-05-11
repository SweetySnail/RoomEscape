import React, { useState } from 'react';
import '../styles/ReviewModal.css';
import { addPoints } from '../utils/PointUtils';

function ReviewModal({ record, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      alert('별점을 선택해주세요!');
      return;
    }
    if (comment.trim().length < 10) {
      alert('리뷰는 10자 이상 작성해주세요!');
      return;
    }

    const newReview = {
      id: Date.now(),
      productId: record.productId,
      productName: record.productName,
      reviewer: JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').nickname || '익명',
      rating,
      comment: comment.trim(),
      date: new Date().toISOString().slice(0, 10),
      reservationId: record.id,
    };

    // 리뷰 저장
    const reviews = JSON.parse(localStorage.getItem('userReviews') || '[]');
    reviews.push(newReview);
    localStorage.setItem('userReviews', JSON.stringify(reviews));

    // 포인트 적립
    addPoints(100, `${record.productName} 리뷰 작성`);

    // 예약 기록에 리뷰 완료 표시
    const records = JSON.parse(localStorage.getItem('reservationRecords') || '[]');
    const updatedRecords = records.map(r =>
      r.id === record.id ? { ...r, reviewed: true } : r
    );
    localStorage.setItem('reservationRecords', JSON.stringify(updatedRecords));

    setSubmitted(true);
    onSubmit(newReview);
  };

  if (submitted) {
    return (
      <div className="review-modal-overlay" onClick={onClose}>
        <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="review-success">
            <div className="review-success-icon">🎉</div>
            <h2>리뷰 작성 완료!</h2>
            <p>소중한 리뷰 감사해요.</p>
            <div className="point-reward">
              <span className="point-icon">💎</span>
              <span><strong>100 포인트</strong>가 적립되었어요!</span>
            </div>
            <button className="review-submit-btn" onClick={onClose}>확인</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="review-modal-close" onClick={onClose}>×</button>

        <h2 className="review-modal-title">리뷰 작성</h2>
        <p className="review-modal-subtitle">{record.productName}</p>
        <p className="review-modal-date">📅 {record.date} · {record.time}</p>

        <div className="review-point-notice">
          💎 리뷰 작성 시 <strong>100 포인트</strong> 적립!
        </div>

        {/* 별점 */}
        <div className="star-rating-section">
          <h3>별점</h3>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>
          <p className="star-label">
            {rating === 0 && '별점을 선택해주세요'}
            {rating === 1 && '😞 별로예요'}
            {rating === 2 && '😐 그저 그래요'}
            {rating === 3 && '🙂 보통이에요'}
            {rating === 4 && '😊 좋아요'}
            {rating === 5 && '🤩 최고예요!'}
          </p>
        </div>

        {/* 리뷰 텍스트 */}
        <div className="review-text-section">
          <h3>리뷰 내용 <span className="required">*10자 이상</span></h3>
          <textarea
            className="review-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="방탈출 경험을 자유롭게 작성해주세요! (스포일러 주의 😊)"
            maxLength={500}
          />
          <div className="review-char-count">
            <span className={comment.length < 10 ? 'insufficient' : 'sufficient'}>
              {comment.length}
            </span>
            /500자
          </div>
        </div>

        <button
          className="review-submit-btn"
          onClick={handleSubmit}
          disabled={rating === 0 || comment.trim().length < 10}
        >
          리뷰 등록하고 100P 받기 💎
        </button>
      </div>
    </div>
  );
}

export default ReviewModal;