import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import ReviewModal from '../components/ReviewModal';
import { getPoints } from '../utils/PointUtils';
import { useAuth } from '../hooks/useAuth';
import { getMyReservations } from '../services/reservationService';
import { getMyReviews } from '../services/reviewService';
import { getPointHistory } from '../services/pointService';
import { getMyFavorites, removeFavorite } from '../services/favoriteService';
import { updateNickname, updateUserData } from '../services/authService';
import '../styles/Global.css';
import '../styles/MyPage.css';


function MyPage() {
  const navigate = useNavigate();
  const { user: authUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!authUser) {
      alert('로그인이 필요한 페이지예요!');
      navigate('/login');
      return;
    }
    setLoggedInUser(authUser);
  }, [authUser, loading, navigate]);

  if (loading || !loggedInUser) return null;

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

          <div className="mypage-header">
            <div className="mypage-avatar">
              {loggedInUser.nickname?.charAt(0).toUpperCase()}
            </div>
            <div className="mypage-header-info">
              <h2>{loggedInUser.nickname}님, 환영해요!</h2>
              <p>{loggedInUser.email}</p>
              <div className="mypage-points">
                💎 보유 포인트: <strong>{(loggedInUser.points || 0).toLocaleString()} P</strong>
              </div>
            </div>
          </div>

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

          <div className="mypage-tab-content">
            {activeTab === 'profile'  && <ProfileTab loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} />}
            {activeTab === 'payment'  && <PaymentTab loggedInUser={loggedInUser} />}
            {activeTab === 'favorite' && <FavoriteTab />}
            {activeTab === 'history'  && <HistoryTab loggedInUser={loggedInUser} />}
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

  const handleNicknameChange = async () => {
    if (!nickname.trim()) { setNicknameMsg('닉네임을 입력해주세요.'); return; }
    try {
      await updateNickname(loggedInUser.uid, nickname);
      const updated = { ...loggedInUser, nickname };
      sessionStorage.setItem('loggedInUser', JSON.stringify(updated));
      setLoggedInUser(updated);
      window.dispatchEvent(new Event('loginStateChange'));
      setNicknameMsg('✅ 닉네임이 변경되었어요!');
    } catch (error) {
      setNicknameMsg('닉네임 변경 중 오류가 발생했어요.');
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMsg('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg('모든 항목을 입력해주세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('새 비밀번호가 일치하지 않아요.');
      return;
    }
    const passwordRegex = /^(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordMsg('새 비밀번호는 영문, 특수문자 포함 8자 이상이어야 해요.');
      return;
    }

    try {
      // Firebase Auth 비밀번호 변경
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      const credential = EmailAuthProvider.credential(loggedInUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('✅ 비밀번호가 변경되었어요!');
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setPasswordMsg('현재 비밀번호가 일치하지 않아요.');
      } else {
        setPasswordMsg('비밀번호 변경 중 오류가 발생했어요.');
      }
    }
  };

  return (
    <div className="tab-section">
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
          <button className="mypage-btn primary" onClick={handleNicknameChange}>변경</button>
        </div>
        {nicknameMsg && (
          <p className={`mypage-msg ${nicknameMsg.startsWith('✅') ? 'success' : 'error'}`}>
            {nicknameMsg}
          </p>
        )}
      </div>

      <div className="tab-card">
        <h3>비밀번호 변경</h3>
        <div className="input-group-vertical">
          <input type="password" value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호" className="mypage-input" />
          <input type="password" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호 (영문+특수문자 8자 이상)" className="mypage-input" />
          <input type="password" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="새 비밀번호 확인" className="mypage-input" />
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

      <div className="tab-card">
        <h3>기본 정보</h3>
        <div className="info-table">
          <div className="info-row">
            <span className="info-label">이메일</span>
            <span className="info-value">{loggedInUser.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">포인트</span>
            <span className="info-value" style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>
              💎 {(loggedInUser.points || 0).toLocaleString()} P
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">가입일</span>
            <span className="info-value">
              {loggedInUser.createdAt?.slice(0, 10) || '정보 없음'}
            </span>
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
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
      if (!loggedInUser?.uid) { setLoading(false); return; }
      try {
        const data = await getMyFavorites(loggedInUser.uid);
        setThemes(data);
      } catch (error) {
        console.error('즐겨찾기 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const removeTheme = async (productId) => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
    if (!loggedInUser?.uid) return;
    try {
      await removeFavorite(loggedInUser.uid, productId);
      setThemes(prev => prev.filter(t => t.productId !== productId));
    } catch (error) {
      console.error('즐겨찾기 제거 실패:', error);
    }
  };

  if (loading) return <p className="empty-msg">불러오는 중...</p>;

  return (
    <div className="tab-section">
      <div className="tab-card">
        <h3>⭐ 즐겨찾기 테마 ({themes.length}개)</h3>
        {themes.length === 0 ? (
          <p className="empty-msg">
            즐겨찾기한 테마가 없어요.<br />
            테마 카드나 상세 팝업에서 ☆를 눌러 추가해보세요!
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
                  <span>⭐ {theme.rating} ({theme.reviewCount} 리뷰)</span>
                  <span>{theme.location?.city} {theme.location?.district}</span>
                  {theme.branch && <span>🏪 {theme.branch}</span>}
                </div>
                <button
                  className="favorite-remove-btn"
                  onClick={() => removeTheme(theme.productId)}
                  title="즐겨찾기 제거"
                >
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
function HistoryTab({ loggedInUser }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reviewTarget, setReviewTarget] = useState(null);

  useEffect(() => {
    const loadRecords = async () => {
      if (!loggedInUser?.uid) return;
      try {
        const data = await getMyReservations(loggedInUser.uid);
        setRecords(data);
      } catch (error) {
        console.error('예약 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRecords();
  }, [loggedInUser]);

  const filteredRecords = records.filter(r => {
    if (filter === 'success')   return r.success === true;
    if (filter === 'fail')      return r.success === false;
    if (filter === 'pending')   return r.success === null && !r.cancelled;
    if (filter === 'cancelled') return r.cancelled === true;
    return true;
  });

  const stats = {
    total:   records.filter(r => !r.cancelled).length,
    success: records.filter(r => r.success === true).length,
    fail:    records.filter(r => r.success === false).length,
    pending: records.filter(r => r.success === null && !r.cancelled).length,
  };

  const successRate = (stats.success + stats.fail) > 0
    ? Math.round((stats.success / (stats.success + stats.fail)) * 100) : 0;

  const handleReviewSubmit = async () => {
    const data = await getMyReservations(loggedInUser.uid);
    setRecords(data);
    setReviewTarget(null);
  };

  if (loading) return <p className="empty-msg">불러오는 중...</p>;

  return (
    <div className="tab-section">
      <div className="tab-card">
        <h3>나의 방탈출 통계</h3>
        <div className="history-stats">
          {[
            { cls: '',        num: stats.total,   label: '총 예약' },
            { cls: 'success', num: stats.success, label: '🟢 성공' },
            { cls: 'fail',    num: stats.fail,    label: '🔴 실패' },
            { cls: 'pending', num: stats.pending, label: '⏳ 미완료' },
            { cls: 'rate',    num: `${successRate}%`, label: '성공률' },
          ].map(s => (
            <div key={s.label} className={`history-stat-item ${s.cls}`}>
              <span className="history-stat-number">{s.num}</span>
              <span className="history-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tab-card">
        <div className="history-filter-row">
          <h3>예약 목록</h3>
          <div className="history-filters">
            {[
              { key: 'all',       label: '전체' },
              { key: 'success',   label: '🟢 성공' },
              { key: 'fail',      label: '🔴 실패' },
              { key: 'pending',   label: '⏳ 미완료' },
              { key: 'cancelled', label: '취소됨' },
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
              <div
                key={record.id}
                className={`history-item ${record.cancelled ? 'cancelled' : ''}`}
              >
                <div className="history-item-header">
                  <strong>{record.productName}</strong>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {record.success === true  && <span className="result-badge success">🟢 성공</span>}
                    {record.success === false && <span className="result-badge fail">🔴 실패</span>}
                    {record.success === null && !record.cancelled &&
                      <span className="result-badge pending">⏳ 미완료</span>}
                    {record.cancelled && <span className="result-badge cancelled">취소됨</span>}
                    {record.reviewed && <span className="result-badge reviewed">✍️ 리뷰완료</span>}
                  </div>
                </div>

                <div className="history-item-detail">
                  <span>📅 {record.date}</span>
                  <span>🕐 {record.time}</span>
                  <span>👥 {record.people}</span>
                  <span>🎭 {record.theme}</span>
                  <span>💰 {record.price?.toLocaleString()}원</span>
                </div>

                {record.success !== null && !record.cancelled && !record.reviewed && (
                  <button
                    className="review-write-btn"
                    onClick={() => setReviewTarget(record)}
                  >
                    ✍️ 리뷰 작성하고 100P 받기
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          record={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}

export default MyPage;