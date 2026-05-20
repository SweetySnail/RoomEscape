// src/components/SeasonalSlider.jsx
import React, { useRef, useEffect } from 'react';
import '../styles/SeasonalSlider.css';

// D-Day 계산
const getDDay = (operationEnd) => {
  if (!operationEnd) return null;
  const diff = Math.ceil((new Date(operationEnd) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '종료';
  if (diff === 0) return 'D-DAY';
  return `D-${diff}`;
};

// ===== 드래그 스크롤 훅 =====
function useDragScroll() {
  const ref = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const moved = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMouseDown = (e) => {
      isDragging.current = true;
      moved.current = false;
      startX.current = e.pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      const x = e.pageX - el.offsetLeft;
      const dist = x - startX.current;
      if (Math.abs(dist) > 4) moved.current = true;
      el.scrollLeft = scrollLeft.current - dist;
    };
    const onMouseUp = () => {
      isDragging.current = false;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    };
    const onClickCapture = (e) => {
      if (moved.current) e.stopPropagation();
    };

    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('click', onClickCapture, true);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return ref;
}

function SeasonalSlider({ products, handleBoxClick }) {
  const scrollRef = useDragScroll();

  if (products.length === 0) return null;

  return (
    <div className="seasonal-section">
      {/* 헤더 */}
      <div className="seasonal-header">
        <div className="seasonal-title-row">
          <span className="seasonal-icon">🎃</span>
          <h2 className="seasonal-title">시즌 한정 이벤트</h2>
          <span className="seasonal-badge">LIMITED</span>
        </div>
        <p className="seasonal-subtitle">기간 한정! 놓치면 아쉬운 특별 체험</p>
      </div>

      {/* 드래그 스크롤 트랙 */}
      <div className="seasonal-scroll-track" ref={scrollRef}>
        {products.map((product) => {
          const dday = getDDay(product.operationEnd);
          const isUrgent =
            dday && dday !== '종료' && dday !== 'D-DAY' &&
            parseInt(dday.replace('D-', '')) <= 7;

          return (
            <div
              key={product.id}
              className="seasonal-card"
              onClick={() => handleBoxClick(product)}
            >
              {/* 이미지 */}
              <div className="seasonal-card-img-wrap">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.title} className="seasonal-card-img" />
                ) : (
                  <div className="seasonal-card-img seasonal-card-img-placeholder">🎃</div>
                )}
                {dday && (
                  <span className={`seasonal-dday-badge ${isUrgent ? 'urgent' : ''}`}>
                    {dday}
                  </span>
                )}
                <span className="seasonal-limited-badge">기간한정</span>
              </div>

              {/* 정보 */}
              <div className="seasonal-card-body">
                <strong className="seasonal-card-title">{product.title}</strong>
                {product.venue && (
                  <span className="seasonal-card-venue">📍 {product.venue}</span>
                )}
                {product.operationStart && product.operationEnd && (
                  <span className="seasonal-card-period">
                    {product.operationStart} ~ {product.operationEnd}
                  </span>
                )}
                <span className="seasonal-card-genre">{product.genre}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SeasonalSlider;