// src/components/SeasonalSlider.jsx
import React, { useRef, useState, useEffect } from 'react';
import '../styles/BoxSlider.css';
import '../styles/SeasonalSlider.css';

// D-Day 계산
const getDDay = (operationEnd) => {
  if (!operationEnd) return null;
  const diff = Math.ceil((new Date(operationEnd) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '종료';
  if (diff === 0) return 'D-DAY';
  return `D-${diff}`;
};

function SeasonalSlider({ products, handleBoxClick }) {
  const itemWidth = 180 + (10 * 2);
  const itemsPerPage = 4;
  const trackRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const clonedProducts = products.length > 0 ? [
    ...products.slice(Math.max(products.length - itemsPerPage, 0)),
    ...products,
    ...products.slice(0, itemsPerPage),
  ] : [];

  useEffect(() => {
    if (products.length === 0 || !trackRef.current) return;
    trackRef.current.style.transition = 'none';
    trackRef.current.style.transform = `translateX(-${products.length * itemWidth}px)`;
    setCurrentIndex(products.length);
    setTimeout(() => {
      if (trackRef.current) trackRef.current.style.transition = 'transform 0.8s ease-in-out';
    }, 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  useEffect(() => {
    if (products.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next >= clonedProducts.length - itemsPerPage) {
          if (trackRef.current) {
            trackRef.current.style.transition = 'none';
            trackRef.current.style.transform = `translateX(-${products.length * itemWidth}px)`;
            setTimeout(() => {
              if (trackRef.current) trackRef.current.style.transition = 'transform 0.8s ease-in-out';
            }, 0);
          }
          return products.length;
        }
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [clonedProducts.length, products.length, itemWidth, itemsPerPage]);

  const goNext = () => {
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= clonedProducts.length - itemsPerPage) {
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = `translateX(-${products.length * itemWidth}px)`;
          setTimeout(() => {
            if (trackRef.current) trackRef.current.style.transition = 'transform 0.8s ease-in-out';
          }, 0);
        }
        return products.length;
      }
      return next;
    });
  };

  const goPrev = () => {
    setCurrentIndex(prev => {
      const next = prev - 1;
      if (next < products.length) {
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = `translateX(-${(products.length * 2) * itemWidth}px)`;
          setTimeout(() => {
            if (trackRef.current) trackRef.current.style.transition = 'transform 0.8s ease-in-out';
          }, 0);
        }
        return (products.length * 2) - 1;
      }
      return next;
    });
  };

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

      {/* 캐러셀 */}
      <div className="seasonal-carousel-container">
        <div
          className="carousel-track"
          ref={trackRef}
          style={{ transform: `translateX(-${currentIndex * itemWidth}px)` }}
        >
          {clonedProducts.map((product, index) => {
            const dday = getDDay(product.operationEnd);
            const isUrgent = dday && dday !== '종료' && dday !== 'D-DAY' &&
              parseInt(dday.replace('D-', '')) <= 7;

            return (
              <div
                key={`${product.id}-${index}`}
                className="seasonal-card"
                onClick={() => handleBoxClick(product)}
              >
                {/* 이미지 */}
                <div className="seasonal-card-img-wrap">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title}
                      className="seasonal-card-img" />
                  ) : (
                    <div className="seasonal-card-img seasonal-card-img-placeholder">🎃</div>
                  )}

                  {/* D-Day 배지 */}
                  {dday && (
                    <span className={`seasonal-dday-badge ${isUrgent ? 'urgent' : ''}`}>
                      {dday}
                    </span>
                  )}

                  {/* 기간 한정 배지 */}
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

        <button className="carousel-button prev" onClick={goPrev}>&#10094;</button>
        <button className="carousel-button next" onClick={goNext}>&#10095;</button>
      </div>
    </div>
  );
}

export default SeasonalSlider;