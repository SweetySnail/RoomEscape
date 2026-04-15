import React, { useState, useEffect } from 'react';
import '../styles/Global.css';
import '../styles/ReservationPage.css';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import BoxModal from '../components/BoxModal';

import productsData, { districtsMap } from '../data/products.js';

function ReservationPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCity, setSelectedCity] = useState('선택 안함');
  const [selectedDistrict, setSelectedDistrict] = useState('선택 안함');
  const [selectedTheme, setSelectedTheme] = useState('선택 안함');
  const [selectedTime, setSelectedTime] = useState('선택 안함');
  const [searchResults, setSearchResults] = useState([]);

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

  useEffect(() => {
    let results = productsData;
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
  }, [selectedCity, selectedDistrict, selectedTheme, selectedTime]);

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
          <section className="filter-selection-section">
            <h2 className="section-title">방탈출 검색</h2>
            <div className="filter-options">
              <div className="filter-group">
                <label htmlFor="city-select" className="filter-label">시/도</label>
                <select id="city-select" className="filter-select" value={selectedCity} onChange={handleCityChange}>
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
                <select id="theme-select" className="filter-select" value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
                  {availableThemes.map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="time-select" className="filter-label">시간</label>
                <select id="time-select" className="filter-select" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
                  {availableTimesHourly.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="search-results-section">
            <h3 className="section-subtitle">테마 목록 ({searchResults.length}개)</h3>
            {searchResults.length > 0 ? (
              <div className="search-results-grid">
                {searchResults.map(product => (
                  <div
                    key={product.id}
                    className="search-result-item"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.title} className="product-image" />
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
                        setSelectedProduct(product);
                      }}
                    >
                      예약하기
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-results-message">
                선택하신 조건에 맞는 방탈출이 없어요. 다른 필터를 선택해보세요!
              </p>
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