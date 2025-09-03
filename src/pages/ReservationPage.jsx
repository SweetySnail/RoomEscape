import React, { useState, useEffect } from 'react';
import '../styles/Global.css'; // 공통 스타일
import '../styles/ReservationPage.css'; // 예약 페이지 전용 스타일

// 분리해둔 공통 컴포넌트들을 불러오자!
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';

// 방탈출 데이터를 임포트 (HomePage에서 사용하던 productsData 재활용)
import productsData from '../data/products'; 

function ReservationPage() {
  // ⭐ 검색 관련 상태들!
  const [searchTerm, setSearchTerm] = useState(''); // 사용자가 입력하는 검색어
  const [recentSearches, setRecentSearches] = useState([]); // 최근 검색어 목록
  const [searchResults, setSearchResults] = useState([]); // 검색 결과 목록

  // ⭐ 컴포넌트 로드 시 로컬 스토리지에서 최근 검색어 불러오기
  useEffect(() => {
    const storedSearches = localStorage.getItem('recentSearches');
    if (storedSearches) {
      setRecentSearches(JSON.parse(storedSearches));
    }
  }, []);

  // ⭐ 검색어 입력 핸들러
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ⭐ 검색 버튼 클릭 또는 Enter 키 입력 핸들러
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지

    if (searchTerm.trim() === '') { // 검색어가 비어있으면 아무것도 안 함
      setSearchResults([]); // 검색 결과 초기화
      return;
    }

    // 1. 최근 검색 기록 업데이트
    const updatedRecentSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5); // 최대 5개 유지
    setRecentSearches(updatedRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecentSearches)); // 로컬 스토리지에 저장

    // 2. 검색 결과 필터링
    const filteredProducts = productsData.filter(product =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) || // 제목에 검색어 포함
      (product.theme && product.theme.toLowerCase().includes(searchTerm.toLowerCase())) // 테마에 검색어 포함 (productsData에 theme 추가 필요!)
      // 여기에 필요한 다른 검색 조건 추가 가능 (예: 지역, 평점 등)
    );
    setSearchResults(filteredProducts);

    setSearchTerm(''); // 검색 후 검색창 비우기 (선택 사항)
  };

  // ⭐ 최근 검색어 클릭 핸들러
  const handleRecentSearchClick = (search) => {
    setSearchTerm(search); // 클릭한 검색어로 검색창 채우기
    // 바로 검색 결과 보여주고 싶으면 handleSearchSubmit 호출
    // 임시 검색 이벤트를 만들어 handleSearchSubmit에 전달
    handleSearchSubmit({ preventDefault: () => {} }); 
  };
  
  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />

      <BoxMain> {/* 모든 메인 콘텐츠는 이 래퍼 안에! */}
        <div className="reservation-page-content"> {/* 예약 페이지 전용 콘텐츠 래퍼 */}
          {/* ⭐ 1. 검색창 */}
          <section className="search-section">
            <h2 className="section-title">방탈출 검색</h2>
            <form onSubmit={handleSearchSubmit} className="search-form">
              <input
                type="text"
                placeholder="방탈출 제목 또는 테마를 검색해보세요!"
                value={searchTerm}
                onChange={handleSearchInputChange}
                className="search-input"
              />
              <button type="submit" className="search-button">검색</button>
            </form>
          </section>

          {/* ⭐ 2. 최근 검색 기록 */}
          <section className="recent-searches-section">
            <h3 className="section-subtitle">최근 검색어</h3>
            {recentSearches.length > 0 ? (
              <div className="recent-searches-tags">
                {recentSearches.map((search, index) => (
                  <span
                    key={index}
                    className="recent-search-tag clickable"
                    onClick={() => handleRecentSearchClick(search)}
                  >
                    {search}
                  </span>
                ))}
              </div>
            ) : (
              <p className="no-recent-searches">최근 검색 기록이 없어요.</p>
            )}
          </section>

          {/* ⭐ 3. 검색 결과 */}
          <section className="search-results-section">
            <h3 className="section-subtitle">검색 결과</h3>
            {searchResults.length > 0 ? (
              <div className="search-results-grid">
                {searchResults.map(product => (
                  <div key={product.id} className="search-result-item empty-box clickable">
                    {/* empty-box 스타일 재활용! */}
                    <strong>{product.title}</strong><br/>
                    <span>⭐ {product.rating} ({product.reviewCount} 리뷰)</span><br/>
                    <span>테마: {product.theme}</span>
                    {/* ⭐ 예약 버튼 같은 액션 추가 가능 */}
                    <button className="reserve-button">예약하기</button>
                  </div>
                ))}
              </div>
            ) : searchTerm.trim() !== '' ? (
              <p className="no-results-message">'{searchTerm}'에 대한 검색 결과가 없어요.</p>
            ) : (
              <p className="initial-search-message">검색어를 입력하고 방탈출을 찾아보세요!</p>
            )}
          </section>
        </div>
      </BoxMain>
    </div>
  );
}

export default ReservationPage;