// src/components/ReviewModal.jsx
import React, { useState } from 'react';
import { addReview } from '../services/reviewService';
import { updateReservationResult } from '../services/reservationService';
import { addPoints } from '../services/pointService';

const MAX_IMAGES = 3; // 최대 첨부 이미지 수

function ReviewModal({ record, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 이미지 관련
  const [imageFiles, setImageFiles] = useState([]);   // File 객체 배열
  const [imagePreviews, setImagePreviews] = useState([]); // 미리보기 URL 배열

  const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');

  // 이미지 선택
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const remaining = MAX_IMAGES - imageFiles.length;
    const selected = files.slice(0, remaining);

    const newPreviews = selected.map(f => URL.createObjectURL(f));
    setImageFiles(prev => [...prev, ...selected]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    e.target.value = ''; // 같은 파일 재선택 허용
  };

  // 이미지 제거
  const handleRemoveImage = (idx) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // 이미지 → base64 변환 (Firebase Storage 미연동 시 임시 방편)
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    if (!comment.trim()) { setMessage('리뷰 내용을 입력해주세요.'); return; }
    if (!loggedInUser?.uid) { setMessage('로그인이 필요해요.'); return; }

    setLoading(true);
    setMessage('');
    try {
      // 이미지 base64 변환 (Storage 미연동 시)
      // Firebase Storage 연동 후에는 uploadBytes로 교체하세요
      const imageUrls = await Promise.all(imageFiles.map(fileToBase64));

      await addReview({
        productId:   record.productId || record.id,
        productName: record.productName,
        uid:         loggedInUser.uid,
        reviewer:    loggedInUser.nickname,
        rating,
        comment:     comment.trim(),
        imageUrls,
        date:        new Date().toISOString().slice(0, 10),
        reservationId: record.id,
      });

      // 예약에 reviewed 마킹
      await updateReservationResult(record.id, { reviewed: true });

      // 리뷰 포인트 지급 (100P)
      await addPoints(loggedInUser.uid, 100, `✍️ ${record.productName} 리뷰 작성 포인트`);

      setMessage('✅ 리뷰가 등록됐어요! +100P 지급!');
      setTimeout(() => {
        onSubmit && onSubmit();
      }, 1200);
    } catch (e) {
      console.error('리뷰 등록 실패:', e);
      setMessage('리뷰 등록 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-secondary)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '460px', margin: '0 16px', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05em' }}>✍️ 리뷰 작성</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82em', color: 'var(--text-muted)' }}>
              {record.productName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.4em', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* 별점 */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '0.85em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            별점
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '2em', lineHeight: 1,
                  color: star <= (hoverRating || rating) ? '#f5c518' : 'var(--text-muted)',
                  transition: 'color 0.1s, transform 0.1s',
                  transform: star <= (hoverRating || rating) ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                ★
              </button>
            ))}
            <span style={{ alignSelf: 'center', fontSize: '0.85em', color: 'var(--text-muted)', marginLeft: '6px' }}>
              {['', '별로예요', '아쉬워요', '보통이에요', '좋아요', '최고예요!'][hoverRating || rating]}
            </span>
          </div>
        </div>

        {/* 리뷰 내용 */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '0.85em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            리뷰 내용
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="테마에 대한 솔직한 후기를 남겨주세요. (스포일러 주의!)"
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: 'var(--text-primary)',
              fontSize: '0.9em',
              resize: 'vertical',
              fontFamily: 'Noto Sans KR, sans-serif',
            }}
          />
          <div style={{ textAlign: 'right', fontSize: '0.78em', color: 'var(--text-muted)', marginTop: '4px' }}>
            {comment.length}자
          </div>
        </div>

        {/* 이미지 첨부 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            📷 사진 첨부 <span style={{ fontSize: '0.85em' }}>(최대 {MAX_IMAGES}장, 선택)</span>
          </label>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* 미리보기 */}
            {imagePreviews.map((url, idx) => (
              <div key={idx} style={{ position: 'relative', width: '90px', height: '90px' }}>
                <img
                  src={url}
                  alt={`첨부 ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <button
                  onClick={() => handleRemoveImage(idx)}
                  style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    width: '20px', height: '20px',
                    borderRadius: '50%', border: 'none',
                    background: '#ff6b7a', color: '#fff',
                    fontSize: '0.75em', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            {/* 추가 버튼 */}
            {imageFiles.length < MAX_IMAGES && (
              <label
                style={{
                  width: '90px', height: '90px',
                  border: '2px dashed var(--border)',
                  borderRadius: '8px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-muted)',
                  fontSize: '0.78em', gap: '4px',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-gold)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ fontSize: '1.6em' }}>+</span>
                <span>사진 추가</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          {imageFiles.length > 0 && (
            <p style={{ fontSize: '0.78em', color: 'var(--text-muted)', marginTop: '6px' }}>
              💡 Firebase Storage 연동 후 실제 URL로 저장돼요. 현재는 base64로 임시 저장됩니다.
            </p>
          )}
        </div>

        {/* 메시지 */}
        {message && (
          <p style={{
            fontSize: '0.88em',
            color: message.startsWith('✅') ? '#6fcf97' : '#ff6b7a',
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            {message}
          </p>
        )}

        {/* 포인트 안내 */}
        <div style={{
          background: 'rgba(212,168,67,0.1)',
          border: '1px solid rgba(212,168,67,0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '0.83em',
          color: 'var(--accent-gold)',
        }}>
          💎 리뷰 작성 시 <strong>+100P</strong> 지급돼요!
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: 'var(--accent-gold)',
              border: 'none',
              borderRadius: '8px',
              color: '#1a1a1a',
              fontWeight: 'bold',
              fontSize: '0.95em',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'Noto Sans KR, sans-serif',
            }}
          >
            {loading ? '등록 중...' : '리뷰 등록하기'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 20px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.9em',
              fontFamily: 'Noto Sans KR, sans-serif',
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewModal;
