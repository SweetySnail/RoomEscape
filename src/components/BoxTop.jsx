import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Global.css';
import '../styles/HomePage.css';

function BoxTop() {
  const navigate = useNavigate();
  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="fixed-header-container">
      <div className="header-content-wrapper"> 
        <button className="page-button home-button" onClick={() => handleNavigate('/')}>
          RoomEscape
        </button>
        <button className="page-button" onClick={() => handleNavigate('/login')}>
          로그인/회원가입
        </button>
      </div>
    </div>
  );
}

export default BoxTop;