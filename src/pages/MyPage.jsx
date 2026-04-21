import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import '../styles/Global.css';
import '../styles/MyPage.css';

function MyPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loggedInUser, setLoggedInUser] = useState(null);

  // 로그인 확인
  useEffect(() => {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) {
      alert('로그인이 필요한 페이지예요!');
      navigate('/login');
      return;
    }
    setLoggedInUser(JSON.parse(user));
  }, [navigate]);

  if (!loggedInUser) return null;

  const tabs = [
    { id: 'profile',  label: '👤 개인정보' },
    { id: 'payment',  label: '💳 결제수단' },
    { id: 'favorite', label: '⭐ 즐겨찾기' },
    { id: 'history',  label: '📋 히스토리' },
  ];

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="mypage-content">

          {/* 상단 프로필 요약 */}
          <div className="mypage-header">
            <div className="mypage-avatar">
              {loggedInUser.nickname?.charAt(0).toUpperCase()}
            </div>
            <div className="mypage-header-info">
              <h2>{loggedInUser.nickname}님, 환영해요!</h2>
              <p>{loggedInUser.email}</p>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="mypage-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`mypage-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="mypage-tab-content">
            {activeTab === 'profile'  && <ProfileTab  loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} />}
            {activeTab === 'payment'  && <PaymentTab />}
            {activeTab === 'favorite' && <FavoriteTab />}
            {activeTab === 'history'  && <HistoryTab />}
          </div>

        </div>
      </BoxMain>
    </div>
  );
}

// =============================================
// 탭 1: 개인정보 변경
// =============================================
function ProfileTab({ loggedInUser, setLoggedInUser }) {
  const [nickname, setNickname] = useState(loggedInUser.nickname || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nicknameMsg, setNicknameMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleNicknameChange = () => {
    if (!nickname.trim()) {
      setNicknameMsg('닉네임을 입력해주세요.');
      return;
    }
    // sessionStorage 업데이트
    const updated = { ...loggedInUser, nickname };
    sessionStorage.setItem('loggedInUser', JSON.stringify(updated));
    setLoggedInUser(updated);

    // localStorage 유저 목록도 업데이트
    const users = JSON.parse(localStorage.getItem('appUsers') || '[]');
    const updatedUsers = users.map(u =>
      u.username === loggedInUser.username ? { ...u, nickname } : u
    );
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('loginStateChange'));
    setNicknameMsg('✅ 닉네임이 변경되었어요!');
  };

  const handlePasswordChange = () => {
    setPasswordMsg('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg('모든 항목을 입력해주세요.');
      return;
    }
    if (currentPassword !== loggedInUser.password) {
      setPasswordMsg('현재 비밀번호가 일치하지 않아요.');
      return;
    }
    const passwordRegex = /^(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordMsg('새 비밀번호는 영문, 특수문자 포함 8자 이상이어야 해요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('새 비밀번호가 일치하지 않아요.');
      return;
    }
    const updated = { ...loggedInUser, password: newPassword };
    sessionStorage.setItem('loggedInUser', JSON.stringify(updated));

    const users = JSON.parse(localStorage.getItem('appUsers') || '[]');
    const updatedUsers = users.map(u =>
      u.username === loggedInUser.username ? { ...u, password: newPassword } : u
    );
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg('✅ 비밀번호가 변경되었어요!');
  };

  return (
    <div className="tab-section">

      {/* 닉네임 변경 */}
      <div className="tab-card">
        <h3>닉네임 변경</h3>
        <div className="input-row">
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setNicknameMsg(''); }}
            placeholder="새 닉네임 입력"
            className="mypage-input"
          />
          <button className="mypage-btn primary" onClick={handleNicknameChange}>
            변경
          </button>
        </div>
        {nicknameMsg && (
          <p className={`mypage-msg ${nicknameMsg.startsWith('✅') ? 'success' : 'error'}`}>
            {nicknameMsg}
          </p>
        )}
      </div>

      {/* 비밀번호 변경 */}
      <div className="tab-card">
        <h3>비밀번호 변경</h3>
        <div className="input-group-vertical">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호"
            className="mypage-input"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호 (영문+특수문자 8자 이상)"
            className="mypage-input"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="새 비밀번호 확인"
            className="mypage-input"
          />
          <button className="mypage-btn primary" onClick={handlePasswordChange}>
            비밀번호 변경
          </button>
        </div>
        {passwordMsg && (
          <p className={`mypage-msg ${passwordMsg.startsWith('✅') ? 'success' : 'error'}`}>
            {passwordMsg}
          </p>
        )}
      </div>

      {/* 기본 정보 표시 */}
      <div className="tab-card">
        <h3>기본 정보</h3>
        <div className="info-table">
          <div className="info-row">
            <span className="info-label">아이디</span>
            <span className="info-value">{loggedInUser.username}</span>
          </div>
          <div className="info-row">
            <span className="info-label">이메일</span>
            <span className="info-value">{loggedInUser.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">성별</span>
            <span className="info-value">
              {loggedInUser.gender === 'm' ? '남성' :
               loggedInUser.gender === 'f' ? '여성' : '미입력'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">생년월일</span>
            <span className="info-value">{loggedInUser.birth || '미입력'}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

// =============================================
// 탭 2: 결제수단
// =============================================
function PaymentTab() {
  const PAYMENT_METHODS = ['신용/체크카드', '카카오페이', '네이버페이', '토스', '삼성페이'];

  const [savedMethods, setSavedMethods] = useState(() => {
    return JSON.parse(localStorage.getItem('paymentMethods') || '[]');
  });
  const [selectedToAdd, setSelectedToAdd] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [msg, setMsg] = useState('');

  const handleAdd = () => {
    if (!selectedToAdd) { setMsg('결제수단을 선택해주세요.'); return; }
    if (savedMethods.find(m => m.type === selectedToAdd)) {
      setMsg('이미 등록된 결제수단이에요.');
      return;
    }
    const newMethod = {
      id: Date.now(),
      type: selectedToAdd,
      detail: selectedToAdd === '신용/체크카드' ? cardNumber : '',
      isDefault: savedMethods.length === 0,
    };
    const updated = [...savedMethods, newMethod];
    setSavedMethods(updated);
    localStorage.setItem('paymentMethods', JSON.stringify(updated));
    setSelectedToAdd('');
    setCardNumber('');
    setMsg('✅ 결제수단이 등록되었어요!');
  };

  const handleDelete = (id) => {
    const updated = savedMethods.filter(m => m.id !== id);
    // 삭제 후 첫번째를 기본으로
    if (updated.length > 0 && !updated.find(m => m.isDefault)) {
      updated[0].isDefault = true;
    }
    setSavedMethods(updated);
    localStorage.setItem('paymentMethods', JSON.stringify(updated));
  };

  const handleSetDefault = (id) => {
    const updated = savedMethods.map(m => ({ ...m, isDefault: m.id === id }));
    setSavedMethods(updated);
    localStorage.setItem('paymentMethods', JSON.stringify(updated));
  };

  const ICONS = {
    '신용/체크카드': '💳',
    '카카오페이': '🟡',
    '네이버페이': '🟢',
    '토스': '🔵',
    '삼성페이': '⬛',
  };

  return (
    <div className="tab-section">

      {/* 등록된 결제수단 */}
      <div className="tab-card">
        <h3>등록된 결제수단</h3>
        {savedMethods.length === 0 ? (
          <p className="empty-msg">등록된 결제수단이 없어요.</p>
        ) : (
          <div className="payment-list">
            {savedMethods.map(method => (
              <div key={method.id} className="payment-item">
                <div className="payment-item-left">
                  <span className="payment-icon">{ICONS[method.type]}</span>
                  <div>
                    <span className="payment-name">{method.type}</span>
                    {method.detail && (
                      <span className="payment-detail">**** **** **** {method.detail.slice(-4)}</span>
                    )}
                  </div>
                  {method.isDefault && (
                    <span className="default-badge">기본</span>
                  )}
                </div>
                <div className="payment-item-right">
                  {!method.isDefault && (
                    <button
                      className="mypage-btn small"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      기본 설정
                    </button>
                  )}
                  <button
                    className="mypage-btn small danger"
                    onClick={() => handleDelete(method.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 결제수단 추가 */}
      <div className="tab-card">
        <h3>결제수단 추가</h3>
        <div className="payment-method-grid">
          {PAYMENT_METHODS.map(method => (
            <button
              key={method}
              className={`payment-select-btn ${selectedToAdd === method ? 'selected' : ''}`}
              onClick={() => { setSelectedToAdd(method); setMsg(''); }}
            >
              {ICONS[method]} {method}
            </button>
          ))}
        </div>

        {selectedToAdd === '신용/체크카드' && (
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="카드번호 16자리"
            maxLength={16}
            className="mypage-input"
            style={{ marginTop: '12px' }}
          />
        )}

        <button
          className="mypage-btn primary"
          style={{ marginTop: '14px' }}
          onClick={handleAdd}
        >
          등록하기
        </button>

        {msg && (
          <p className={`mypage-msg ${msg.startsWith('✅') ? 'success' : 'error'}`}>
            {msg}
          </p>
        )}
      </div>

    </div>
  );
}

// =============================================
// 탭 3: 즐겨찾기
// =============================================
function FavoriteTab() {
  const [favoriteThemes] = useState(() => {
    return JSON.parse(localStorage.getItem('favoriteThemes') || '[]');
  });
  const [favoriteStores] = useState(() => {
    return JSON.parse(localStorage.getItem('favoriteStores') || '[]');
  });

  // 즐겨찾기 테마 삭제
  const [themes, setThemes] = useState(favoriteThemes);
  const [stores, setStores] = useState(favoriteStores);

  const removeTheme = (id) => {
    const updated = themes.filter(t => t.id !== id);
    setThemes(updated);
    localStorage.setItem('favoriteThemes', JSON.stringify(updated));
  };

  const removeStore = (id) => {
    const updated = stores.filter(s => s.id !== id);
    setStores(updated);
    localStorage.setItem('favoriteStores', JSON.stringify(updated));
  };

  return (
    <div className="tab-section">

      {/* 즐겨찾기 테마 */}
      <div className="tab-card">
        <h3>⭐ 즐겨찾기 테마</h3>
        {themes.length === 0 ? (
          <p className="empty-msg">
            즐겨찾기한 테마가 없어요.<br />
            테마 상세 페이지에서 ⭐를 눌러 추가해보세요!
          </p>
        ) : (
          <div className="favorite-grid">
            {themes.map(theme => (
              <div key={theme.id} className="favorite-card">
                {theme.imageUrl && (
                  <img src={theme.imageUrl} alt={theme.title} className="favorite-img" />
                )}
                <div className="favorite-info">
                  <strong>{theme.title}</strong>
                  <span>{theme.theme}</span>
                  <span>{theme.location?.city} {theme.location?.district}</span>
                </div>
                <button className="favorite-remove-btn" onClick={() => removeTheme(theme.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 즐겨찾기 점포 */}
      <div className="tab-card">
        <h3>📍 즐겨찾기 점포</h3>
        {stores.length === 0 ? (
          <p className="empty-msg">
            즐겨찾기한 점포가 없어요.<br />
            자주 가는 점포를 추가해보세요!
          </p>
        ) : (
          <div className="store-list">
            {stores.map(store => (
              <div key={store.id} className="store-item">
                <div className="store-info">
                  <strong>{store.name}</strong>
                  <span>{store.address}</span>
                </div>
                <button className="favorite-remove-btn" onClick={() => removeStore(store.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// =============================================
// 탭 4: 히스토리
// =============================================
function HistoryTab() {
  const [records, setRecords] = useState(() => {
    return JSON.parse(localStorage.getItem('reservationRecords') || '[]');
  });
  const [filter, setFilter] = useState('all');

  const filteredRecords = records.filter(r => {
    if (filter === 'success') return r.success === true;
    if (filter === 'fail') return r.success === false;
    if (filter === 'pending') return r.success === null;
    if (filter === 'cancelled') return r.cancelled === true;
    return true;
  });

  const stats = {
    total: records.length,
    success: records.filter(r => r.success === true).length,
    fail: records.filter(r => r.success === false).length,
    pending: records.filter(r => r.success === null && !r.cancelled).length,
  };

  const successRate = stats.total > 0
    ? Math.round((stats.success / (stats.success + stats.fail)) * 100) || 0
    : 0;

  return (
    <div className="tab-section">

      {/* 통계 요약 */}
      <div className="tab-card">
        <h3>나의 방탈출 통계</h3>
        <div className="history-stats">
          <div className="history-stat-item">
            <span className="history-stat-number">{stats.total}</span>
            <span className="history-stat-label">총 예약</span>
          </div>
          <div className="history-stat-item success">
            <span className="history-stat-number">{stats.success}</span>
            <span className="history-stat-label">🟢 성공</span>
          </div>
          <div className="history-stat-item fail">
            <span className="history-stat-number">{stats.fail}</span>
            <span className="history-stat-label">🔴 실패</span>
          </div>
          <div className="history-stat-item pending">
            <span className="history-stat-number">{stats.pending}</span>
            <span className="history-stat-label">⏳ 미완료</span>
          </div>
          <div className="history-stat-item rate">
            <span className="history-stat-number">{successRate}%</span>
            <span className="history-stat-label">성공률</span>
          </div>
        </div>
      </div>

      {/* 필터 + 목록 */}
      <div className="tab-card">
        <div className="history-filter-row">
          <h3>예약 목록</h3>
          <div className="history-filters">
            {[
              { key: 'all',     label: '전체' },
              { key: 'success', label: '🟢 성공' },
              { key: 'fail',    label: '🔴 실패' },
              { key: 'pending', label: '⏳ 미완료' },
            ].map(f => (
              <button
                key={f.key}
                className={`filter-btn ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <p className="empty-msg">해당하는 기록이 없어요.</p>
        ) : (
          <div className="history-list">
            {[...filteredRecords].reverse().map(record => (
              <div key={record.id} className={`history-item ${record.cancelled ? 'cancelled' : ''}`}>
                <div className="history-item-left">
                  <div className="history-item-header">
                    <strong>{record.productName}</strong>
                    {record.success === true  && <span className="result-badge success">🟢 성공</span>}
                    {record.success === false && <span className="result-badge fail">🔴 실패</span>}
                    {record.success === null && !record.cancelled &&
                      <span className="result-badge pending">⏳ 미완료</span>}
                    {record.cancelled && <span className="result-badge cancelled">취소됨</span>}
                  </div>
                  <div className="history-item-detail">
                    <span>📅 {record.date}</span>
                    <span>🕐 {record.time}</span>
                    <span>👥 {record.people}</span>
                    <span>🎭 {record.theme}</span>
                    <span>💰 {record.price?.toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default MyPage;