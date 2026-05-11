import React, { useState, useEffect, useRef } from 'react';
import '../styles/Global.css';
import '../styles/ReservationPage.css';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import BoxModal from '../components/BoxModal';

import productsData, { districtsMap } from '../data/products.js';
import { isFavorite, toggleFavorite } from '../utils/FavoriteUtils';

// ===== 카드 컴포넌트 =====
function ProductCard({ product, onClick }) {
  const [favorited, setFavorited] = useState(isFavorite(product.id));

  return (
    <div className="search-result-item" onClick={() => onClick(product)}>
      {product.imageUrl && (
        <div className="image-wrapper">
          <img src={product.imageUrl} alt={product.title} className="product-image" />
          <button
            className={`card-favorite-btn ${favorited ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              const result = toggleFavorite(product);
              setFavorited(result);
            }}
          >
            {favorited ? '⭐' : '☆'}
          </button>
        </div>
      )}
      <div className="card-body">
        <strong>{product.title}</strong>
        <span>⭐ {product.rating} ({product.reviewCount} 리뷰)</span>
        <span>테마: {product.theme}</span>
        <span>위치: {product.location.city} {product.location.district}</span>
        <span>2인 가격: {product.priceTable['2인'].toLocaleString()}원</span>
      </div>
      <button
        className="reserve-button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(product);
        }}
      >
        예약하기
      </button>
    </div>
  );
}

// ===== 메인 페이지 =====
function ReservationPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCity, setSelectedCity] = useState('선택 안함');
  const [selectedDistrict, setSelectedDistrict] = useState('선택 안함');
  const [selectedTheme, setSelectedTheme] = useState('선택 안함');
  const [selectedTime, setSelectedTime] = useState('선택 안함');
  const [searchResults, setSearchResults] = useState([]);

  // 검색 관련 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    return JSON.parse(localStorage.getItem('recentSearches') || '[]');
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // 자동완성 후보 — 입력값 기반으로 테마명 필터링
  const suggestions = inputValue.trim().length > 0
    ? productsData
        .filter(p =>
          p.title.toLowerCase().includes(inputValue.toLowerCase()) ||
          p.theme.toLowerCase().includes(inputValue.toLowerCase())
        )
        .slice(0, 5)
    : [];

  // 검색창 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 필터 + 키워드 검색 적용
  useEffect(() => {
    let results = productsData;

    // 키워드 검색
    if (searchKeyword.trim() !== '') {
      results = results.filter(p =>
        p.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        p.theme.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        p.location.city.includes(searchKeyword) ||
        p.location.district.includes(searchKeyword)
      );
    }

    // 필터
    if (selectedCity !== '선택 안함') {
      results = results.filter(p => p.location.city === selectedCity);
    }
    if (selectedDistrict !== '선택 안함') {
      results = results.filter(p => p.location.district === selectedDistrict);
    }
    if (selectedTheme !== '선택 안함') {
      results = results.filter(p => p.theme === selectedTheme);
    }
    if (selectedTime !== '선택 안함') {
      results = results.filter(p =>
        p.availableTimes && p.availableTimes.includes(selectedTime)
      );
    }

    setSearchResults(results);
  }, [searchKeyword, selectedCity, selectedDistrict, selectedTheme, selectedTime]);

  // 검색 실행
  const handleSearch = (keyword) => {
    const trimmed = keyword.trim();
    setSearchKeyword(trimmed);
    setInputValue(trimmed);
    setShowSuggestions(false);

    if (trimmed === '') return;

    // 최근 검색어 저장 (중복 제거, 최대 5개)
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setSearchKeyword('');
    setInputValue('');
    setShowSuggestions(false);
  };

  // 최근 검색어 삭제
  const handleDeleteRecent = (keyword, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== keyword);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // 드롭다운 필터
  const rawCities = [...new Set(productsData.map(p => p.location.city).filter(Boolean))];
  const sortedCities = rawCities.sort((a, b) => {
    const priority = (city) => {
      if (city === '서울') return 1;
      if (city === '경기') return 2;
      return 3;
    };
    return priority(a) - priority(b) || a.localeCompare(b);
  });
  const availableCities = ['선택 안함', ...sortedCities];

  const rawDistricts = selectedCity && districtsMap[selectedCity]
    ? [...districtsMap[selectedCity]].sort()
    : [];
  const availableDistricts = ['선택 안함', ...rawDistricts];

  const allThemes = [...new Set(productsData.map(p => p.theme).filter(Boolean))].sort();
  const availableThemes = ['선택 안함', ...allThemes];

  const availableTimesHourly = ['선택 안함'];
  for (let h = 8; h <= 22; h++) {
    availableTimesHourly.push(`${h.toString().padStart(2, '0')}:00`);
  }

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
    setSelectedDistrict('선택 안함');
  };

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />

      <BoxMain>
        <div className="reservation-page-content">

          {/* ===== 검색창 ===== */}
          <section className="search-keyword-section" ref={searchRef}>
            <h2 className="section-title">방탈출 검색</h2>

            {/* 검색 입력창 */}
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-keyword-input"
                placeholder="테마명, 지역, 장르로 검색해보세요"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch(inputValue);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              {inputValue && (
                <button className="search-clear-btn" onClick={handleClearSearch}>✕</button>
              )}
              <button
                className="search-submit-btn"
                onClick={() => handleSearch(inputValue)}
              >
                검색
              </button>
            </div>

            {/* 자동완성 + 최근 검색어 드롭다운 */}
            {showSuggestions && (
              <div className="search-dropdown">
                {/* 자동완성 */}
                {suggestions.length > 0 && (
                  <div className="dropdown-section">
                    <p className="dropdown-label">🔍 연관 검색</p>
                    {suggestions.map(product => (
                      <button
                        key={product.id}
                        className="dropdown-item"
                        onClick={() => handleSearch(product.title)}
                      >
                        <span className="dropdown-item-title">{product.title}</span>
                        <span className="dropdown-item-sub">{product.theme} · {product.location.city}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 최근 검색어 */}
                {recentSearches.length > 0 && inputValue.trim() === '' && (
                  <div className="dropdown-section">
                    <p className="dropdown-label">🕐 최근 검색어</p>
                    {recentSearches.map(keyword => (
                      <button
                        key={keyword}
                        className="dropdown-item"
                        onClick={() => handleSearch(keyword)}
                      >
                        <span className="dropdown-item-title">{keyword}</span>
                        <span
                          className="dropdown-item-delete"
                          onClick={(e) => handleDeleteRecent(keyword, e)}
                        >
                          ✕
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 현재 검색어 표시 */}
            {searchKeyword && (
              <div className="search-active-tag">
                <span>🔍 "{searchKeyword}" 검색 중</span>
                <button onClick={handleClearSearch}>✕ 초기화</button>
              </div>
            )}
          </section>

          {/* ===== 필터 ===== */}
          <section className="filter-selection-section">
            <div className="filter-options">
              <div className="filter-group">
                <label htmlFor="city-select" className="filter-label">시/도</label>
                <select
                  id="city-select"
                  className="filter-select"
                  value={selectedCity}
                  onChange={handleCityChange}
                >
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="district-select" className="filter-label">구/군</label>
                <select
                  id="district-select"
                  className="filter-select"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={selectedCity === '선택 안함'}
                >
                  {availableDistricts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="theme-select" className="filter-label">테마</label>
                <select
                  id="theme-select"
                  className="filter-select"
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                >
                  {availableThemes.map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="time-select" className="filter-label">시간</label>
                <select
                  id="time-select"
                  className="filter-select"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                >
                  {availableTimesHourly.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ===== 검색 결과 ===== */}
          <section className="search-results-section">
            <h3 className="section-subtitle">
              테마 목록 ({searchResults.length}개)
              {searchKeyword && (
                <span style={{ fontSize: '0.7em', color: '#6f00ff', marginLeft: '10px' }}>
                  "{searchKeyword}" 검색 결과
                </span>
              )}
            </h3>
            {searchResults.length > 0 ? (
              <div className="search-results-grid">
                {searchResults.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={(product) => setSelectedProduct(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results-container">
                <p className="no-results-emoji">🔍</p>
                <p className="no-results-message">
                  "{searchKeyword}"에 대한 검색 결과가 없어요.
                </p>
                <button className="no-results-reset-btn" onClick={handleClearSearch}>
                  검색 초기화
                </button>
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