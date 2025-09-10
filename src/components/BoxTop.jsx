import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Global.css';
import '../styles/HomePage.css';

function BoxTop() {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    const user = sessionStorage.getItem('loggedInUser');
    if (user) {
      setLoggedInUser(JSON.parse(user)); // 로그인된 사용자 정보 설정
    } else {
      setLoggedInUser(null); // 로그아웃 상태
    }

    // 로그인/로그아웃 이벤트 감지
    const handleStorageChange = () => {
      const user = sessionStorage.getItem('loggedInUser');
      setLoggedInUser(user ? JSON.parse(user) : null);
    };

    window.addEventListener('storage', handleStorageChange); // storage 이벤트 리스너
    // 직접 호출하는 커스텀 이벤트 (LoginPage에서 로그인/로그아웃 시 dispatchEvent로 호출할 것)
    window.addEventListener('loginStateChange', handleStorageChange); 

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loginStateChange', handleStorageChange);
    };
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('loggedInUser'); // 세션 스토리지에서 사용자 정보 제거
    setLoggedInUser(null); // 상태 업데이트

    // 다른 컴포넌트(BoxTop, LoginPage)에 변경 알림 (동일한 이벤트를 dispatch)
    window.dispatchEvent(new Event('loginStateChange')); 

    alert('로그아웃 되었습니다.');
    navigate('/'); // 로그아웃 후 홈으로 이동
  };

  return (
     <header className="fixed-header-container">
      <div className="header-content-wrapper">
        <div className="logo-section">
          {/* 로고 클릭 시 홈으로 이동 */}
          <h1 onClick={() => handleNavigate('/')} style={{ cursor: 'pointer', margin: 0, fontSize: '1.8em', color: '#6f00ff' }}>
            Escape Room
          </h1>
        </div>
        <nav className="nav-section">
          {loggedInUser ? ( // ⭐⭐ 로그인된 상태 ⭐⭐
            <>
              {/* ⭐⭐ 닉네임님, 안녕하세요! 문구 ⭐⭐ */}
              <span className="welcome-message">
                {`[${loggedInUser.nickname}]님, 안녕하세요!`}
              </span>
              <button className="page-button logout-button" onClick={handleLogout}>로그아웃</button>
            </>
          ) : ( // ⭐⭐ 로그아웃된 상태 ⭐⭐
            <button className="page-button" onClick={() => handleNavigate('/login')}>로그인 / 회원가입</button>
          )}
        </nav>
      </div>
    </header>
  );
  //   <div className="fixed-header-container">
  //     <div className="header-content-wrapper"> 
  //       <button className="page-button home-button" onClick={() => handleNavigate('/')}>
  //         RoomEscape
  //       </button>
  //       <button className="page-button" onClick={() => handleNavigate('/login')}>
  //         로그인/회원가입
  //       </button>
  //     </div>
  //   </div>
  // );
}

export default BoxTop;