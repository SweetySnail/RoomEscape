import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Global.css'; // 공통 스타일
import '../styles/LoginPage.css'; // 로그인 페이지 전용 스타일

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';

// 초기 사용자 데이터 (localStorage에 없을 때 사용)
import initialCustomers from '../data/customer.js'; 

function LoginPage() {
  const navigate = useNavigate();

  const [isLoginMode, setIsLoginMode] = useState(true); // 로그인 모드 vs 회원가입 모드
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // 회원가입용
  const [nickname, setNickname] = useState(''); // 회원가입용
  const [message, setMessage] = useState(''); // 사용자에게 보여줄 메시지

  // ⭐ localStorage에 사용자 정보 저장 및 로드 ⭐
  const [users, setUsers] = useState(() => {
    // 앱 로드 시 localStorage에서 사용자 데이터 불러오기
    const storedUsers = localStorage.getItem('appUsers');
    return storedUsers ? JSON.parse(storedUsers) : initialCustomers; // 없으면 초기 데이터 사용
  });

  // users 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('appUsers', JSON.stringify(users));
  }, [users]);

  // ⭐ 로그인 제출 핸들러 ⭐
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (!username || !password) {
      setMessage('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    const foundUser = users.find(user => user.username === username && user.password === password);

    if (foundUser) {
      setMessage(`로그인 성공! ${foundUser.nickname}님 환영합니다!`);
      // 실제 로그인 상태를 저장 (예: sessionStorage나 Context API)
      sessionStorage.setItem('loggedInUser', JSON.stringify(foundUser)); // 임시 로그인 상태 저장
      setTimeout(() => {
        navigate('/'); // 로그인 성공 후 홈으로 이동 (또는 이전 페이지)
      }, 1000);
    } else {
      setMessage('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  // ⭐ 회원가입 제출 핸들러 ⭐
  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (!username || !password || !email || !nickname) {
      setMessage('모든 필드를 입력해주세요.');
      return;
    }

    // 아이디 중복 확인
    if (users.some(user => user.username === username)) {
      setMessage('이미 존재하는 아이디입니다. 다른 아이디를 사용해주세요.');
      return;
    }

    // 비밀번호 복잡성 검사 (예: 8자 이상, 특수문자 1개 이상)
    const passwordRegex = /^(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setMessage('비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.');
      return;
    }

    const newUser = {
      username,
      password, // 실제는 암호화되어 저장
      email,
      nickname,
      // 추가 필드 (생년월일, 성별 등은 나중에 추가 폼 만들어서 받을 수 있음)
      gender: '', // 임시 빈 값
      birth: '', // 임시 빈 값
    };

    setUsers([...users, newUser]); // 새로운 사용자 추가
    setMessage('회원가입이 성공적으로 완료되었습니다! 로그인해주세요.');
    // 회원가입 후 로그인 폼으로 전환
    setTimeout(() => {
      setIsLoginMode(true);
      setUsername(''); // 폼 비우기
      setPassword('');
      setEmail('');
      setNickname('');
    }, 1500);
  };

  // 모드 전환
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setMessage(''); // 메시지 초기화
    setUsername(''); // 폼 비우기
    setPassword('');
    setEmail('');
    setNickname('');
  };

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight /> 

      <BoxMain>
        <div className="auth-container">
          <div className="auth-box">
            <h2>{isLoginMode ? '로그인' : '회원가입'}</h2>
            
            {message && <p className={`message ${message.includes('성공') ? 'success' : 'error'}`}>{message}</p>}

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

              {!isLoginMode && ( // 회원가입 모드일 때만 추가 필드 보여주기
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