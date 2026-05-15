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

const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const GENRE_OPTIONS = ['공포', '추리', 'SF', '판타지', '스릴러', '어드벤처', '로맨스', '코미디', '기타'];
const BANK_OPTIONS = ['국민은행', '신한은행', '우리은행', '하나은행', 'IBK기업은행', 'NH농협은행', '카카오뱅크', '토스뱅크', '케이뱅크', '새마을금고', '수협은행', '부산은행', '대구은행', '광주은행', '전북은행', '경남은행', '제주은행'];

const calcFee = (store, revenue, themeCount = 0) => {
  if (store.feeType === 'fixed') return (store.fixedFee || 0) * themeCount;
  return Math.floor(revenue * (store.discountRate || 0) / 100);
};

function SuperAdminPage() {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stores, setStores] = useState([]);
  const [expiredStores, setExpiredStores] = useState([]);
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
      setStores(storeList.filter(s => s.status !== 'expired'));
      setExpiredStores(storeList.filter(s => s.status === 'expired'));
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
    { id: 'expired',   label: '📁 계약 종료' },
  ];

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="admin-content">
          <div className="admin-header super-header">
            <div>
              <h1 className="admin-title">👑 총괄 관리자 페이지</h1>
              <p className="admin-subtitle">EscapeHub 플랫폼 전체 현황</p>
            </div>
            <div className="admin-header-info">
              <span className="admin-role-badge super">👑 총괄관리자</span>
              <span>{loggedInUser.nickname}</span>
              <span>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

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
            {activeTab === 'dashboard' && <DashboardTab stores={stores} reservations={reservations} />}
            {activeTab === 'stores'    && <StoresTab stores={stores} reservations={reservations} onUpdate={loadData} />}
            {activeTab === 'register'  && <RegisterTab onComplete={() => { loadData(); setActiveTab('stores'); }} />}
            {activeTab === 'fee'       && <FeeTab stores={stores} reservations={reservations} />}
            {activeTab === 'expired'   && <ExpiredTab expiredStores={expiredStores} />}
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
  const totalBranches = stores.reduce((s, store) => s + (store.branches?.length || 0), 0);

  const totalFee = stores.reduce((sum, store) => {
    const themeNames = store.branches?.flatMap(b => b.themes?.map(t => t.name) || []) || [];
    const themeCount = themeNames.length;
    const storeRevenue = thisReservations
      .filter(r => themeNames.includes(r.productName))
      .reduce((s, r) => s + (r.price || 0), 0);
    return sum + calcFee(store, storeRevenue, themeCount);
  }, 0);

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
            { icon: '🏢', label: '계약 사업자 수',    value: `${stores.length}개` },
            { icon: '🏪', label: '계약 지점 수',      value: `${totalBranches}개` },
            { icon: '💰', label: '전체 누적 매출',    value: `${totalRevenue.toLocaleString()}원` },
            { icon: '📅', label: '이번달 예약 수',    value: `${thisReservations.length}건` },
            { icon: '💎', label: '이번달 플랫폼 수익', value: `${totalFee.toLocaleString()}원` },
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
          <h3>⚠️ 계약 만료 임박 (30일 이내)</h3>
          {soonExpiring.map(store => {
            const diffDays = Math.ceil((new Date(store.contractEnd) - today) / (1000 * 60 * 60 * 24));
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
  const prevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7);

  const getThemeNames = (store) => store.branches?.flatMap(b => b.themes?.map(t => t.name) || []) || [];

  const getStoreStats = (store) => {
    const themeNames = getThemeNames(store);
    const themeCount = themeNames.length;
    const active = reservations.filter(r => themeNames.includes(r.productName) && !r.cancelled);
    const thisRevenue = active.filter(r => r.date?.startsWith(thisMonth)).reduce((s, r) => s + (r.price || 0), 0);
    const prevRevenue = active.filter(r => r.date?.startsWith(prevMonth)).reduce((s, r) => s + (r.price || 0), 0);
    const thisFee = calcFee(store, thisRevenue, themeCount);
    const prevFee = calcFee(store, prevRevenue, themeCount);
    return { thisRevenue, prevRevenue, thisFee, prevFee, themeCount };
  };

  const filteredStores = stores.filter(s => filterOwner === '전체' || s.ownerName === filterOwner);

  const handleSaveEdit = async () => {
    try {
      await updateStore(editingStore.id, {
        feeType: editingStore.feeType,
        discountRate: Number(editingStore.discountRate),
        fixedFee: Number(editingStore.fixedFee),
        contractEnd: editingStore.contractEnd,
      });
      alert('저장되었어요!');
      setEditingStore(null);
      onUpdate();
    } catch (error) {
      alert('저장 실패: ' + error.message);
    }
  };

  const handleExpire = async (store) => {
    if (!window.confirm(`${store.ownerName} 매장의 계약을 종료할까요?`)) return;
    try {
      await updateStore(store.id, {
        status: 'expired',
        expiredAt: new Date().toISOString(),
      });
      alert('계약이 종료되었어요.');
      setEditingStore(null);
      onUpdate();
    } catch (error) {
      alert('처리 실패: ' + error.message);
    }
  };

  const feeTypeLabel = (store) => {
    if (store.feeType === 'fixed') return `지정금액 (${(store.fixedFee || 0).toLocaleString()}원/방)`;
    return `요율 ${store.discountRate || 0}%`;
  };

  return (
    <div className="tab-section">
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>🏪 매장별 현황</h3>
          <div className="store-filter-group">
            <label>사업자명 필터</label>
            <select
              className="admin-input admin-select"
              style={{ width: 'auto', marginLeft: '8px' }}
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
            >
              <option value="전체">전체</option>
              {stores.map(s => <option key={s.id} value={s.ownerName}>{s.ownerName}</option>)}
            </select>
          </div>
        </div>

        <div className="stores-table">
          <div className="stores-table-header" style={{ gridTemplateColumns: '1.2fr 1fr 0.7fr 1fr 1fr 1fr 1.2fr 1fr 1fr' }}>
            <span>사업자명</span>
            <span>매장명(지점)</span>
            <span>테마 수</span>
            <span>계약일</span>
            <span>지난달 매출</span>
            <span>이번달 매출</span>
            <span>수수료 방식</span>
            <span>이번달 수수료</span>
            <span>관리</span>
          </div>

          {filteredStores.map(store => {
            const stats = getStoreStats(store);
            const isEditing = editingStore?.id === store.id;
            const branchNames = store.branches?.map(b => b.branchName).join(', ') || '-';

            return (
              <div key={store.id} className="stores-table-row"
                style={{ gridTemplateColumns: '1.2fr 1fr 0.7fr 1fr 1fr 1fr 1.2fr 1fr 1fr' }}>
                <span>{store.ownerName}</span>
                <span style={{ fontSize: '0.85em' }}>{branchNames}</span>
                <span>{stats.themeCount}개</span>
                <span style={{ fontSize: '0.85em' }}>
                  {store.contractStart}<br/>~ {store.contractEnd}
                </span>
                <span>{stats.prevRevenue.toLocaleString()}원</span>
                <span>{stats.thisRevenue.toLocaleString()}원</span>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <select className="admin-input admin-select" style={{ fontSize: '0.8em' }}
                      value={editingStore.feeType}
                      onChange={(e) => setEditingStore({ ...editingStore, feeType: e.target.value })}>
                      <option value="rate">요율(%)</option>
                      <option value="fixed">지정금액</option>
                    </select>
                    {editingStore.feeType === 'rate' ? (
                      <input type="number" className="admin-input" style={{ width: '60px' }}
                        value={editingStore.discountRate}
                        onChange={(e) => setEditingStore({ ...editingStore, discountRate: e.target.value })} />
                    ) : (
                      <input type="number" className="admin-input" style={{ width: '90px' }}
                        placeholder="원/방"
                        value={editingStore.fixedFee || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, fixedFee: e.target.value })} />
                    )}
                  </div>
                ) : (
                  <span className="fee-rate" style={{ fontSize: '0.85em' }}>{feeTypeLabel(store)}</span>
                )}

                <span className="fee-amount">{stats.thisFee.toLocaleString()}원</span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {isEditing ? (
                    <>
                      <input type="date" className="admin-input"
                        value={editingStore.contractEnd || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, contractEnd: e.target.value })} />
                      <button className="result-action-btn success" onClick={handleSaveEdit}>저장</button>
                      <button className="result-action-btn reset" onClick={() => setEditingStore(null)}>취소</button>
                      <button className="result-action-btn fail" onClick={() => handleExpire(store)}>계약종료</button>
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
function emptyTheme(minPeople = 2, maxPeople = 6) {
  return {
    name: '', genre: '공포', difficulty: 'normal',
    minPeople, maxPeople, duration: 60,
    description: '', imageFile: null, imagePreview: '',
    pricing: Array.from(
      { length: maxPeople - minPeople + 1 },
      (_, i) => ({ people: minPeople + i, price: '' })
    ),
  };
}

function RegisterTab({ onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const [storeForm, setStoreForm] = useState({
    ownerName: '',
    email: '',
    contact: '',
    bankName: BANK_OPTIONS[0],
    bankAccount: '',
    bankHolder: '',
    feeType: 'rate',
    discountRate: 10,
    fixedFee: '',
    contractStart: '',
    contractEnd: '',
  });

  const [branches, setBranches] = useState([
    { branchName: '', address: '', themes: [emptyTheme()] }
  ]);

  const addBranch = () => setBranches([...branches, { branchName: '', address: '', themes: [emptyTheme()] }]);
  const removeBranch = (bi) => setBranches(branches.filter((_, i) => i !== bi));
  const addTheme = (bi) => { const u = [...branches]; u[bi].themes.push(emptyTheme()); setBranches(u); };
  const removeTheme = (bi, ti) => { const u = [...branches]; u[bi].themes = u[bi].themes.filter((_, i) => i !== ti); setBranches(u); };
  const updateBranch = (bi, field, value) => { const u = [...branches]; u[bi][field] = value; setBranches(u); };

  const updateTheme = (bi, ti, field, value) => {
    const u = [...branches];
    u[bi].themes[ti][field] = value;

    if (field === 'minPeople' || field === 'maxPeople') {
      const theme = u[bi].themes[ti];
      const min = Number(field === 'minPeople' ? value : theme.minPeople);
      const max = Number(field === 'maxPeople' ? value : theme.maxPeople);
      if (min > 0 && max >= min) {
        u[bi].themes[ti].pricing = Array.from(
          { length: max - min + 1 },
          (_, i) => {
            const existing = theme.pricing?.find(p => p.people === min + i);
            return { people: min + i, price: existing?.price || '' };
          }
        );
      }
    }
    setBranches(u);
  };

  const handleImageChange = (bi, ti, file) => {
    if (!file) return;
    const u = [...branches];
    u[bi].themes[ti].imageFile = file;
    u[bi].themes[ti].imagePreview = URL.createObjectURL(file);
    setBranches(u);
  };

  const updatePricing = (bi, ti, pi, field, value) => {
    const u = [...branches]; u[bi].themes[ti].pricing[pi][field] = value; setBranches(u);
  };

  const handleRegisterStore = async () => {
    if (!storeForm.ownerName || !storeForm.email || !storeForm.contact) {
      alert('필수 항목을 입력해주세요.'); return;
    }
    setLoading(true);
    try {
      const branchesClean = branches.map(branch => ({
        ...branch,
        themes: branch.themes.map(theme => {
          const { imageFile, imagePreview, ...rest } = theme;
          return { ...rest, imageUrl: '' };
        }),
      }));

      const storeId = await createStore({ ...storeForm, branches: branchesClean });
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
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
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
          <button className="mypage-btn primary" onClick={onComplete}>매장 목록으로 이동</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-section">
      <div className="admin-card">
        <h3>📋 사업자 기본 정보</h3>
        <div className="input-group-vertical">
          {[
            { label: '사장 이름 *', field: 'ownerName', type: 'text' },
            { label: '사업자 이메일 * (로그인 계정)', field: 'email', type: 'email' },
            { label: '연락처 *', field: 'contact', type: 'text' },
          ].map(({ label, field, type }) => (
            <div key={field} className="input-row">
              <label style={{ minWidth: '200px', color: 'var(--text-muted)' }}>{label}</label>
              <input type={type} className="mypage-input" value={storeForm[field]}
                onChange={(e) => setStoreForm({ ...storeForm, [field]: e.target.value })} />
            </div>
          ))}

          {/* 은행명 → 예금주 → 계좌번호 순서 */}
          <div className="input-row">
            <label style={{ minWidth: '200px', color: 'var(--text-muted)' }}>은행명</label>
            <select className="admin-input admin-select" value={storeForm.bankName}
              onChange={(e) => setStoreForm({ ...storeForm, bankName: e.target.value })}>
              {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="input-row">
            <label style={{ minWidth: '200px', color: 'var(--text-muted)' }}>예금주</label>
            <input type="text" className="mypage-input" value={storeForm.bankHolder}
              onChange={(e) => setStoreForm({ ...storeForm, bankHolder: e.target.value })} />
          </div>
          <div className="input-row">
            <label style={{ minWidth: '200px', color: 'var(--text-muted)' }}>계좌번호</label>
            <input type="text" className="mypage-input" value={storeForm.bankAccount}
              onChange={(e) => setStoreForm({ ...storeForm, bankAccount: e.target.value })} />
          </div>

          {/* 수수료 방식 */}
          <div className="input-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--text-muted)' }}>수수료 방식</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { value: 'rate', label: '요율 (%) — 전체 매출의 N%' },
                { value: 'fixed', label: '지정금액 — 방 개수 × N원' },
              ].map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="radio" name="feeType" value={opt.value}
                    checked={storeForm.feeType === opt.value}
                    onChange={() => setStoreForm({ ...storeForm, feeType: opt.value })} />
                  {opt.label}
                </label>
              ))}
            </div>
            {storeForm.feeType === 'rate' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" className="mypage-input" style={{ width: '80px' }}
                  value={storeForm.discountRate}
                  onChange={(e) => setStoreForm({ ...storeForm, discountRate: Number(e.target.value) })} />
                <span style={{ color: 'var(--text-muted)' }}>%</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" className="mypage-input" style={{ width: '140px' }}
                  placeholder="방 1개당 금액"
                  value={storeForm.fixedFee}
                  onChange={(e) => setStoreForm({ ...storeForm, fixedFee: Number(e.target.value) })} />
                <span style={{ color: 'var(--text-muted)' }}>원 × 방 개수</span>
              </div>
            )}
          </div>

          <div className="input-row">
            <label style={{ minWidth: '200px', color: 'var(--text-muted)' }}>계약 시작일</label>
            <input type="date" className="mypage-input" value={storeForm.contractStart}
              onChange={(e) => setStoreForm({ ...storeForm, contractStart: e.target.value })} />
          </div>
          <div className="input-row">
            <label style={{ minWidth: '200px', color: 'var(--text-muted)' }}>계약 종료일</label>
            <input type="date" className="mypage-input" value={storeForm.contractEnd}
              onChange={(e) => setStoreForm({ ...storeForm, contractEnd: e.target.value })} />
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
          <div key={bi} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <strong>지점 {bi + 1}</strong>
              {branches.length > 1 && (
                <button className="mypage-btn small danger" onClick={() => removeBranch(bi)}>삭제</button>
              )}
            </div>
            <div className="input-group-vertical" style={{ marginBottom: '16px' }}>
              <div className="input-row">
                <label style={{ minWidth: '100px', color: 'var(--text-muted)' }}>지점명</label>
                <input type="text" className="mypage-input" value={branch.branchName}
                  onChange={(e) => updateBranch(bi, 'branchName', e.target.value)} />
              </div>
              <div className="input-row">
                <label style={{ minWidth: '100px', color: 'var(--text-muted)' }}>주소</label>
                <input type="text" className="mypage-input" value={branch.address}
                  onChange={(e) => updateBranch(bi, 'address', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>테마 목록</span>
              <button className="mypage-btn small" onClick={() => addTheme(bi)}>+ 테마 추가</button>
            </div>

            {branch.themes.map((theme, ti) => (
              <div key={ti} style={{ background: 'var(--bg-secondary)', borderRadius: '6px', padding: '12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>테마 {ti + 1}</span>
                  {branch.themes.length > 1 && (
                    <button className="mypage-btn small danger" onClick={() => removeTheme(bi, ti)}>삭제</button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block' }}>테마명</label>
                    <input type="text" className="mypage-input" value={theme.name}
                      onChange={(e) => updateTheme(bi, ti, 'name', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block' }}>장르</label>
                    <select className="admin-input admin-select" value={theme.genre}
                      onChange={(e) => updateTheme(bi, ti, 'genre', e.target.value)}>
                      {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block' }}>난이도</label>
                    <select className="admin-input admin-select" value={theme.difficulty}
                      onChange={(e) => updateTheme(bi, ti, 'difficulty', e.target.value)}>
                      <option value="easy">쉬움</option>
                      <option value="normal">보통</option>
                      <option value="hard">어려움</option>
                      <option value="expert">전문가</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block' }}>진행시간 (분)</label>
                    <input type="number" className="mypage-input" value={theme.duration}
                      onChange={(e) => updateTheme(bi, ti, 'duration', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block' }}>최소 인원</label>
                    <input type="number" className="mypage-input" value={theme.minPeople}
                      onChange={(e) => updateTheme(bi, ti, 'minPeople', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block' }}>최대 인원</label>
                    <input type="number" className="mypage-input" value={theme.maxPeople}
                      onChange={(e) => updateTheme(bi, ti, 'maxPeople', e.target.value)} />
                  </div>

                  {/* 이미지 업로드 UI (기능 추후 활성화) */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block' }}>
                      테마 이미지 <span style={{ color: '#ff6b7a', fontSize: '0.85em' }}>(업로드 기능 준비 중)</span>
                    </label>
                    <input type="file" accept="image/*"
                      onChange={(e) => handleImageChange(bi, ti, e.target.files[0])}
                      style={{ marginBottom: '8px' }} />
                    {theme.imagePreview && (
                      <img src={theme.imagePreview} alt="미리보기"
                        style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                    )}
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block' }}>테마 설명</label>
                    <textarea className="review-textarea" style={{ height: '60px' }} value={theme.description}
                      onChange={(e) => updateTheme(bi, ti, 'description', e.target.value)} />
                  </div>

                  {/* 인원별 가격 — 최소/최대 인원 기반 자동 생성 */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      인원별 가격
                    </label>
                    {theme.pricing.map((p, pi) => (
                      <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                          minWidth: '40px', textAlign: 'center',
                          color: 'var(--accent-gold)', fontWeight: 'bold', fontSize: '0.9em'
                        }}>
                          {p.people}명
                        </span>
                        <input type="number" className="mypage-input" style={{ width: '130px' }}
                          placeholder="가격 (원)" value={p.price}
                          onChange={(e) => updatePricing(bi, ti, pi, 'price', Number(e.target.value))} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>원</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'right', marginTop: '16px' }}>
        <button className="mypage-btn primary" style={{ padding: '12px 32px', fontSize: '1em' }}
          onClick={handleRegisterStore} disabled={loading}>
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
  const prevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7);

  const feeData = stores.map(store => {
    const themeNames = store.branches?.flatMap(b => b.themes?.map(t => t.name) || []) || [];
    const themeCount = themeNames.length;
    const active = reservations.filter(r => themeNames.includes(r.productName) && !r.cancelled);
    const thisRevenue = active.filter(r => r.date?.startsWith(thisMonth)).reduce((s, r) => s + (r.price || 0), 0);
    const prevRevenue = active.filter(r => r.date?.startsWith(prevMonth)).reduce((s, r) => s + (r.price || 0), 0);
    const thisFee = calcFee(store, thisRevenue, themeCount);
    const prevFee = calcFee(store, prevRevenue, themeCount);
    return { store, thisRevenue, thisFee, prevFee, themeCount };
  });

  const totalThisFee = feeData.reduce((s, d) => s + d.thisFee, 0);

  return (
    <div className="tab-section">
      <div className="admin-card fee-summary-card">
        <h3>💳 이번달 수수료 정산 ({thisMonth})</h3>
        <div className="fee-summary-list">
          {feeData.map(({ store, thisRevenue, thisFee, prevFee, themeCount }) => {
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
                    {store.feeType === 'fixed'
                      ? <span>{(store.fixedFee || 0).toLocaleString()}원 × {themeCount}방</span>
                      : <span>이번달 {thisRevenue.toLocaleString()}원 × {store.discountRate}%</span>}
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
// 계약 종료 탭
// =============================================
function ExpiredTab({ expiredStores }) {
  return (
    <div className="tab-section">
      <div className="admin-card">
        <h3>📁 계약 종료 히스토리</h3>
        {expiredStores.length === 0 ? (
          <p className="admin-empty">계약 종료된 매장이 없어요.</p>
        ) : (
          <div className="stores-table">
            <div className="stores-table-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
              <span>사업자명</span>
              <span>매장명(지점)</span>
              <span>계약 시작일</span>
              <span>계약 종료일</span>
            </div>
            {expiredStores.map(store => (
              <div key={store.id} className="stores-table-row"
                style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', opacity: 0.7 }}>
                <span>{store.ownerName}</span>
                <span style={{ fontSize: '0.85em' }}>
                  {store.branches?.map(b => b.branchName).join(', ') || '-'}
                </span>
                <span>{store.contractStart}</span>
                <span style={{ color: '#ff6b7a' }}>{store.contractEnd}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// 매장 상세 모달
// =============================================
function StoreDetailModal({ store, reservations, onClose }) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const prevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal store-detail-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ overflowY: 'auto', maxHeight: '85vh' }}>
        <button className="admin-modal-close" onClick={onClose}>×</button>
        <h3>{store.ownerName} 매장 상세</h3>

        <div className="store-detail-info">
          {[
            { label: '이메일',   value: store.email },
            { label: '연락처',   value: store.contact },
            { label: '은행',     value: `${store.bankName} ${store.bankAccount} (${store.bankHolder})` },
            { label: '수수료',   value: store.feeType === 'fixed' ? `${(store.fixedFee || 0).toLocaleString()}원/방` : `${store.discountRate}%` },
            { label: '계약기간', value: `${store.contractStart} ~ ${store.contractEnd}` },
          ].map(({ label, value }) => (
            <div key={label} className="store-info-row">
              <span>{label}</span><strong>{value || '-'}</strong>
            </div>
          ))}
        </div>

        {store.branches?.map(branch => {
          const themeNames = branch.themes?.map(t => t.name) || [];
          const branchRecs = reservations.filter(r => themeNames.includes(r.productName));
          const thisRevenue = branchRecs
            .filter(r => !r.cancelled && r.date?.startsWith(thisMonth))
            .reduce((s, r) => s + (r.price || 0), 0);
          const prevRevenue = branchRecs
            .filter(r => !r.cancelled && r.date?.startsWith(prevMonth))
            .reduce((s, r) => s + (r.price || 0), 0);
          const themeCount = themeNames.length;
          const thisFee = calcFee(store, thisRevenue, themeCount);

          return (
            <div key={branch.id || branch.branchName} className="branch-section">
              <div className="branch-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span className="branch-name">🏪 {branch.branchName}</span>
                <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{branch.address}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '10px 16px', background: 'var(--bg-secondary)', margin: '8px 0', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.75em', color: 'var(--text-muted)' }}>전달 매출</div>
                  <strong>{prevRevenue.toLocaleString()}원</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.75em', color: 'var(--text-muted)' }}>이번달 매출</div>
                  <strong>{thisRevenue.toLocaleString()}원</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.75em', color: 'var(--text-muted)' }}>이번달 수수료</div>
                  <strong style={{ color: 'var(--accent-gold)' }}>{thisFee.toLocaleString()}원</strong>
                </div>
              </div>

              <div style={{ padding: '8px 16px' }}>
                <strong style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>테마 목록</strong>
                <div className="theme-stats-table" style={{ marginTop: '8px' }}>
                  <div className="theme-stats-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                    <span>테마명</span><span>장르</span><span>난이도</span><span>인원</span><span>진행시간</span>
                  </div>
                  {branch.themes?.map((theme, i) => (
                    <div key={i} className="theme-stats-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                      <span>{theme.name}</span>
                      <span>{theme.genre}</span>
                      <span>{theme.difficulty}</span>
                      <span>{theme.minPeople}~{theme.maxPeople}인</span>
                      <span>{theme.duration}분</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SuperAdminPage;