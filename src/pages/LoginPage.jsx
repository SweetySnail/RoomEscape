  import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Global.css';

function LoginPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="page-container">
      <h2>로그인 페이지</h2>
      <p>로그인 폼이 들어갈 공간이에요!</p>
      <button className="page-button" onClick={handleGoBack}>
        뒤로 가기 (기본 페이지로)
      </button>
    </div>
  );
}

export default LoginPage;