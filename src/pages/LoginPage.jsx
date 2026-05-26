import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Global.css';
import '../styles/LoginPage.css';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import { signIn, signUp, signInWithGoogle } from '../services/authService';

const generateRandomNickname = () => {
  const adjectives = ['프로', '열정적인', '최강', '전설의', '무적의', '신비한', '용감한', '빠른'];
  const nouns = ['방탈출러', '탈출왕', '퍼즐마스터', '수수께끼왕', '탐험가', '해결사', '도전자'];
  const number = Math.floor(Math.random() * 900) + 100;
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${number}`;
};

// ===== 소셜 로그인 아이콘 =====
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const KakaoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.612 5.07 4.05 6.48L5.1 21l4.73-2.52c.71.1 1.44.15 2.17.15 5.523 0 10-3.477 10-7.8S17.523 3 12 3z" fill="#3C1E1E"/>
  </svg>
);

const NaverIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#fff"/>
  </svg>
);

function LoginPage() {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const onLoginSuccess = (userData) => {
    sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
    window.dispatchEvent(new Event('loginStateChange'));
    setMessage(`로그인 성공! ${userData.nickname}님 환영합니다!`);
    setTimeout(() => navigate('/'), 1000);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!email || !password) { setMessage('이메일과 비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    try {
      const userData = await signIn(email, password);
      onLoginSuccess(userData);
    } catch (error) {
      if (['auth/user-not-found','auth/wrong-password','auth/invalid-credential'].includes(error.code)) {
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

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!email || !password) { setMessage('이메일과 비밀번호를 입력해주세요.'); return; }
    if (!agreedToPrivacy) { setMessage('개인정보처리방침에 동의해주세요.'); return; }
    if (!/^(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/.test(password)) {
      setMessage('비밀번호는 영문, 특수문자 포함 8자 이상이어야 해요.');
      return;
    }
    const finalNickname = nickname.trim() || generateRandomNickname();
    setLoading(true);
    try {
      await signUp({ email, password, nickname: finalNickname });
      setMessage(`회원가입 완료! 닉네임: ${finalNickname} 🎉 신규가입 500P 지급!`);
      setTimeout(() => {
        setIsLoginMode(true);
        setEmail(''); setPassword(''); setNickname(''); setAgreedToPrivacy(false);
      }, 2000);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') setMessage('이미 사용 중인 이메일이에요.');
      else if (error.code === 'auth/weak-password') setMessage('비밀번호가 너무 약해요.');
      else setMessage(error.message || '회원가입 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading(true);
    setMessage('');
    try {
      const userData = await signInWithGoogle();
      onLoginSuccess(userData);
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') setMessage('로그인 창이 닫혔어요. 다시 시도해주세요.');
      else if (error.code === 'auth/popup-blocked') setMessage('팝업이 차단됐어요. 브라우저 팝업 허용 후 다시 시도해주세요.');
      else setMessage('구글 로그인 중 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleKakaoLogin = () => {
    setMessage('카카오 로그인은 준비 중이에요.');
  };

  const handleNaverLogin = () => {
    setMessage('네이버 로그인은 준비 중이에요.');
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setMessage(''); setEmail(''); setPassword(''); setNickname(''); setAgreedToPrivacy(false);
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
              <p className={`message ${message.includes('성공') || message.includes('완료') ? 'success' : 'error'}`}>
                {message}
              </p>
            )}

            {/* ===== ID/PW 이메일 폼 — 먼저 표시 ===== */}
            <form onSubmit={isLoginMode ? handleLoginSubmit : handleSignupSubmit}>
              <div className="input-group">
                <label>이메일</label>
                <input type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력해주세요" />
              </div>

              <div className="input-group">
                <label>비밀번호</label>
                <input type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLoginMode ? '비밀번호를 입력해주세요' : '영문+특수문자 포함 8자 이상'} />
              </div>

              {!isLoginMode && (
                <>
                  <div className="input-group">
                    <label>닉네임 <span style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>(선택)</span></label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="미입력 시 랜덤 닉네임 설정"
                        style={{ flex: 1 }} />
                      <button type="button" onClick={() => setNickname(generateRandomNickname())}
                        style={{
                          padding: '0 14px',
                          background: 'rgba(212,168,67,0.15)',
                          border: '1px solid var(--border-active)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--accent-gold)',
                          cursor: 'pointer',
                          fontSize: '0.85em',
                          whiteSpace: 'nowrap',
                          fontFamily: 'Noto Sans KR, sans-serif',
                        }}>🎲 랜덤</button>
                    </div>
                    {nickname && (
                      <p style={{ fontSize: '0.82em', color: 'var(--text-muted)', marginTop: '4px' }}>
                        닉네임: <strong style={{ color: 'var(--accent-gold)' }}>{nickname}</strong>
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9em' }}>
                    <input type="checkbox" id="privacy"
                      checked={agreedToPrivacy}
                      onChange={(e) => setAgreedToPrivacy(e.target.checked)} />
                    <label htmlFor="privacy" style={{ color: 'var(--text-secondary)' }}>
                      <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)' }}>
                        개인정보처리방침
                      </a>에 동의합니다 (필수)
                    </label>
                  </div>
                </>
              )}

              <button type="submit" className="auth-button" disabled={loading || socialLoading}>
                {loading ? '처리 중...' : isLoginMode ? '로그인' : '회원가입'}
              </button>
            </form>

            <div className="auth-toggle">
              {isLoginMode
                ? <p>계정이 없으신가요? <span onClick={toggleMode} className="toggle-link">회원가입</span></p>
                : <p>이미 계정이 있으신가요? <span onClick={toggleMode} className="toggle-link">로그인</span></p>
              }
            </div>

            {/* ===== 구분선 ===== */}
            <div className="auth-divider">
              <span>또는 간편 로그인</span>
            </div>

            {/* ===== 소셜 로그인 — 동그란 아이콘 3개 ===== */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '4px' }}>
              {/* 구글 */}
              <button
                onClick={handleGoogleLogin}
                disabled={socialLoading || loading}
                title="Google로 로그인"
                style={{
                  width: '52px', height: '52px',
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <GoogleIcon />
              </button>

              {/* 카카오 */}
              <button
                onClick={handleKakaoLogin}
                disabled={socialLoading || loading}
                title="카카오로 로그인"
                style={{
                  width: '52px', height: '52px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#FEE500',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  fontSize: '22px',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <KakaoIcon />
              </button>

              {/* 네이버 */}
              <button
                onClick={handleNaverLogin}
                disabled={socialLoading || loading}
                title="네이버로 로그인"
                style={{
                  width: '52px', height: '52px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#03C75A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  fontSize: '22px',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <NaverIcon />
              </button>
            </div>

            {/* 소셜 라벨 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '6px' }}>
              {['Google', 'Kakao', 'Naver'].map(name => (
                <span key={name} style={{ width: '52px', textAlign: 'center', fontSize: '0.72em', color: 'var(--text-muted)' }}>
                  {name}
                </span>
              ))}
            </div>

            {/* 하단 약관 */}
            <div className="auth-legal-links">
              <a href="/privacy" target="_blank" rel="noreferrer">이용약관</a>
              <span>·</span>
              <a href="/privacy" target="_blank" rel="noreferrer">개인정보처리방침</a>
            </div>
          </div>
        </div>
      </BoxMain>
    </div>
  );
}

export default LoginPage;
