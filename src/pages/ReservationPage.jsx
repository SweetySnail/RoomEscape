import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Global.css';
import '../styles/ReservationPage.css';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';

// 추후 삭제(임시데이터)
import productsData, { districtsMap } from '../data/products.js';

function ReservationPage() {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState('선택 안함');
  const [selectedDistrict, setSelectedDistrict] = useState('선택 안함');
  const [selectedTheme, setSelectedTheme] = useState('선택 안함');
  const [selectedTime, setSelectedTime] = useState('선택 안함');
  const [searchResults, setSearchResults] = useState([]);

  // 시/도
  const rawCities = [...new Set(productsData.map(p => p.location.city).filter(Boolean))];
  const sortedCities = rawCities.sort((a, b) => {
    const priority = (city) => {
      if (city === '선택 안함') return 0;
      if (city === '서울') return 1;
      if (city === '경기') return 2;
      return 3;
    };
    return priority(a) - priority(b) || a.localeCompare(b);
  });
  const availableCities = ['선택 안함', ...sortedCities.filter(city => city !== '선택 안함')];

  // 구/군/구
  const rawDistricts = selectedCity && districtsMap[selectedCity] 
                       ? [...districtsMap[selectedCity]].sort()
                       : [];
  const availableDistricts = ['선택 안함', ...rawDistricts.filter(district => district !== '선택 안함')];

  // 테마
  const allThemes = [...new Set(productsData.map(p => p.theme).filter(Boolean))].sort();
  const availableThemes = ['선택 안함', ...allThemes];
  
  // 시간
  const availableTimesHourly = ['선택 안함'];
  for (let h = 8; h <= 22; h++) {
    availableTimesHourly.push(`${h.toString().padStart(2, '0')}:00`);
  }

  useEffect(() => {
    let currentFilteredResults = productsData; 
    
    // 필터링
    if (selectedCity !== '선택 안함') {
      currentFilteredResults = currentFilteredResults.filter(product => product.location.city === selectedCity);
    }
    if (selectedDistrict !== '선택 안함' && selectedCity !== '선택 안함') {
      currentFilteredResults = currentFilteredResults.filter(product => product.location.district === selectedDistrict);
    }
    if (selectedTheme !== '선택 안함') {
      currentFilteredResults = currentFilteredResults.filter(product => product.theme === selectedTheme);
    }
    if (selectedTime !== '선택 안함') {
      currentFilteredResults = currentFilteredResults.filter(product =>
        product.availableTimes && product.availableTimes.includes(selectedTime)
      );
    }
    setSearchResults(currentFilteredResults);
  }, [selectedCity, selectedDistrict, selectedTheme, selectedTime]);

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
    setSelectedDistrict('선택 안함');
  };
  const handleDistrictChange = (e) => setSelectedDistrict(e.target.value);
  const handleThemeChange = (e) => setSelectedTheme(e.target.value);
  const handleTimeChange = (e) => setSelectedTime(e.target.value);

  const handleProductClick = (product) => {
    console.log(`${product.title} 클릭! 상세 페이지로 이동할 예정입니다.`);
    // navigate(`/product/${product.id}`); // 나중에 상세 페이지 라우트 연결
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
                <label htmlFor="city-select" className="filter-label">시/도:</label>
                <select id="city-select" className="filter-select" value={selectedCity} onChange={handleCityChange}>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="district-select" className="filter-label">구/군/구:</label>
                <select 
                  id="district-select" 
                  className="filter-select" 
                  value={selectedDistrict} 
                  onChange={handleDistrictChange}
                  disabled={selectedCity === '선택 안함'}
                >
                  {availableDistricts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="theme-select" className="filter-label">테마:</label>
                <select id="theme-select" className="filter-select" value={selectedTheme} onChange={handleThemeChange}>
                  {availableThemes.map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="time-select" className="filter-label">시간:</label>
                <select id="time-select" className="filter-select" value={selectedTime} onChange={handleTimeChange}>
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
                  <div key={product.id} className="search-result-item empty-box clickable" onClick={() => handleProductClick(product)}>
                    {product.imageUrl && <img src={product.imageUrl} alt={product.title} className="product-image" />}
                    <strong>{product.title}</strong><br/>
                    <span>⭐ {product.rating} ({product.reviewCount} 리뷰)</span><br/>
                    <span>테마: {product.theme}</span><br/>
                    <span>위치: {product.location.city} {product.location.district}</span><br/> 
                    <span>2인 가격: {product.priceTable['2인'].toLocaleString()}원</span><br/>
                    
                    <button className="reserve-button">예약하기</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-results-message">선택하신 조건에 맞는 방탈출이 없어요. 다른 필터를 선택해보세요!</p>
            )}
          </section>
        </div>
      </BoxMain>
    </div>
  );
}

export default ReservationPage;