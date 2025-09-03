import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Global.css';
import '../styles/BoxRight.css';

function BoxRight() {
  const navigate = useNavigate();
  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="right-fixed-box">
      <button className="page-button" onClick={() => handleNavigate('/reserve')}>
        예약
      </button>
      <button className="page-button" onClick={() => handleNavigate('/calendar')}>
        캘린더
      </button>
      <button className="page-button" onClick={() => handleNavigate('/calendar')}>
        이벤트
      </button>
      <button className="page-button" onClick={() => handleNavigate('/calendar')}>
        마이페이지
      </button>
    </div>
  );
}

export default BoxRight;