import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Global.css';

function ListPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/'); // 기본 페이지('/')로 돌아가기
  };

  return (
    <div className="page-container">
      <h2>목록 페이지</h2>
      <p>상품 목록이나 게시물 목록이 들어갈 공간이에요!</p>
      <button className="page-button" onClick={handleGoBack}>
        뒤로 가기 (기본 페이지로)
      </button>

      <div className="rating">
        <h2>이건 테스트용도입니다?</h2>
          <input value="5" name="rating" id="star5" type="radio"/>
          <label for="star5"></label>
          <input value="4" name="rating" id="star4" type="radio"/>
          <label for="star4"></label>
          <input value="3" name="rating" id="star3" type="radio"/>
          <label for="star3"></label>
          <input value="2" name="rating" id="star2" type="radio"/>
          <label for="star2"></label>
          <input value="1" name="rating" id="star1" type="radio"/>
          <label for="star1"></label>
      </div>
    </div>


  );
}

export default ListPage;