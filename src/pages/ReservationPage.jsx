// src/pages/ReservationPage.jsx
import React, { useState, useEffect } from 'react';
import '../styles/Global.css';
import '../styles/ReservationPage.css';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import BoxModal from '../components/BoxModal';

import { getAllProducts } from '../services/productService';
import { toggleFavorite } from '../utils/FavoriteUtils';
import { checkIsFavorite } from '../services/favoriteService';

const GENRE_OPTIONS = ['공포', '추리', 'SF', '판타지', '스릴러', '어드벤처', '로맨스', '코미디', '기타'];

// ===== 카드 컴포넌트 =====
function ProductCard({ product, onClick }) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
      if (!user?.uid) return;
      try {
        const status = await checkIsFavorite(user.uid, product.id);
        setFavorited(status);
      } catch (e) {
        console.error('즐겨찾기 확인 실패:', e);
      }
    };
    load();
  }, [product.id]);

  const minPrice = product.pricing?.length > 0
    ? Math.min(...product.pricing.map(p => Number(p.price) || 0))
    : null;

  return (
    <div className="search-result-item" onClick={() => onClick(product)}>
      <div className="image-wrapper">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} className="product-image" />
        ) : (
          <div className="product-image product-image-placeholder">🔐</div>
        )}
        <button
          className={`card-favorite-btn ${favorited ? 'active' : ''}`}
          onClick={async (e) => {
            e.stopPropagation();
            const result = await toggleFavorite(product);
            setFavorited(result);
          }}
        >
          {favorited ? '⭐' : '☆'}
        </button>
      </div>
      <div className="card-body">
        <strong>{product.title}</strong>
        <span>⭐ {product.rating?.toFixed(1) || '0.0'} ({product.reviewCount || 0} 리뷰)</span>
        <span>🎭 {product.genre}</span>
        <span>📍 {product.address || product.branch}</span>
        {minPrice !== null && (
          <span>💰 {product.minPeople}인~ {minPrice.toLocaleString()}원</span>
        )}
      </div>
      <button
        className="reserve-button"
        onClick={(e) => { e.stopPropagation(); onClick(product); }}
      >
        예약하기
      </button>
    </div>
  );
}

// ===== 태그 칩 컴포넌트 =====
function ChipGroup({ label, options, selected, onSelect, emoji }) {
  return (
    <div className="chip-group">
      <span className="chip-group-label">{emoji} {label}</span>
      <div className="chip-list">
        <button
          className={`chip ${selected === '전체' || !selected ? 'active' : ''}`}
          onClick={() => onSelect('전체')}
        >
          전체
        </button>
        {options.map(opt => (
          <button
            key={opt}
            className={`chip ${selected === opt ? 'active' : ''}`}
            onClick={() => onSelect(opt === selected ? '전체' : opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== 메인 페이지 =====
function ReservationPage() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() =>
    JSON.parse(localStorage.getItem('recentSearches') || '[]')
  );

  const [selectedCity, setSelectedCity] = useState('전체');
  const [selectedGenre, setSelectedGenre] = useState('전체');
  const [showFilters, setShowFilters] = useState(false);

  const searchRef = React.useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllProducts();
        setAllProducts(data);
      } catch (e) {
        console.error('상품 불러오기 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 도시 목록 동적 생성
  const cities = [...new Set(
    allProducts.map(p => p.address?.split(' ')[0]).filter(Boolean)
  )].sort();

  // 필터링
  const searchResults = allProducts.filter(p => {
    const keyword = searchKeyword.toLowerCase();
    const matchKeyword = !searchKeyword ||
      p.title?.toLowerCase().includes(keyword) ||
      p.genre?.toLowerCase().includes(keyword) ||
      p.branch?.toLowerCase().includes(keyword) ||
      p.address?.toLowerCase().includes(keyword);
    const matchCity = selectedCity === '전체' || p.address?.includes(selectedCity);
    const matchGenre = selectedGenre === '전체' || p.genre === selectedGenre;
    return matchKeyword && matchCity && matchGenre;
  });

  const suggestions = inputValue.trim()
    ? allProducts
        .filter(p =>
          p.title?.toLowerCase().includes(inputValue.toLowerCase()) ||
          p.genre?.toLowerCase().includes(inputValue.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const handleSearch = (keyword) => {
    const trimmed = keyword.trim();
    setSearchKeyword(trimmed);
    setInputValue(trimmed);
    setShowSuggestions(false);
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    setInputValue('');
    setShowSuggestions(false);
  };

  const activeFilterCount = [selectedCity, selectedGenre].filter(v => v !== '전체').length;

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="reservation-page-content">

          {/* 검색창 */}
          <section className="search-keyword-section" ref={searchRef}>
            <h2 className="section-title">방탈출 검색</h2>

            <div className="search-bar-row">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-keyword-input"
                  placeholder="테마명, 지역, 장르로 검색"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(inputValue); }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {inputValue && (
                  <button className="search-clear-btn" onClick={handleClearSearch}>✕</button>
                )}
                <button className="search-submit-btn" onClick={() => handleSearch(inputValue)}>검색</button>
              </div>

              {/* 필터 토글 버튼 */}
              <button
                className={`filter-toggle-btn ${activeFilterCount > 0 ? 'has-filter' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                🎛 필터{activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
              </button>
            </div>

            {/* 자동완성 드롭다운 */}
            {showSuggestions && (suggestions.length > 0 || (recentSearches.length > 0 && !inputValue.trim())) && (
              <div className="search-dropdown">
                {suggestions.length > 0 && (
                  <div className="dropdown-section">
                    <p className="dropdown-label">🔍 연관 검색</p>
                    {suggestions.map(product => (
                      <button key={product.id} className="dropdown-item"
                        onClick={() => handleSearch(product.title)}>
                        <span className="dropdown-item-title">{product.title}</span>
                        <span className="dropdown-item-sub">{product.genre} · {product.branch}</span>
                      </button>
                    ))}
                  </div>
                )}
                {recentSearches.length > 0 && !inputValue.trim() && (
                  <div className="dropdown-section">
                    <p className="dropdown-label">🕐 최근 검색어</p>
                    {recentSearches.map(keyword => (
                      <button key={keyword} className="dropdown-item" onClick={() => handleSearch(keyword)}>
                        <span className="dropdown-item-title">{keyword}</span>
                        <span className="dropdown-item-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = recentSearches.filter(s => s !== keyword);
                            setRecentSearches(updated);
                            localStorage.setItem('recentSearches', JSON.stringify(updated));
                          }}>✕</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {searchKeyword && (
              <div className="search-active-tag">
                <span>🔍 "{searchKeyword}" 검색 중</span>
                <button onClick={handleClearSearch}>✕ 초기화</button>
              </div>
            )}
          </section>

          {/* 태그 칩 필터 */}
          {showFilters && (
            <section className="chip-filter-section">
              <div className="chip-filter-header">
                <span>필터</span>
                <button className="chip-reset-btn"
                  onClick={() => { setSelectedCity('전체'); setSelectedGenre('전체'); }}>
                  초기화
                </button>
              </div>

              <ChipGroup
                label="지역"
                emoji="📍"
                options={cities}
                selected={selectedCity}
                onSelect={setSelectedCity}
              />
              <ChipGroup
                label="장르"
                emoji="🎭"
                options={GENRE_OPTIONS}
                selected={selectedGenre}
                onSelect={setSelectedGenre}
              />
            </section>
          )}

          {/* 활성 필터 태그 표시 */}
          {activeFilterCount > 0 && (
            <div className="active-chips-row">
              {selectedCity !== '전체' && (
                <span className="active-chip">
                  📍 {selectedCity}
                  <button onClick={() => setSelectedCity('전체')}>✕</button>
                </span>
              )}
              {selectedGenre !== '전체' && (
                <span className="active-chip">
                  🎭 {selectedGenre}
                  <button onClick={() => setSelectedGenre('전체')}>✕</button>
                </span>
              )}
            </div>
          )}

          {/* 검색 결과 */}
          <section className="search-results-section">
            <h3 className="section-subtitle">
              테마 목록 ({loading ? '...' : searchResults.length}개)
              {searchKeyword && (
                <span style={{ fontSize: '0.7em', color: 'var(--accent-gold)', marginLeft: '10px' }}>
                  "{searchKeyword}" 검색 결과
                </span>
              )}
            </h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                불러오는 중...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="search-results-grid">
                {searchResults.map(product => (
                  <ProductCard key={product.id} product={product}
                    onClick={(p) => setSelectedProduct(p)} />
                ))}
              </div>
            ) : (
              <div className="no-results-container">
                <p className="no-results-emoji">🔍</p>
                <p className="no-results-message">
                  {searchKeyword ? `"${searchKeyword}"에 대한 검색 결과가 없어요.` : '등록된 테마가 없어요.'}
                </p>
                {searchKeyword && (
                  <button className="no-results-reset-btn" onClick={handleClearSearch}>
                    검색 초기화
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
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

export default ReservationPage;