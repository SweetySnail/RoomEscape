import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import BoxModal from '../components/BoxModal';
import SeasonalSlider from '../components/SeasonalSlider';
import { getAllProducts, getTemporaryProducts } from '../services/productService';
import '../styles/Global.css';
import '../styles/HomePage.css';

// D-Day 계산
const getDDay = (endDate) => {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '종료';
  if (diff === 0) return 'D-DAY';
  return `D-${diff}`;
};

// 난이도 변환 (별표 대신 자물쇠 아이콘으로 별점과 구분)
const difficultyLabel = (d) => {
  const map = {
    easy:   '🔓 쉬움',
    normal: '🔒 보통',
    hard:   '🔐 어려움',
    expert: '⛓️ 전문가',
  };
  return map[d] || d;
};

// ===== 홈 카드 컴포넌트 =====
function HomeCard({ product, onClick, showDday }) {
  const dday = showDday ? getDDay(product.operationEnd) : null;
  const minPrice = product.pricing?.length > 0
    ? Math.min(...product.pricing.map(p => Number(p.price) || 0))
    : null;

  return (
    <div className="home-card" onClick={() => onClick(product)}>
      <div className="home-card-img-wrap">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} className="home-card-img" />
        ) : (
          <div className="home-card-img home-card-placeholder">🔐</div>
        )}
        {dday && (
          <span className={`home-card-dday ${parseInt(dday.replace('D-', '')) <= 7 ? 'urgent' : ''}`}>
            {dday}
          </span>
        )}
        <span className="home-card-genre-badge">{product.genre}</span>
      </div>
      <div className="home-card-body">
        <strong className="home-card-title">{product.title}</strong>
        <span className="home-card-branch">🏪 {product.branch}</span>
        <div className="home-card-meta">
          <span className="home-card-rating">⭐ {(product.rating || 0).toFixed(1)}</span>
          <span className="home-card-difficulty">{difficultyLabel(product.difficulty)}</span>
        </div>
        {minPrice !== null && (
          <span className="home-card-price">{minPrice.toLocaleString()}원~</span>
        )}
      </div>
    </div>
  );
}

// ===== 드래그 스크롤 훅 (마우스 + 터치 공통) =====
function useDragScroll() {
  const ref = React.useRef(null);
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);
  const moved = React.useRef(false);

  React.useEffect(() => {
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
    // 카드 클릭이 드래그 후 발동되지 않도록 — capture 단계에서 막음
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

// ===== 가로 스크롤 섹션 (드래그 + 터치 스크롤) =====
function HorizontalSection({ title, icon, products, onCardClick, showDday, accentColor }) {
  const scrollRef = useDragScroll();

  if (products.length === 0) return null;

  return (
    <div className="h-section">
      <div className="h-section-header">
        <div className="h-section-title-row">
          <span className="h-section-icon" style={{ color: accentColor }}>{icon}</span>
          <h2 className="h-section-title" style={{ color: accentColor }}>{title}</h2>
        </div>
      </div>
      <div className="h-scroll-track" ref={scrollRef}>
        {products.map(p => (
          <HomeCard key={p.id} product={p} onClick={onCardClick} showDday={showDday} />
        ))}
      </div>
    </div>
  );
}

// ===== 장르별 탐색 섹션 =====
const GENRES = ['전체', '공포', '추리', 'SF', '판타지', '스릴러', '어드벤처', '로맨스', '코미디', '기타'];

function GenreSection({ products, onCardClick }) {
  const [selectedGenre, setSelectedGenre] = useState('전체');

  const filtered = selectedGenre === '전체'
    ? products
    : products.filter(p => p.genre === selectedGenre);

  return (
    <div className="genre-section">
      <div className="h-section-header">
        <div className="h-section-title-row">
          <span className="h-section-icon" style={{ color: 'var(--accent-gold)' }}>🎭</span>
          <h2 className="h-section-title" style={{ color: 'var(--accent-gold)' }}>장르별 탐색</h2>
        </div>
      </div>

      {/* 장르 칩 */}
      <div className="genre-chips">
        {GENRES.map(g => (
          <button
            key={g}
            className={`genre-chip ${selectedGenre === g ? 'active' : ''}`}
            onClick={() => setSelectedGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      {filtered.length > 0 ? (
        <div className="genre-grid">
          {filtered.slice(0, 8).map(p => (
            <HomeCard key={p.id} product={p} onClick={onCardClick} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          해당 장르의 테마가 없어요.
        </div>
      )}
    </div>
  );
}

// ===== 메인 =====
function HomePage() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [seasonalProducts, setSeasonalProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [all, seasonal] = await Promise.all([
          getAllProducts(),
          getTemporaryProducts(),
        ]);
        setAllProducts(all);
        setSeasonalProducts(seasonal);
      } catch (e) {
        console.error('데이터 불러오기 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const topRated = [...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 10);
  const topReviewed = [...allProducts].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 10);

  const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        {/* ===== 히어로 배너 ===== */}
        <div className="hero-banner">
          <div className="hero-bg-overlay" />
          <div className="hero-content">
            <p className="hero-eyebrow">🔐 방탈출 예약 플랫폼</p>
            <h1 className="hero-title">
              탈출의 짜릿함,<br />
              <span className="hero-title-highlight">RoomEscape</span>에서
            </h1>
            <p className="hero-subtitle">
              전국 방탈출 테마를 한 곳에서 예약하세요
            </p>
            <div className="hero-buttons">
              <button className="hero-btn primary" onClick={() => navigate('/reserve')}>
                지금 예약하기 →
              </button>
              <button className="hero-btn secondary" onClick={() => navigate('/event')}>
                이벤트 보기
              </button>
            </div>
            {loggedInUser && (
              <p className="hero-welcome">
                👋 {loggedInUser.nickname}님, 오늘도 탈출에 도전해보세요!
              </p>
            )}
          </div>

          {/* 히어로 통계 */}
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>{allProducts.length}</strong>
              <span>등록 테마</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <strong>{allProducts.reduce((s, p) => s + (p.reviewCount || 0), 0).toLocaleString()}</strong>
              <span>누적 리뷰</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <strong>{seasonalProducts.length > 0 ? `${seasonalProducts.length}개` : '상시'}</strong>
              <span>시즌 이벤트</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            불러오는 중...
          </div>
        ) : (
          <>
            {/* 시즌 한정 */}
            {seasonalProducts.length > 0 && (
              <SeasonalSlider
                products={seasonalProducts}
                handleBoxClick={setSelectedProduct}
              />
            )}

            {/* 월간 인기 */}
            <HorizontalSection
              title="월간 인기 Top 5"
              icon="🏆"
              products={topRated}
              onCardClick={setSelectedProduct}
              accentColor="var(--accent-gold)"
            />

            {/* 인기 예약 */}
            <HorizontalSection
              title="인기 예약 Top 5"
              icon="📅"
              products={topReviewed}
              onCardClick={setSelectedProduct}
              accentColor="#6fcf97"
            />

            {/* 장르별 탐색 */}
            <GenreSection
              products={allProducts}
              onCardClick={setSelectedProduct}
            />
          </>
        )}
      </BoxMain>

      {selectedProduct && (
        <BoxModal
          productData={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

export default HomePage;