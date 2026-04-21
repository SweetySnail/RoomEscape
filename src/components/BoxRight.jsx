// src/components/BoxRight.jsx 전체 교체
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Global.css';
import '../styles/BoxRight.css';

function BoxRight() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menus = [
    { path: '/',         label: '홈',       icon: '🏠' },
    { path: '/reserve',  label: '예약',     icon: '🔍' },
    { path: '/calendar', label: '캘린더',   icon: '📅' },
    { path: '/event',    label: '이벤트',   icon: '🎉' },
    { path: '/mypage',   label: '마이페이지', icon: '👤' },
  ];

  // 모바일: 하단 탭바
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

  // 데스크톱: 기존 우측 사이드바
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