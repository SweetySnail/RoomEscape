// src/pages/PasswordChangePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeInitialPassword } from '../services/authService';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import '../styles/Global.css';
import '../styles/MyPage.css';

function PasswordChangePage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setMsg('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMsg('모든 항목을 입력해주세요.'); return;
    }
    if (newPassword !== confirmPassword) {
      setMsg('새 비밀번호가 일치하지 않아요.'); return;
    }
    const regex = /^(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
    if (!regex.test(newPassword)) {
      setMsg('새 비밀번호는 영문 + 특수문자 포함 8자 이상이어야 해요.'); return;
    }
    if (currentPassword === newPassword) {
      setMsg('새 비밀번호는 임시 비밀번호와 달라야 해요.'); return;
    }

    setLoading(true);
    try {
      await changeInitialPassword(currentPassword, newPassword);

      // sessionStorage의 유저 정보도 업데이트
      const user = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
      const updated = { ...user, passwordChanged: true };
      sessionStorage.setItem('loggedInUser', JSON.stringify(updated));

      alert('✅ 비밀번호가 변경되었어요! 이제 서비스를 이용할 수 있어요.');
      navigate('/admin');
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setMsg('임시 비밀번호가 일치하지 않아요.');
      } else {
        setMsg('비밀번호 변경 중 오류가 발생했어요: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="mypage-content">
          <div className="mypage-header">
            <div className="mypage-avatar">🔐</div>
            <div className="mypage-header-info">
              <h2>비밀번호 변경 필요</h2>
              <p>첫 로그인이에요! 보안을 위해 임시 비밀번호를 변경해주세요.</p>
            </div>
          </div>

          <div className="tab-card" style={{ maxWidth: '480px', margin: '0 auto' }}>
            <h3>새 비밀번호 설정</h3>
            <div className="input-group-vertical">
              <input
                type="password"
                className="mypage-input"
                placeholder="임시 비밀번호"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                type="password"
                className="mypage-input"
                placeholder="새 비밀번호 (영문 + 특수문자 8자 이상)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                className="mypage-input"
                placeholder="새 비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                className="mypage-btn primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? '변경 중...' : '비밀번호 변경하기'}
              </button>
            </div>
            {msg && (
              <p className={`mypage-msg ${msg.startsWith('✅') ? 'success' : 'error'}`}>
                {msg}
              </p>
            )}
          </div>
        </div>
      </BoxMain>
    </div>
  );
}

export default PasswordChangePage;