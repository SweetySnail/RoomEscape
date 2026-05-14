// src/pages/SuperAdminPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import { getAllStores, updateStore, createStore } from '../services/storeService';
import { createStoreAdminAccount } from '../services/authService';
import { getAllReservations } from '../services/reservationService';
import '../styles/Global.css';
import '../styles/AdminPage.css';
import '../styles/SuperAdminPage.css';

// 임시 비밀번호 생성
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

function SuperAdminPage() {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stores, setStores] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) { alert('로그인이 필요해요!'); navigate('/login'); return; }
    const parsed = JSON.parse(user);
    if (parsed.adminRole !== 'super') {
      alert('총괄 관리자만 접근할 수 있어요!');
      navigate('/'); return;
    }
    setLoggedInUser(parsed);
  }, [navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [storeList, reservationList] = await Promise.all([
        getAllStores(),
        getAllReservations(),
      ]);
      setStores(storeList);
      setReservations(reservationList);
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loggedInUser) loadData();
  }, [loggedInUser, loadData]);

  if (!loggedInUser || loading) return (
    <div className="page-container">
      <BoxTop /><BoxRight />
      <BoxMain>
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          데이터를 불러오는 중이에요...
        </div>
      </BoxMain>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: '📊 대시보드' },
    { id: 'stores',    label: '🏪 매장 관리' },
    { id: 'register',  label: '➕ 사업자 등록' },
    { id: 'fee',       label: '💳 수수료 정산' },
  ];

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="admin-content">

          {/* 헤더 */}
          <div className="admin-header super-header">
            <div>
              <h1 className="admin-title">👑 총괄 관리자 페이지</h1>
              <p className="admin-subtitle">EscapeHub 플랫폼 전체 현황</p>
            </div>
            <div className="admin-header-info">
              <span className="admin-role-badge super">👑 총괄관리자</span>
              <span>{loggedInUser.nickname}</span>
              <span>{new Date().toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}</span>
            </div>
          </div>

          {/* 탭 */}
          <div className="admin-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="admin-tab-content">
            {activeTab === 'dashboard' && (
              <DashboardTab stores={stores} reservations={reservations} />
            )}
            {activeTab === 'stores' && (
              <StoresTab stores={stores} reservations={reservations} onUpdate={loadData} />
            )}
            {activeTab === 'register' && (
              <RegisterTab onComplete={() => { loadData(); setActiveTab('stores'); }} />
            )}
            {activeTab === 'fee' && (
              <FeeTab stores={stores} reservations={reservations} />
            )}
          </div>

        </div>
      </BoxMain>
    </div>
  );
}

// =============================================
// 대시보드 탭
// =============================================
function DashboardTab({ stores, reservations }) {
  const thisMonth = new Date().toISOString().slice(0, 7);

  const activeReservations = reservations.filter(r => !r.cancelled);
  const thisReservations = activeReservations.filter(r => r.date?.startsWith(thisMonth));

  const totalRevenue = activeReservations.reduce((s, r) => s + (r.price || 0), 0);
  const _thisRevenue = thisReservations.reduce((s, r) => s + (r.price || 0), 0);

  const totalFee = stores.reduce((sum, store) => {
    const storeThemeNames = store.branches?.flatMap(b => b.themes?.map(t => t.name) || []) || [];
    const storeThis = thisReservations.filter(r => storeThemeNames.includes(r.productName));
    const storeRevenue = storeThis.reduce((s, r) => s + (r.price || 0), 0);
    return sum + Math.floor(storeRevenue * (store.discountRate || 0) / 100);
  }, 0);

  // 계약 만료 임박 매장 (30일 이내)
  const today = new Date();
  const soonExpiring = stores.filter(store => {
    if (!store.contractEnd) return false;
    const end = new Date(store.contractEnd);
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  });

  return (
    <div className="tab-section">
      <div className="admin-card">
        <h3>핵심 지표</h3>
        <div className="dashboard-stats">
          {[
            { icon: '🏪', label: '계약 매장 수',       value: `${stores.length}개` },
            { icon: '💰', label: '전체 누적 매출',      value: `${totalRevenue.toLocaleString()}원` },
            { icon: '📅', label: '이번달 예약 수',      value: `${thisReservations.length}건` },
            { icon: '💎', label: '이번달 플랫폼 수익',  value: `${totalFee.toLocaleString()}원` },
          ].map(s => (
            <div key={s.label} className="dashboard-stat-item">
              <span className="dashboard-stat-icon">{s.icon}</span>
              <span className="dashboard-stat-value">{s.value}</span>
              <span className="dashboard-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {soonExpiring.length > 0 && (
        <div className="admin-card" style={{ borderLeft: '4px solid #ff6b7a' }}>
          <h3>⚠️ 계약 만료 임박 매장 (30일 이내)</h3>
          {soonExpiring.map(store => {
            const end = new Date(store.contractEnd);
            const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
            return (
              <div key={store.id} className="compare-row">
                <span>{store.ownerName}</span>
                <span>{store.contractEnd} 만료</span>
                <span style={{ color: '#ff6b7a', fontWeight: 'bold' }}>D-{diffDays}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================
// 매장 관리 탭
// =============================================
function StoresTab({ stores, reservations, onUpdate }) {
  const [selectedStore, setSelectedStore] = useState(null);
  const [editingStore, setEditingStore] = useState(null);
  const [filterOwner, setFilterOwner] = useState('전체');

  const thisMonth = new Date().toISOString().slice(0, 7);
  const prevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toISOString().slice(0, 7);

  const getThemeNames = (store) =>
    store.branches?.flatMap(b => b.themes?.map(t => t.name) || []) || [];

  const getStoreStats = (store) => {
    const themeNames = getThemeNames(store);
    const active = reservations.filter(r => themeNames.includes(r.productName) && !r.cancelled);
    const thisRecs = active.filter(r => r.date?.startsWith(thisMonth));
    const prevRecs = active.filter(r => r.date?.startsWith(prevMonth));
    const cancelCount = reservations.filter(r => themeNames.includes(r.productName) && r.cancelled).length;
    const totalRevenue = active.reduce((s, r) => s + (r.price || 0), 0);
    const thisRevenue = thisRecs.reduce((s, r) => s + (r.price || 0), 0);
    const prevRevenue = prevRecs.reduce((s, r) => s + (r.price || 0), 0);
    const thisFee = Math.floor(thisRevenue * (store.discountRate || 0) / 100);
    return { totalRevenue, thisRevenue, prevRevenue, thisFee, cancelCount };
  };

  const filteredStores = stores.filter(s =>
    filterOwner === '전체' || s.ownerName === filterOwner
  );

  const handleSaveEdit = async () => {
    try {
      await updateStore(editingStore.id, {
        discountRate: Number(editingStore.discountRate),
        contractStart: editingStore.contractStart,
        contractEnd: editingStore.contractEnd,
      });
      alert('저장되었어요!');
      setEditingStore(null);
      onUpdate();
    } catch (error) {
      alert('저장 실패: ' + error.message);
    }
  };

  return (
    <div className="tab-section">
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>🏪 매장별 현황</h3>
          <div className="store-filter-group">
            <label>사장명 필터</label>
            <select
              className="admin-input admin-select"
              style={{ width: 'auto', marginLeft: '8px' }}
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
            >
              <option value="전체">전체</option>
              {stores.map(s => (
                <option key={s.id} value={s.ownerName}>{s.ownerName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="stores-table">
          <div className="stores-table-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
            <span>사장명</span>
            <span>수수료율</span>
            <span>계약시작</span>
            <span>계약종료</span>
            <span>누적매출</span>
            <span>이번달매출</span>
            <span>이번달수수료</span>
            <span>취소건수</span>
            <span>관리</span>
          </div>
          {filteredStores.map(store => {
            const stats = getStoreStats(store);
            const isEditing = editingStore?.id === store.id;
            return (
              <div key={store.id} className="stores-table-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
                <span>{store.ownerName}</span>

                {/* 수수료율 */}
                {isEditing ? (
                  <input
                    type="number"
                    className="admin-input"
                    style={{ width: '60px' }}
                    value={editingStore.discountRate}
                    onChange={(e) => setEditingStore({ ...editingStore, discountRate: e.target.value })}
                  />
                ) : (
                  <span className="fee-rate">{store.discountRate}%</span>
                )}

                {/* 계약 시작일 */}
                {isEditing ? (
                  <input
                    type="date"
                    className="admin-input"
                    value={editingStore.contractStart || ''}
                    onChange={(e) => setEditingStore({ ...editingStore, contractStart: e.target.value })}
                  />
                ) : (
                  <span>{store.contractStart || '-'}</span>
                )}

                {/* 계약 종료일 */}
                {isEditing ? (
                  <input
                    type="date"
                    className="admin-input"
                    value={editingStore.contractEnd || ''}
                    onChange={(e) => setEditingStore({ ...editingStore, contractEnd: e.target.value })}
                  />
                ) : (
                  <span>{store.contractEnd || '-'}</span>
                )}

                <span>{stats.totalRevenue.toLocaleString()}원</span>
                <span>{stats.thisRevenue.toLocaleString()}원</span>
                <span className="fee-amount">{stats.thisFee.toLocaleString()}원</span>
                <span>{stats.cancelCount}건</span>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {isEditing ? (
                    <>
                      <button className="result-action-btn success" onClick={handleSaveEdit}>저장</button>
                      <button className="result-action-btn reset" onClick={() => setEditingStore(null)}>취소</button>
                    </>
                  ) : (
                    <>
                      <button className="detail-btn" onClick={() => setSelectedStore(store)}>상세</button>
                      <button className="detail-btn" onClick={() => setEditingStore({ ...store })}>수정</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedStore && (
        <StoreDetailModal
          store={selectedStore}
          reservations={reservations}
          onClose={() => setSelectedStore(null)}
        />
      )}
    </div>
  );
}

// =============================================
// 사업자 등록 탭
// =============================================
function RegisterTab({ onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const [storeForm, setStoreForm] = useState({
    ownerName: '',
    email: '',
    contact: '',
    bankName: '',
    bankAccount: '',
    bankHolder: '',
    discountRate: 10,
    contractStart: '',
    contractEnd: '',
  });

  const [branches, setBranches] = useState([
    { branchName: '', address: '', themes: [emptyTheme()] }
  ]);

  function emptyTheme() {
    return { name: '', genre: '', difficulty: 'normal', minPeople: 2, maxPeople: 6, price: '', duration: 60, description: '' };
  }

  const addBranch = () => setBranches([...branches, { branchName: '', address: '', themes: [emptyTheme()] }]);
  const removeBranch = (bi) => setBranches(branches.filter((_, i) => i !== bi));

  const addTheme = (bi) => {
    const updated = [...branches];
    updated[bi].themes.push(emptyTheme());
    setBranches(updated);
  };
  const removeTheme = (bi, ti) => {
    const updated = [...branches];
    updated[bi].themes = updated[bi].themes.filter((_, i) => i !== ti);
    setBranches(updated);
  };

  const updateBranch = (bi, field, value) => {
    const updated = [...branches];
    updated[bi][field] = value;
    setBranches(updated);
  };
  const updateTheme = (bi, ti, field, value) => {
    const updated = [...branches];
    updated[bi].themes[ti][field] = value;
    setBranches(updated);
  };

  const handleRegisterStore = async () => {
    if (!storeForm.ownerName || !storeForm.email || !storeForm.contact) {
      alert('필수 항목을 입력해주세요.'); return;
    }
    setLoading(true);
    try {
      const storeId = await createStore({ ...storeForm, branches });

      const tempPassword = generateTempPassword();
      setGeneratedPassword(tempPassword);

      await createStoreAdminAccount({
        email: storeForm.email,
        password: tempPassword,
        nickname: storeForm.ownerName,
        storeId,
      });

      setStep(2);
    } catch (error) {
      alert('등록 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="tab-section">
        <div className="admin-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3em', marginBottom: '16px' }}>🎉</div>
          <h3>사업자 등록 완료!</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            매장관리자 계정이 생성되었어요. 아래 임시 비밀번호를 사장님께 전달해주세요.
          </p>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>이메일: </span>
              <strong>{storeForm.email}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>임시 비밀번호: </span>
              <strong style={{ color: 'var(--accent-gold)', fontSize: '1.2em', letterSpacing: '2px' }}>
                {generatedPassword}
              </strong>
            </div>
          </div>
          <p style={{ color: '#ff6b7a', fontSize: '0.9em', marginBottom: '24px' }}>
            ⚠️ 이 창을 닫으면 임시 비밀번호를 다시 볼 수 없어요. 반드시 메모해두세요!
          </p>
          <button className="mypage-btn primary" onClick={onComplete}>
            매장 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-section">
      {/* 기본 정보 */}
      <div className="admin-card">
        <h3>📋 사업자 기본 정보</h3>
        <div className="input-group-vertical">
          {[
            { label: '사장 이름 *', field: 'ownerName', type: 'text' },
            { label: '사업자 이메일 * (로그인 계정)', field: 'email', type: 'email' },
            { label: '연락처 *', field: 'contact', type: 'text' },
            { label: '은행명', field: 'bankName', type: 'text' },
            { label: '계좌번호', field: 'bankAccount', type: 'text' },
            { label: '예금주', field: 'bankHolder', type: 'text' },
          ].map(({ label, field, type }) => (
            <div key={field} className="input-row">
              <label style={{ minWidth: '200px', color: 'var(--text-muted)' }}>{label}</label>
              <input
                type={type}
                className="mypage-input"
                value={storeForm[field]}
                onChange={(e) => setStoreForm({ ...storeForm, [field]: e.target.value })}
              />
            </div>
          ))}
          <div className="input-row">
            <label style={{ minWidth: '200px', color: 'var(--text-muted)' }}>수수료율 (%)</label>
            <input
              type="number"
              className="mypage-input"
              style={{ width: '80px' }}
              value={storeForm.discountRate}
              onChange={(e) => setStoreForm({ ...storeForm, discountRate: Number(e.target.value) })}
            />
          </div>
          <div className="input-row">
            <label style={{ minWidth: '200px', color: 'var(--text-muted)' }}>계약 시작일</label>
            <input
              type="date"
              className="mypage-input"
              value={storeForm.contractStart}
              onChange={(e) => setStoreForm({ ...storeForm, contractStart: e.target.value })}
            />
          </div>
          <div className="input-row">
            <label style={{ minWidth: '200px', color: 'var(--text-muted)' }}>계약 종료일</label>
            <input
              type="date"
              className="mypage-input"
              value={storeForm.contractEnd}
              onChange={(e) => setStoreForm({ ...storeForm, contractEnd: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 지점 + 테마 */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🏪 지점 및 테마 정보</h3>
          <button className="mypage-btn primary" onClick={addBranch}>+ 지점 추가</button>
        </div>

        {branches.map((branch, bi) => (
          <div key={bi} style={{
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <strong>지점 {bi + 1}</strong>
              {branches.length > 1 && (
                <button className="mypage-btn small danger" onClick={() => removeBranch(bi)}>삭제</button>
              )}
            </div>
            <div className="input-group-vertical" style={{ marginBottom: '16px' }}>
              <div className="input-row">
                <label style={{ minWidth: '100px', color: 'var(--text-muted)' }}>지점명</label>
                <input
                  type="text"
                  className="mypage-input"
                  value={branch.branchName}
                  onChange={(e) => updateBranch(bi, 'branchName', e.target.value)}
                />
              </div>
              <div className="input-row">
                <label style={{ minWidth: '100px', color: 'var(--text-muted)' }}>주소</label>
                <input
                  type="text"
                  className="mypage-input"
                  value={branch.address}
                  onChange={(e) => updateBranch(bi, 'address', e.target.value)}
                />
              </div>
            </div>

            {/* 테마 목록 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>테마 목록</span>
              <button className="mypage-btn small" onClick={() => addTheme(bi)}>+ 테마 추가</button>
            </div>

            {branch.themes.map((theme, ti) => (
              <div key={ti} style={{
                background: 'var(--bg-secondary)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>테마 {ti + 1}</span>
                  {branch.themes.length > 1 && (
                    <button className="mypage-btn small danger" onClick={() => removeTheme(bi, ti)}>삭제</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: '테마명', field: 'name', type: 'text' },
                    { label: '장르', field: 'genre', type: 'text' },
                    { label: '최소 인원', field: 'minPeople', type: 'number' },
                    { label: '최대 인원', field: 'maxPeople', type: 'number' },
                    { label: '가격 (원)', field: 'price', type: 'number' },
                    { label: '진행시간 (분)', field: 'duration', type: 'number' },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block' }}>{label}</label>
                      <input
                        type={type}
                        className="mypage-input"
                        value={theme[field]}
                        onChange={(e) => updateTheme(bi, ti, field, e.target.value)}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block' }}>난이도</label>
                    <select
                      className="admin-input admin-select"
                      value={theme.difficulty}
                      onChange={(e) => updateTheme(bi, ti, 'difficulty', e.target.value)}
                    >
                      <option value="easy">쉬움</option>
                      <option value="normal">보통</option>
                      <option value="hard">어려움</option>
                      <option value="expert">전문가</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block' }}>테마 설명</label>
                    <textarea
                      className="review-textarea"
                      style={{ height: '60px' }}
                      value={theme.description}
                      onChange={(e) => updateTheme(bi, ti, 'description', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'right', marginTop: '16px' }}>
        <button
          className="mypage-btn primary"
          style={{ padding: '12px 32px', fontSize: '1em' }}
          onClick={handleRegisterStore}
          disabled={loading}
        >
          {loading ? '등록 중...' : '🏪 사업자 등록 및 계정 생성'}
        </button>
      </div>
    </div>
  );
}

// =============================================
// 수수료 정산 탭
// =============================================
function FeeTab({ stores, reservations }) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const prevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toISOString().slice(0, 7);

  const getThemeNames = (store) =>
    store.branches?.flatMap(b => b.themes?.map(t => t.name) || []) || [];

  const feeData = stores.map(store => {
    const themeNames = getThemeNames(store);
    const active = reservations.filter(r => themeNames.includes(r.productName) && !r.cancelled);
    const thisRevenue = active.filter(r => r.date?.startsWith(thisMonth)).reduce((s, r) => s + (r.price || 0), 0);
    const prevRevenue = active.filter(r => r.date?.startsWith(prevMonth)).reduce((s, r) => s + (r.price || 0), 0);
    const thisFee = Math.floor(thisRevenue * (store.discountRate || 0) / 100);
    const prevFee = Math.floor(prevRevenue * (store.discountRate || 0) / 100);
    return { store, thisRevenue, prevRevenue, thisFee, prevFee };
  });

  const totalThisFee = feeData.reduce((s, d) => s + d.thisFee, 0);

  return (
    <div className="tab-section">
      <div className="admin-card fee-summary-card">
        <h3>💳 이번달 수수료 정산 ({thisMonth})</h3>
        <div className="fee-summary-list">
          {feeData.map(({ store, thisRevenue, prevRevenue, thisFee, prevFee }) => {
            const diff = thisFee - prevFee;
            return (
              <div key={store.id} className="fee-summary-row">
                <div className="fee-summary-left">
                  <strong>{store.ownerName}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>{store.email}</span>
                  <span className="fee-contact">{store.contact}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8em' }}>
                    계약: {store.contractStart} ~ {store.contractEnd}
                  </span>
                </div>
                <div className="fee-summary-right">
                  <div className="fee-calc">
                    <span>이번달 {thisRevenue.toLocaleString()}원 × {store.discountRate}%</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
                      전달 {prevFee.toLocaleString()}원
                    </span>
                  </div>
                  <div className="fee-total">{thisFee.toLocaleString()}원</div>
                  {diff !== 0 && (
                    <span style={{ fontSize: '0.8em', color: diff > 0 ? '#6fcf97' : '#ff6b7a' }}>
                      {diff > 0 ? `▲ ${diff.toLocaleString()}원` : `▼ ${Math.abs(diff).toLocaleString()}원`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div className="fee-grand-total">
            <span>이번달 총 플랫폼 수익</span>
            <strong>{totalThisFee.toLocaleString()}원</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 매장 상세 모달
// =============================================
function StoreDetailModal({ store, reservations, onClose }) {
  const themeNames = store.branches?.flatMap(b => b.themes?.map(t => t.name) || []) || [];
  const storeRecords = reservations.filter(r => themeNames.includes(r.productName));

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal store-detail-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ overflowY: 'auto', maxHeight: '85vh' }}
      >
        <button className="admin-modal-close" onClick={onClose}>×</button>
        <h3>{store.ownerName} 매장 상세</h3>

        <div className="store-detail-info">
          {[
            { label: '이메일',    value: store.email },
            { label: '연락처',    value: store.contact },
            { label: '은행',      value: `${store.bankName} ${store.bankAccount} (${store.bankHolder})` },
            { label: '수수료율',  value: `${store.discountRate}%` },
            { label: '계약기간',  value: `${store.contractStart} ~ ${store.contractEnd}` },
          ].map(({ label, value }) => (
            <div key={label} className="store-info-row">
              <span>{label}</span>
              <strong>{value || '-'}</strong>
            </div>
          ))}
        </div>

        {store.branches?.map(branch => {
          const branchRecords = storeRecords.filter(r => r.branch === branch.branchName);
          const themeStats = {};
          branchRecords.forEach(r => {
            if (!themeStats[r.productName]) themeStats[r.productName] = { count: 0, revenue: 0, cancel: 0 };
            if (r.cancelled) themeStats[r.productName].cancel++;
            else { themeStats[r.productName].count++; themeStats[r.productName].revenue += r.price || 0; }
          });

          return (
            <div key={branch.id} className="branch-section">
              <div className="branch-header">
                <span className="branch-name">🏪 {branch.branchName}</span>
                <span>{branch.address}</span>
              </div>

              <div style={{ padding: '8px 16px' }}>
                <strong style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>테마 목록</strong>
                {branch.themes?.map(theme => (
                  <div key={theme.id} className="theme-stats-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                    <span>{theme.name}</span>
                    <span>{theme.genre}</span>
                    <span>{theme.difficulty}</span>
                    <span>{theme.minPeople}~{theme.maxPeople}인</span>
                    <span>{Number(theme.price).toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SuperAdminPage;