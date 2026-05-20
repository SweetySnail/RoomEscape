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

  const getMenus = () => {
    // 총괄 관리자
    if (isSuper) {
      return [
        { path: '/super-admin', label: '대시보드',   icon: '📊', tab: 'dashboard' },
        { path: '/super-admin', label: '사업자 등록', icon: '➕', tab: 'register' },
        { path: '/super-admin', label: '매장 관리',   icon: '🏪', tab: 'stores' },
        { path: '/super-admin', label: '수수료 정산', icon: '💳', tab: 'fee' },
        { path: '/super-admin', label: '계약 종료',   icon: '📁', tab: 'expired' },
      ];
    }

    // 매장 관리자
    if (isStore) {
      return [
        { path: '/admin', label: '대시보드',   icon: '📊', tab: 'dashboard' },
        { path: '/admin', label: '예약 관리',   icon: '📋', tab: 'reservations' },
        { path: '/admin', label: '운영 시간',   icon: '🕐', tab: 'schedule' },
      ];
    }

    // 로그인한 일반 회원
    if (isUser) {
      return [
        { path: '/',         label: '홈',        icon: '🏠' },
        { path: '/reserve',  label: '예약',      icon: '🔍' },
        { path: '/calendar', label: '캘린더',    icon: '📅' },
        { path: '/event',    label: '이벤트',    icon: '🎉' },
        { path: '/mypage',   label: '마이페이지', icon: '👤' },
      ];
    }

    // 비로그인 (익명)
    return [
      { path: '/',        label: '홈',      icon: '🏠' },
      { path: '/reserve', label: '예약',    icon: '🔍' },
      { path: '/event',   label: '이벤트',  icon: '🎉' },
      { path: '/login',   label: '로그인',  icon: '🔑' },
    ];
  };

  const menus = getMenus();

  // 관리자용 탭 전환 핸들러
  const handleMenuClick = (menu) => {
    if (menu.tab) {
      // 이미 해당 페이지에 있으면 이벤트만, 아니면 navigate 후 이벤트
      if (location.pathname !== menu.path) {
        navigate(menu.path);
        // navigate 후 렌더링 완료 뒤 이벤트 발생
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('adminTabChange', { detail: menu.tab }));
        }, 100);
      } else {
        window.dispatchEvent(new CustomEvent('adminTabChange', { detail: menu.tab }));
      }
    } else {
      navigate(menu.path);
    }
  };

  if (isMobile) {
    return (
      <nav className="bottom-tab-bar">
        {menus.map(menu => (
          <button
            key={menu.tab || menu.path}
            className={`bottom-tab-btn ${
              location.pathname === menu.path &&
              (!menu.tab || window.__adminActiveTab === menu.tab)
                ? 'active' : ''
            }`}
            onClick={() => handleMenuClick(menu)}
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
          key={menu.tab || menu.path}
          className={`page-button ${location.pathname === menu.path && (!menu.tab || window.__adminActiveTab === menu.tab) ? 'active' : ''}`}
          onClick={() => handleMenuClick(menu)}
        >
          {menu.icon} {menu.label}
        </button>
      ))}
    </div>
  );
}

export default BoxRight;