import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Global.css';
import '../styles/LoginPage.css';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';

import initialCustomers from '../data/customer.js';

function LoginPage() {
  const navigate = useNavigate();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false); // ← 여기로 이동

  const [users, setUsers] = useState(() => {
    const storedUsers = localStorage.getItem('appUsers');
    return storedUsers ? JSON.parse(storedUsers) : initialCustomers;
  });

  useEffect(() => {
    localStorage.setItem('appUsers', JSON.stringify(users));
  }, [users]);

  // 로그인
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (!username || !password) {
      setMessage('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    const foundUser = users.find(
      user => user.username === username && user.password === password
    );

    if (foundUser) {
      setMessage(`로그인 성공! ${foundUser.nickname}님 환영합니다!`);
      sessionStorage.setItem('loggedInUser', JSON.stringify(foundUser));
      window.dispatchEvent(new Event('loginStateChange'));
      setTimeout(() => navigate('/'), 1000);
    } else {
      setMessage('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  // 회원가입
  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (!username || !password || !email || !nickname) {
      setMessage('모든 필드를 입력해주세요.');
      return;
    }

    if (!agreedToPrivacy) {
      setMessage('개인정보처리방침에 동의해주세요.');
      return;
    }

    if (users.some(user => user.username === username)) {
      setMessage('이미 존재하는 아이디입니다. 다른 아이디를 사용해주세요.');
      return;
    }

    const passwordRegex = /^(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setMessage('비밀번호는 영문, 특수문자 포함 8자 이상이어야 합니다.');
      return;
    }

    const newUser = {
      username,
      password,
      email,
      nickname,
      gender: '',
      birth: '',
    };

    setUsers([...users, newUser]);
    setMessage('회원가입이 완료되었습니다! 로그인해주세요.');
    setTimeout(() => {
      setIsLoginMode(true);
      setUsername('');
      setPassword('');
      setEmail('');
      setNickname('');
      setAgreedToPrivacy(false);
    }, 1500);
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setMessage('');
    setUsername('');
    setPassword('');
    setEmail('');
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
              <p className={`message ${message.includes('성공') || message.includes('완료') ? 'success' : 'error'}`}>
                {message}
              </p>
            )}

            <form onSubmit={isLoginMode ? handleLoginSubmit : handleSignupSubmit}>
              <div className="input-group">
                <label htmlFor="username">아이디</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력해주세요"
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">비밀번호</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력해주세요"
                />
              </div>

              {!isLoginMode && (
                <>
                  <div className="input-group">
                    <label htmlFor="email">이메일</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일을 입력해주세요"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="nickname">닉네임</label>
                    <input
                      type="text"
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="닉네임을 입력해주세요"
                    />
                  </div>

                  {/* 개인정보처리방침 동의 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9em' }}>
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={agreedToPrivacy}
                      onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    />
                    <label htmlFor="privacy">
                      <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: '#6f00ff' }}>
                        개인정보처리방침
                      </a>에 동의합니다 (필수)
                    </label>
                  </div>
                </>
              )}

              <button type="submit" className="auth-button">
                {isLoginMode ? '로그인' : '회원가입'}
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