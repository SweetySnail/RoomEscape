import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Global.css';
import '../styles/BoxRight.css';

function BoxRight() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const user = sessionStorage.getItem('loggedInUser');
    return user ? JSON.parse(user) : null;
  });

  useEffect(() => {
    const handleChange = () => {
      const user = sessionStorage.getItem('loggedInUser');
      setLoggedInUser(user ? JSON.parse(user) : null);
    };
    window.addEventListener('loginStateChange', handleChange);
    return () => window.removeEventListener('loginStateChange', handleChange);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSuper = loggedInUser?.adminRole === 'super';
  const isStore = loggedInUser?.adminRole === 'store';
  const isUser  = loggedInUser && !isSuper && !isStore;

  // 역할별 메뉴
  const getMenus = () => {
    if (isSuper) {
      return [
        { path: '/super-admin', label: '대시보드',  icon: '📊' },
      ];
    }
    if (isStore) {
      return [
        { path: '/admin',      label: '대시보드',  icon: '📊' },
        { path: '/admin/reservations', label: '예약관리', icon: '📋' },
      ];
    }
    // 일반 사용자 + 익명
    return [
      { path: '/',         label: '홈',        icon: '🏠' },
      { path: '/reserve',  label: '예약',      icon: '🔍' },
      { path: '/event',    label: '이벤트',    icon: '🎉' },
      ...(isUser ? [
        { path: '/calendar', label: '캘린더',  icon: '📅' },
        { path: '/mypage',   label: '마이페이지', icon: '👤' },
      ] : [
        { path: '/login',    label: '로그인',  icon: '🔑' },
      ]),
    ];
  };

  const menus = getMenus();

  if (isMobile) {
    return (
      <nav className="bottom-tab-bar">
        {menus.map(menu => (
          <button
            key={menu.path}
            className={`bottom-tab-btn ${location.pathname === menu.path ? 'active' : ''}`}
            onClick={() => navigate(menu.path)}
          >
            <span className="bottom-tab-icon">{menu.icon}</span>
            <span className="bottom-tab-label">{menu.label}</span>
          </button>
        ))}
      </nav>
    );
  }

  return (
    <div className="right-fixed-box">
      {menus.map(menu => (
        <button
          key={menu.path}
          className={`page-button ${location.pathname === menu.path ? 'active' : ''}`}
          onClick={() => navigate(menu.path)}
        >
          {menu.icon} {menu.label}
        </button>
      ))}
    </div>
  );
}

export default BoxRight;