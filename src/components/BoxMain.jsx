import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Global.css';

function BoxMain({ children }) {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <div className="main-page-wrapper">
      {children}

      {/* 하단 푸터 */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <span className="site-footer-logo">RoomEscape</span>
          <div className="site-footer-links">
            <button onClick={() => navigate('/privacy')} className="site-footer-link">
              이용약관
            </button>
            <span className="site-footer-divider">·</span>
            <button onClick={() => navigate('/privacy')} className="site-footer-link">
              개인정보처리방침
            </button>
            <span className="site-footer-divider">·</span>
            <a href="mailto:shwogus1011@gmail.com" className="site-footer-link">
              문의
            </a>
          </div>
          <span className="site-footer-copy">© {year} RoomEscape. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default BoxMain;