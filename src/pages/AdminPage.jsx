import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import '../styles/Global.css';
import '../styles/AdminPage.css';
import productsData from '../data/products';

// 관리자 권한에 따라 데이터 필터링
const filterByAdmin = (records, user) => {
  if (!user) return [];
  if (user.adminRole === 'super') return records;
  return records.filter(r =>
    user.managedStores?.includes(r.productName)
  );
};

function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
  const user = sessionStorage.getItem('loggedInUser');
  if (!user) {
    alert('로그인이 필요해요!');
    navigate('/login');
    return;
  }
  const parsed = JSON.parse(user);
  if (!parsed.isAdmin) {
    alert('관리자만 접근할 수 있어요!');
    navigate('/');
    return;
  }
  // 총괄관리자는 super-admin으로 자동 이동
  if (parsed.adminRole === 'super') {
    navigate('/super-admin');
    return;
  }
  setLoggedInUser(parsed);
}, [navigate]);

  if (!loggedInUser) return null;

  const isSuper = loggedInUser.adminRole === 'super';

  const tabs = [
    { id: 'dashboard',    label: '📊 대시보드' },
    { id: 'reservations', label: '📋 예약 관리' },
    ...(isSuper ? [{ id: 'themes', label: '🎭 테마 관리' }] : []),
    { id: 'report',       label: '📄 월간 보고서' },
  ];

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="admin-content">

          <div className="admin-header">
            <div>
              <h1 className="admin-title">🔐 Admin Dashboard</h1>
              <p className="admin-subtitle">
                EscapeHub 관리자 페이지
                {!isSuper && (
                  <span className="admin-store-badge">
                    관리 매장: {loggedInUser.managedStores?.join(', ')}
                  </span>
                )}
              </p>
            </div>
            <div className="admin-header-info">
              <span>{loggedInUser.nickname}</span>
              <span className={`admin-role-badge ${isSuper ? 'super' : 'store'}`}>
                {isSuper ? '👑 총괄관리자' : '🏪 매장관리자'}
              </span>
              <span>{new Date().toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}</span>
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
            {activeTab === 'dashboard'    && <DashboardTab user={loggedInUser} />}
            {activeTab === 'reservations' && <ReservationsTab user={loggedInUser} />}
            {activeTab === 'themes'       && isSuper && <ThemesTab />}
            {activeTab === 'report'       && <ReportTab user={loggedInUser} />}
          </div>

        </div>
      </BoxMain>
    </div>
  );
}

// =============================================
// 탭 1: 대시보드
// =============================================
function DashboardTab({ user }) {
  const allRecords = JSON.parse(localStorage.getItem('reservationRecords') || '[]');
  const allReviews = JSON.parse(localStorage.getItem('userReviews') || '[]');
  const records = filterByAdmin(allRecords, user);
  const reviews = filterByAdmin(allReviews, user);

  const totalRevenue = records.filter(r => !r.cancelled).reduce((sum, r) => sum + (r.price || 0), 0);
  const cancelCount = records.filter(r => r.cancelled).length;

  // 매장별 → 방탈출별 그룹화
  const storeGrouped = records.reduce((acc, r) => {
    const theme = r.theme || '기타';
    const name = r.productName || '기타';
    if (!acc[theme]) acc[theme] = {};
    if (!acc[theme][name]) acc[theme][name] = { count: 0, revenue: 0, cancel: 0 };
    if (r.cancelled) {
      acc[theme][name].cancel++;
    } else {
      acc[theme][name].count++;
      acc[theme][name].revenue += r.price || 0;
    }
    return acc;
  }, {});

  return (
    <div className="tab-section">

      {/* 전체 현황 */}
      <div className="admin-card">
        <h3>전체 현황</h3>
        <div className="dashboard-stats">
          {[
            { label: '총 매출', value: `${totalRevenue.toLocaleString()}원`, icon: '💰' },
            { label: '총 예약', value: `${records.filter(r => !r.cancelled).length}건`, icon: '📋' },
            { label: '취소', value: `${cancelCount}건`, icon: '❌' },
            { label: '총 리뷰', value: `${reviews.length}건`, icon: '✍️' },
          ].map(stat => (
            <div key={stat.label} className="dashboard-stat-item">
              <span className="dashboard-stat-icon">{stat.icon}</span>
              <span className="dashboard-stat-value">{stat.value}</span>
              <span className="dashboard-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 장르별 → 방탈출별 예약 현황 */}
      <div className="admin-card">
        <h3>매장별 · 방탈출별 예약 현황</h3>
        {Object.keys(storeGrouped).length === 0 ? (
          <p className="admin-empty">예약 데이터가 없어요.</p>
        ) : (
          <div className="grouped-stats-table">
            {Object.entries(storeGrouped)
              .sort((a, b) => {
                const aTotal = Object.values(a[1]).reduce((s, v) => s + v.count, 0);
                const bTotal = Object.values(b[1]).reduce((s, v) => s + v.count, 0);
                return bTotal - aTotal;
              })
              .map(([theme, products]) => {
                const themeTotal = Object.values(products).reduce((s, v) => s + v.count, 0);
                const themeRevenue = Object.values(products).reduce((s, v) => s + v.revenue, 0);
                const themeCancel = Object.values(products).reduce((s, v) => s + v.cancel, 0);
                return (
                  <div key={theme} className="grouped-theme-section">
                    {/* 장르 헤더 */}
                    <div className="grouped-theme-header">
                      <span className="grouped-theme-label">🎭 {theme}</span>
                      <span>예약 {themeTotal}건</span>
                      <span>{themeRevenue.toLocaleString()}원</span>
                      <span>취소 {themeCancel}건</span>
                    </div>
                    {/* 방탈출별 */}
                    <div className="grouped-product-list">
                      <div className="grouped-product-header">
                        <span>방탈출명</span>
                        <span>예약 수</span>
                        <span>매출</span>
                        <span>취소</span>
                      </div>
                      {Object.entries(products)
                        .sort((a, b) => b[1].count - a[1].count)
                        .map(([name, data]) => (
                          <div key={name} className="grouped-product-row">
                            <span>{name}</span>
                            <span>{data.count}건</span>
                            <span>{data.revenue.toLocaleString()}원</span>
                            <span className="cancel-count">{data.cancel}건</span>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 월별 비교표 */}
      <MonthlyCompareTable records={records} />

    </div>
  );
}

// =============================================
// 월별 비교표 컴포넌트 (4번 요구사항)
// =============================================
function MonthlyCompareTable({ records }) {
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = prevDate.toISOString().slice(0, 7);

  const thisRecords = records.filter(r => r.date?.startsWith(thisMonth) && !r.cancelled);
  const prevRecords = records.filter(r => r.date?.startsWith(prevMonth) && !r.cancelled);

  const getStats = (recs) => {
    const total = recs.reduce((sum, r) => sum + (r.price || 0), 0);

    // 장르별
    const byTheme = recs.reduce((acc, r) => {
      const theme = r.theme || '기타';
      if (!acc[theme]) acc[theme] = { total: 0, products: {} };
      acc[theme].total += r.price || 0;
      const name = r.productName || '기타';
      if (!acc[theme].products[name]) acc[theme].products[name] = 0;
      acc[theme].products[name] += r.price || 0;
      return acc;
    }, {});

    return { total, byTheme };
  };

  const thisStats = getStats(thisRecords);
  const prevStats = getStats(prevRecords);

  const allThemes = [...new Set([
    ...Object.keys(thisStats.byTheme),
    ...Object.keys(prevStats.byTheme),
  ])];

  const diff = (curr, prev) => {
    if (prev === 0 && curr === 0) return null;
    if (prev === 0) return { text: '신규', cls: 'up' };
    const pct = Math.round(((curr - prev) / prev) * 100);
    if (pct > 0) return { text: `▲ ${pct}%`, cls: 'up' };
    if (pct < 0) return { text: `▼ ${Math.abs(pct)}%`, cls: 'down' };
    return { text: '─', cls: 'same' };
  };

  return (
    <div className="admin-card">
      <h3>월별 매출 비교</h3>
      <div className="compare-table">

        {/* 헤더 */}
        <div className="compare-header">
          <span>항목</span>
          <span>{prevMonth}</span>
          <span>{thisMonth}</span>
          <span>증감</span>
        </div>

        {/* 총 매출 */}
        <div className="compare-row total-row">
          <span>💰 총 매출</span>
          <span>{prevStats.total.toLocaleString()}원</span>
          <span>{thisStats.total.toLocaleString()}원</span>
          <span className={`diff-badge ${diff(thisStats.total, prevStats.total)?.cls || 'same'}`}>
            {diff(thisStats.total, prevStats.total)?.text || '─'}
          </span>
        </div>

        {/* 장르별 → 방탈출별 */}
        {allThemes.map(theme => {
          const currTheme = thisStats.byTheme[theme] || { total: 0, products: {} };
          const prevTheme = prevStats.byTheme[theme] || { total: 0, products: {} };
          const d = diff(currTheme.total, prevTheme.total);

          const allProducts = [...new Set([
            ...Object.keys(currTheme.products || {}),
            ...Object.keys(prevTheme.products || {}),
          ])];

          return (
            <React.Fragment key={theme}>
              {/* 장르 소계 */}
              <div className="compare-section-label">🎭 {theme}</div>
              <div className="compare-row theme-total-row">
                <span className="compare-indent">소계</span>
                <span>{prevTheme.total.toLocaleString()}원</span>
                <span>{currTheme.total.toLocaleString()}원</span>
                <span className={`diff-badge ${d?.cls || 'same'}`}>{d?.text || '─'}</span>
              </div>

              {/* 방탈출별 상세 */}
              {allProducts.map(product => {
                const curr = currTheme.products?.[product] || 0;
                const prev = prevTheme.products?.[product] || 0;
                const pd = diff(curr, prev);
                return (
                  <div key={product} className="compare-row product-row">
                    <span className="compare-indent-deep">└ {product}</span>
                    <span>{prev.toLocaleString()}원</span>
                    <span>{curr.toLocaleString()}원</span>
                    <span className={`diff-badge ${pd?.cls || 'same'}`}>{pd?.text || '─'}</span>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

      </div>
    </div>
  );
}

// =============================================
// 탭 2: 예약 관리 (5번 - 30분 자동 성공 처리)
// =============================================
function ReservationsTab({ user }) {
  const allRecords = JSON.parse(localStorage.getItem('reservationRecords') || '[]');
  const [records, setRecords] = useState(filterByAdmin(allRecords, user));
  const [filter, setFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const timerRefs = useRef({});

  // 30분 자동 성공 처리
  useEffect(() => {
    const now = Date.now();
    records.forEach(record => {
      if (record.success === null && !record.cancelled && !timerRefs.current[record.id]) {
        const createdAt = record.id;
        const elapsed = now - createdAt;
        const remaining = Math.max(0, 30 * 60 * 1000 - elapsed);

        timerRefs.current[record.id] = setTimeout(() => {
          setRecords(prev => {
            const updated = prev.map(r =>
              r.id === record.id ? { ...r, success: true, autoSuccess: true } : r
            );
            // 전체 localStorage도 업데이트
            const allRecs = JSON.parse(localStorage.getItem('reservationRecords') || '[]');
            const updatedAll = allRecs.map(r =>
              r.id === record.id ? { ...r, success: true, autoSuccess: true } : r
            );
            localStorage.setItem('reservationRecords', JSON.stringify(updatedAll));
            return updated;
          });
        }, remaining);
      }
    });

    return () => {
      Object.values(timerRefs.current).forEach(clearTimeout);
    };
  }, []);

  const filteredRecords = records.filter(r => {
    const matchFilter =
      filter === 'all'       ? true :
      filter === 'pending'   ? r.success === null && !r.cancelled :
      filter === 'success'   ? r.success === true :
      filter === 'fail'      ? r.success === false :
      filter === 'cancelled' ? r.cancelled : true;

    const matchSearch = searchKeyword
      ? r.productName?.includes(searchKeyword) || r.theme?.includes(searchKeyword)
      : true;

    return matchFilter && matchSearch;
  });

  const handleResultUpdate = (recordId, success) => {
    // 타이머 취소
    if (timerRefs.current[recordId]) {
      clearTimeout(timerRefs.current[recordId]);
      delete timerRefs.current[recordId];
    }

    const updated = records.map(r =>
      r.id === recordId ? { ...r, success } : r
    );
    setRecords(updated);

    const allRecs = JSON.parse(localStorage.getItem('reservationRecords') || '[]');
    const updatedAll = allRecs.map(r =>
      r.id === recordId ? { ...r, success } : r
    );
    localStorage.setItem('reservationRecords', JSON.stringify(updatedAll));
  };

  // 남은 자동처리 시간 표시
  const getRemainingTime = (recordId) => {
    const elapsed = Date.now() - recordId;
    const remaining = Math.max(0, 30 * 60 * 1000 - elapsed);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}분 ${secs}초 후 자동 성공`;
  };

  return (
    <div className="tab-section">
      <div className="admin-card">
        <div className="reservations-toolbar">
          <div className="admin-filters">
            {[
              { key: 'all',       label: '전체' },
              { key: 'pending',   label: '⏳ 미완료' },
              { key: 'success',   label: '🟢 성공' },
              { key: 'fail',      label: '🔴 실패' },
              { key: 'cancelled', label: '❌ 취소' },
            ].map(f => (
              <button
                key={f.key}
                className={`admin-filter-btn ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="admin-search"
            placeholder="테마명으로 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <p className="admin-count">총 {filteredRecords.length}건</p>

        {filteredRecords.length === 0 ? (
          <p className="admin-empty">해당하는 예약이 없어요.</p>
        ) : (
          <div className="reservations-list">
            {[...filteredRecords].reverse().map(record => (
              <div
                key={record.id}
                className={`reservation-item ${record.cancelled ? 'cancelled' : ''}`}
              >
                <div className="reservation-item-top">
                  <div className="reservation-item-info">
                    <strong>{record.productName}</strong>
                    <div className="reservation-badges">
                      {record.success === true && !record.autoSuccess &&
                        <span className="admin-badge success">🟢 성공</span>}
                      {record.success === true && record.autoSuccess &&
                        <span className="admin-badge auto">🟢 자동성공</span>}
                      {record.success === false &&
                        <span className="admin-badge fail">🔴 실패</span>}
                      {record.success === null && !record.cancelled &&
                        <span className="admin-badge pending">⏳ 미완료</span>}
                      {record.cancelled &&
                        <span className="admin-badge cancelled">❌ 취소</span>}
                      {record.reviewed &&
                        <span className="admin-badge reviewed">✍️ 리뷰완료</span>}
                    </div>
                  </div>

                  {!record.cancelled && (
                    <div className="result-actions">
                      <button
                        className={`result-action-btn success ${record.success === true ? 'active' : ''}`}
                        onClick={() => handleResultUpdate(record.id, true)}
                      >
                        🟢 성공
                      </button>
                      <button
                        className={`result-action-btn fail ${record.success === false ? 'active' : ''}`}
                        onClick={() => handleResultUpdate(record.id, false)}
                      >
                        🔴 실패
                      </button>
                      {record.success !== null && (
                        <button
                          className="result-action-btn reset"
                          onClick={() => handleResultUpdate(record.id, null)}
                        >
                          초기화
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="reservation-item-detail">
                  <span>📅 {record.date}</span>
                  <span>🕐 {record.time}</span>
                  <span>👥 {record.people}</span>
                  <span>🎭 {record.theme}</span>
                  <span>💰 {record.price?.toLocaleString()}원</span>
                  {record.usedPoints > 0 &&
                    <span>💎 -{record.usedPoints.toLocaleString()}P</span>}
                </div>

                {/* 자동처리 카운트다운 */}
                {record.success === null && !record.cancelled && (
                  <AutoTimer recordId={record.id} onExpire={() => handleResultUpdate(record.id, true)} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 자동처리 타이머 컴포넌트
function AutoTimer({ recordId, onExpire }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const elapsed = Date.now() - recordId;
      const rem = Math.max(0, 30 * 60 * 1000 - elapsed);
      if (rem === 0) {
        onExpire();
        return;
      }
      const mins = Math.floor(rem / 60000);
      const secs = Math.floor((rem % 60000) / 1000);
      setRemaining(`${mins}분 ${secs}초 후 자동 성공 처리`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [recordId, onExpire]);

  return (
    <div className="auto-timer">
      ⏱ {remaining}
    </div>
  );
}

// =============================================
// 탭 3: 테마 관리 (6번 - 장르 선택, 로컬 이미지)
// =============================================
const GENRE_OPTIONS = [
  '공포/스릴러', '추리/미스터리', 'SF/미래',
  '판타지/어드벤처', '액션', '로맨스', '코미디',
  '역사', '좀비', '심리', '기타',
];

function ThemesTab() {
  const [themes, setThemes] = useState(
    JSON.parse(localStorage.getItem('adminThemes') || 'null') || productsData
  );
  const [editTarget, setEditTarget] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTheme, setNewTheme] = useState({
    title: '', theme: '', genre: '', difficulty: 3,
    description: '', imageUrl: '',
    location: { city: '', district: '' },
    availableTimes: [],
    priceTable: { '2인': 0, '3인': 0, '4인': 0 },
    rating: 0, reviewCount: 0, recentReviews: [],
  });

  const saveThemes = (updated) => {
    setThemes(updated);
    localStorage.setItem('adminThemes', JSON.stringify(updated));
  };

  const handleImageUpload = (e, setter, current) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter({ ...current, imageUrl: ev.target.result });
    reader.readAsDataURL(file);
  };

  const handleDelete = (id) => {
    if (!window.confirm('이 테마를 삭제하시겠어요?')) return;
    saveThemes(themes.filter(t => t.id !== id));
  };

  const handleAdd = () => {
    if (!newTheme.title.trim()) { alert('테마명을 입력해주세요.'); return; }
    saveThemes([...themes, { ...newTheme, id: Date.now() }]);
    setShowAddForm(false);
    setNewTheme({
      title: '', theme: '', genre: '', difficulty: 3,
      description: '', imageUrl: '',
      location: { city: '', district: '' },
      availableTimes: [],
      priceTable: { '2인': 0, '3인': 0, '4인': 0 },
      rating: 0, reviewCount: 0, recentReviews: [],
    });
  };

  return (
    <div className="tab-section">
      <div className="admin-card">
        <div className="themes-toolbar">
          <h3>테마 목록 ({themes.length}개)</h3>
          <button className="admin-add-btn" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? '✕ 닫기' : '+ 테마 추가'}
          </button>
        </div>

        {showAddForm && (
          <ThemeForm
            data={newTheme}
            onChange={setNewTheme}
            onImageUpload={(e) => handleImageUpload(e, setNewTheme, newTheme)}
            onSubmit={handleAdd}
            submitLabel="추가하기"
          />
        )}

        <div className="themes-list">
          {themes.map(theme => (
            <div key={theme.id} className="theme-item">
              {theme.imageUrl && (
                <img src={theme.imageUrl} alt={theme.title} className="theme-item-img" />
              )}
              <div className="theme-item-info">
                <strong>{theme.title}</strong>
                <span>{theme.theme} · {theme.location?.city} {theme.location?.district}</span>
                <span>⭐ {theme.rating} · 난이도 {'★'.repeat(theme.difficulty)}{'☆'.repeat(5 - theme.difficulty)}</span>
              </div>
              <div className="theme-item-actions">
                <button className="result-action-btn reset" onClick={() => setEditTarget({ ...theme })}>수정</button>
                <button className="result-action-btn fail" onClick={() => handleDelete(theme.id)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editTarget && (
        <div className="admin-modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setEditTarget(null)}>×</button>
            <h3>테마 수정</h3>
            <ThemeForm
              data={editTarget}
              onChange={setEditTarget}
              onImageUpload={(e) => handleImageUpload(e, setEditTarget, editTarget)}
              onSubmit={() => {
                saveThemes(themes.map(t => t.id === editTarget.id ? editTarget : t));
                setEditTarget(null);
              }}
              submitLabel="저장하기"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 테마 폼 공통 컴포넌트
function ThemeForm({ data, onChange, onImageUpload, onSubmit, submitLabel }) {
  return (
    <div className="theme-add-form">
      <div className="theme-form-grid">
        <div className="form-group">
          <label>테마명 *</label>
          <input className="admin-input" value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            placeholder="예: 저주받은 저택" />
        </div>

        <div className="form-group">
          <label>장르 선택</label>
          <select className="admin-input admin-select" value={data.theme}
            onChange={(e) => onChange({ ...data, theme: e.target.value })}>
            <option value="">장르 선택...</option>
            {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>도시</label>
          <input className="admin-input" value={data.location?.city || ''}
            onChange={(e) => onChange({ ...data, location: { ...data.location, city: e.target.value } })}
            placeholder="예: 서울" />
        </div>

        <div className="form-group">
          <label>구/군</label>
          <input className="admin-input" value={data.location?.district || ''}
            onChange={(e) => onChange({ ...data, location: { ...data.location, district: e.target.value } })}
            placeholder="예: 강남구" />
        </div>

        <div className="form-group">
          <label>난이도 (1~5)</label>
          <input className="admin-input" type="number" min={1} max={5} value={data.difficulty}
            onChange={(e) => onChange({ ...data, difficulty: parseInt(e.target.value) })} />
        </div>

        <div className="form-group">
          <label>2인 가격</label>
          <input className="admin-input" type="number" value={data.priceTable?.['2인'] || 0}
            onChange={(e) => onChange({ ...data, priceTable: { ...data.priceTable, '2인': parseInt(e.target.value) } })}
            placeholder="예: 44000" />
        </div>

        <div className="form-group">
          <label>3인 가격</label>
          <input className="admin-input" type="number" value={data.priceTable?.['3인'] || 0}
            onChange={(e) => onChange({ ...data, priceTable: { ...data.priceTable, '3인': parseInt(e.target.value) } })}
            placeholder="예: 60000" />
        </div>

        <div className="form-group">
          <label>4인 가격</label>
          <input className="admin-input" type="number" value={data.priceTable?.['4인'] || 0}
            onChange={(e) => onChange({ ...data, priceTable: { ...data.priceTable, '4인': parseInt(e.target.value) } })}
            placeholder="예: 72000" />
        </div>

        {/* 이미지 */}
        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label>이미지</label>
          <div className="image-upload-area">
            {/* URL 입력 */}
            <input className="admin-input" value={data.imageUrl?.startsWith('data:') ? '' : (data.imageUrl || '')}
              onChange={(e) => onChange({ ...data, imageUrl: e.target.value })}
              placeholder="이미지 URL 입력 (https://...)" />
            <div className="image-upload-divider">또는</div>
            {/* 로컬 파일 업로드 */}
            <label className="image-upload-btn">
              📁 로컬 이미지 선택
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={onImageUpload} />
            </label>
            {/* 미리보기 */}
            {data.imageUrl && (
              <img src={data.imageUrl} alt="미리보기" className="image-preview" />
            )}
          </div>
        </div>

        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label>설명</label>
          <textarea className="admin-input admin-textarea" value={data.description || ''}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            placeholder="테마 상세 설명" />
        </div>
      </div>
      <button className="admin-add-btn" onClick={onSubmit}>{submitLabel}</button>
    </div>
  );
}

// =============================================
// 탭 4: 월간 보고서 (7번 - PDF 다운로드)
// =============================================
function ReportTab({ user }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const reportRef = useRef(null);

  const allRecords = JSON.parse(localStorage.getItem('reservationRecords') || '[]');
  const allReviews = JSON.parse(localStorage.getItem('userReviews') || '[]');
  const records = filterByAdmin(allRecords, user);
  const reviews = filterByAdmin(allReviews, user);

  const monthRecords = records.filter(r => r.date?.startsWith(selectedMonth));
  const monthReviews = reviews.filter(r => r.date?.startsWith(selectedMonth));

  const totalRevenue = monthRecords.filter(r => !r.cancelled).reduce((sum, r) => sum + (r.price || 0), 0);
  const successCount = monthRecords.filter(r => r.success === true).length;
  const failCount = monthRecords.filter(r => r.success === false).length;
  const cancelCount = monthRecords.filter(r => r.cancelled).length;
  const successRate = (successCount + failCount) > 0
    ? Math.round((successCount / (successCount + failCount)) * 100) : 0;
  const avgRating = monthReviews.length > 0
    ? (monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length).toFixed(1) : '-';

  const themeStats = monthRecords.reduce((acc, r) => {
    const theme = r.theme || '기타';
    if (!acc[theme]) acc[theme] = 0;
    acc[theme]++;
    return acc;
  }, {});
  const topTheme = Object.entries(themeStats).sort((a, b) => b[1] - a[1])[0];

  // PDF 다운로드
  const handleDownloadPDF = () => {
    const printContent = document.getElementById('report-print-area').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>EscapeHub 월간 보고서 ${selectedMonth}</title>
          <style>
            body { font-family: 'Noto Sans KR', sans-serif; color: #222; padding: 40px; }
            h1 { color: #d4a843; font-size: 2em; margin-bottom: 4px; }
            h2 { color: #d4a843; font-size: 1.3em; border-bottom: 2px solid #d4a843; padding-bottom: 8px; margin-top: 32px; }
            .report-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
            .report-stat { border: 1px solid #ddd; border-radius: 8px; padding: 16px; text-align: center; }
            .report-stat-value { font-size: 1.5em; font-weight: bold; color: #d4a843; display: block; }
            .report-stat-label { font-size: 0.85em; color: #888; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th { background: #f5f0e0; padding: 10px; text-align: left; font-size: 0.9em; }
            td { padding: 10px; border-bottom: 1px solid #eee; font-size: 0.9em; }
            .review-item { border: 1px solid #eee; border-radius: 8px; padding: 12px; margin: 8px 0; }
            .review-header { display: flex; gap: 12px; font-size: 0.85em; color: #888; margin-bottom: 6px; }
            .subtitle { color: #888; font-size: 0.9em; margin-bottom: 32px; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="tab-section">
      <div className="admin-card">
        <div className="report-toolbar">
          <h3>월간 보고서</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="month" className="admin-input" style={{ width: 'auto' }}
              value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            <button className="admin-add-btn" onClick={handleDownloadPDF}>
              📥 PDF 다운로드
            </button>
          </div>
        </div>

        {/* 보고서 미리보기 (PDF 대상) */}
        <div className="report-preview" ref={reportRef}>
          <div id="report-print-area">
            <div className="report-header-box">
              <h2>EscapeHub 월간 보고서</h2>
              <p>{selectedMonth} · 생성일: {new Date().toLocaleDateString('ko-KR')}</p>
              {user.adminRole !== 'super' && (
                <p>관리 매장: {user.managedStores?.join(', ')}</p>
              )}
            </div>

            <div className="report-section">
              <h4>📊 핵심 지표</h4>
              <div className="report-stats">
                {[
                  { value: `${monthRecords.length}건`, label: '총 예약' },
                  { value: `${totalRevenue.toLocaleString()}원`, label: '총 매출' },
                  { value: `${successRate}%`, label: '성공률' },
                  { value: avgRating, label: '평균 별점' },
                  { value: `${monthReviews.length}건`, label: '리뷰 수' },
                  { value: `${cancelCount}건`, label: '취소 건수' },
                ].map(s => (
                  <div key={s.label} className="report-stat">
                    <span className="report-stat-value">{s.value}</span>
                    <span className="report-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="report-section">
              <h4>🎭 테마별 예약 현황</h4>
              {Object.keys(themeStats).length === 0 ? (
                <p className="admin-empty">데이터가 없어요.</p>
              ) : (
                <div className="theme-stats-table">
                  <div className="theme-stats-header">
                    <span>테마</span>
                    <span>예약 수</span>
                    <span>비율</span>
                  </div>
                  {Object.entries(themeStats).sort((a, b) => b[1] - a[1]).map(([theme, count]) => (
                    <div key={theme} className="theme-stats-row">
                      <span>{theme}</span>
                      <span>{count}건</span>
                      <span>{monthRecords.length > 0
                        ? `${Math.round((count / monthRecords.length) * 100)}%` : '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {topTheme && (
              <div className="report-section">
                <h4>🏆 이달의 인기 테마</h4>
                <div className="top-theme-box">
                  <span className="top-theme-name">{topTheme[0]}</span>
                  <span className="top-theme-count">{topTheme[1]}건 예약</span>
                </div>
              </div>
            )}

            <div className="report-section">
              <h4>✍️ 이달의 리뷰 ({monthReviews.length}건)</h4>
              {monthReviews.length === 0 ? (
                <p className="admin-empty">이달의 리뷰가 없어요.</p>
              ) : (
                <div className="report-reviews">
                  {monthReviews.map(review => (
                    <div key={review.id} className="report-review-item">
                      <div className="report-review-header">
                        <strong>{review.productName}</strong>
                        <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                        <span>{review.date}</span>
                      </div>
                      <p>{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;