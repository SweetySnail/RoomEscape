import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Global.css';
import '../styles/LoginPage.css';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import { signIn, signUp } from '../services/authService';

// 랜덤 닉네임 생성
const generateRandomNickname = () => {
  const adjectives = ['프로', '열정적인', '최강', '전설의', '무적의', '신비한', '용감한', '빠른'];
  const nouns = ['방탈출러', '탈출왕', '퍼즐마스터', '수수께끼왕', '탐험가', '해결사', '도전자'];
  const number = Math.floor(Math.random() * 900) + 100;
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}${number}`;
};

function LoginPage() {
  const navigate = useNavigate();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  // 로그인
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!email || !password) {
      setMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const userData = await signIn(email, password);
      sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
      window.dispatchEvent(new Event('loginStateChange'));
      setMessage(`로그인 성공! ${userData.nickname}님 환영합니다!`);
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      if (error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential') {
        setMessage('이메일 또는 비밀번호가 일치하지 않아요.');
      } else if (error.code === 'auth/invalid-email') {
        setMessage('올바른 이메일 형식이 아니에요.');
      } else {
        setMessage('로그인 중 오류가 발생했어요. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 회원가입
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!email || !password) {
      setMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (!agreedToPrivacy) {
      setMessage('개인정보처리방침에 동의해주세요.');
      return;
    }

    const passwordRegex = /^(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setMessage('비밀번호는 영문, 특수문자 포함 8자 이상이어야 해요.');
      return;
    }

    // 닉네임 미입력 시 랜덤 생성
    const finalNickname = nickname.trim() || generateRandomNickname();

    setLoading(true);
    try {
      await signUp({ email, password, nickname: finalNickname });
      setMessage(`회원가입 완료! 닉네임: ${finalNickname} 🎉 신규가입 500P 지급!`);
      setTimeout(() => {
        setIsLoginMode(true);
        setEmail('');
        setPassword('');
        setNickname('');
        setAgreedToPrivacy(false);
      }, 2000);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setMessage('이미 사용 중인 이메일이에요.');
      } else if (error.code === 'auth/weak-password') {
        setMessage('비밀번호가 너무 약해요.');
      } else {
        setMessage('회원가입 중 오류가 발생했어요. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setMessage('');
    setEmail('');
    setPassword('');
    setNickname('');
    setAgreedToPrivacy(false);
  };

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="auth-container">
          <div className="auth-box">
            <h2>{isLoginMode ? '로그인' : '회원가입'}</h2>

            {message && (
              <p className={`message ${
                message.includes('성공') || message.includes('완료')
                  ? 'success' : 'error'
              }`}>
                {message}
              </p>
            )}

            <form onSubmit={isLoginMode ? handleLoginSubmit : handleSignupSubmit}>

              <div className="input-group">
                <label>이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력해주세요"
                />
              </div>

              <div className="input-group">
                <label>비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLoginMode ? '비밀번호를 입력해주세요' : '영문+특수문자 포함 8자 이상'}
                />
              </div>

              {!isLoginMode && (
                <>
                  <div className="input-group">
                    <label>닉네임 <span style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>(선택)</span></label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="미입력 시 랜덤 닉네임 설정"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => setNickname(generateRandomNickname())}
                        style={{
                          padding: '0 14px',
                          background: 'rgba(212, 168, 67, 0.15)',
                          border: '1px solid var(--border-active)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--accent-gold)',
                          cursor: 'pointer',
                          fontSize: '0.85em',
                          whiteSpace: 'nowrap',
                          fontFamily: 'Noto Sans KR, sans-serif',
                        }}
                      >
                        🎲 랜덤
                      </button>
                    </div>
                    {nickname && (
                      <p style={{ fontSize: '0.82em', color: 'var(--text-muted)', marginTop: '4px' }}>
                        닉네임: <strong style={{ color: 'var(--accent-gold)' }}>{nickname}</strong>
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9em' }}>
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={agreedToPrivacy}
                      onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    />
                    <label htmlFor="privacy" style={{ color: 'var(--text-secondary)' }}>
                      <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)' }}>
                        개인정보처리방침
                      </a>에 동의합니다 (필수)
                    </label>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? '처리 중...' : isLoginMode ? '로그인' : '회원가입'}
              </button>
            </form>

            <div className="auth-toggle">
              {isLoginMode ? (
                <p>계정이 없으신가요? <span onClick={toggleMode} className="toggle-link">회원가입</span></p>
              ) : (
                <p>이미 계정이 있으신가요? <span onClick={toggleMode} className="toggle-link">로그인</span></p>
              )}
            </div>
          </div>
        </div>
      </BoxMain>
    </div>
  );
}

export default LoginPage;