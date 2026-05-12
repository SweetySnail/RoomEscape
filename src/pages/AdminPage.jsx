import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import '../styles/Global.css';
import '../styles/AdminPage.css';
import {
  getAllReservations,
  updateReservationResult,
} from '../services/reservationService';

// 관리자 권한에 따라 데이터 필터링
const filterByAdmin = (records, user) => {
  if (!user) return [];
  if (user.adminRole === 'super') return records;
  return records.filter(r => user.managedStores?.includes(r.productName));
};

function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) { alert('로그인이 필요해요!'); navigate('/login'); return; }
    const parsed = JSON.parse(user);
    if (!parsed.isAdmin || parsed.adminRole !== 'store') {
      navigate('/'); return;
    }
    setLoggedInUser(parsed);
  }, [navigate]);

  useEffect(() => {
    if (!loggedInUser) return;
    const loadRecords = async () => {
      try {
        const data = await getAllReservations();
        const filtered = filterByAdmin(data, loggedInUser);
        setRecords(filtered);
      } catch (error) {
        console.error('예약 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRecords();
  }, [loggedInUser]);

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
    { id: 'dashboard',    label: '📊 대시보드' },
    { id: 'reservations', label: '📋 예약 관리' },
  ];

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="admin-content">

          {/* 헤더 */}
          <div className="admin-header">
            <div>
              <h1 className="admin-title">🏪 매장 관리자</h1>
              <p className="admin-subtitle">
                관리 매장: {loggedInUser.managedStores?.slice(0, 3).join(', ')}
                {loggedInUser.managedStores?.length > 3 && ` 외 ${loggedInUser.managedStores.length - 3}개`}
              </p>
            </div>
            <div className="admin-header-info">
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
            {activeTab === 'dashboard'    && <StoreDashboard records={records} />}
            {activeTab === 'reservations' && <StoreReservations records={records} setRecords={setRecords} />}
          </div>

        </div>
      </BoxMain>
    </div>
  );
}

// =============================================
// 매장 대시보드
// =============================================
function StoreDashboard({ records }) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thisMonth = now.toISOString().slice(0, 7);
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString().slice(0, 7);

  const activeRecords = records.filter(r => !r.cancelled);
  const todayRecords  = activeRecords.filter(r => r.date === today);
  const thisRecords   = activeRecords.filter(r => r.date?.startsWith(thisMonth));
  const prevRecords   = activeRecords.filter(r => r.date?.startsWith(prevMonth));

  const todayRevenue = todayRecords.reduce((s, r) => s + (r.price || 0), 0);
  const thisRevenue  = thisRecords.reduce((s, r) => s + (r.price || 0), 0);
  const prevRevenue  = prevRecords.reduce((s, r) => s + (r.price || 0), 0);
  const diffRate = prevRevenue > 0
    ? Math.round(((thisRevenue - prevRevenue) / prevRevenue) * 100) : null;

  // 일별 매출 (최근 30일)
  const dailyRevenue = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyRevenue[key] = 0;
  }
  activeRecords.forEach(r => {
    if (dailyRevenue[r.date] !== undefined) {
      dailyRevenue[r.date] += r.price || 0;
    }
  });

  // 방별 매출
  const productRevenue = activeRecords.reduce((acc, r) => {
    const name = r.productName || '기타';
    if (!acc[name]) acc[name] = { revenue: 0, count: 0 };
    acc[name].revenue += r.price || 0;
    acc[name].count++;
    return acc;
  }, {});

  // 이번달 vs 전달 방별 비교
  const compareByProduct = () => {
    const all = [...new Set([
      ...thisRecords.map(r => r.productName),
      ...prevRecords.map(r => r.productName),
    ])];
    return all.map(name => {
      const curr = thisRecords.filter(r => r.productName === name).reduce((s, r) => s + (r.price || 0), 0);
      const prev = prevRecords.filter(r => r.productName === name).reduce((s, r) => s + (r.price || 0), 0);
      const pct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
      return { name, curr, prev, pct };
    }).sort((a, b) => b.curr - a.curr);
  };

  const maxDaily = Math.max(...Object.values(dailyRevenue), 1);

  return (
    <div className="tab-section">

      {/* 핵심 지표 */}
      <div className="admin-card">
        <h3>핵심 지표</h3>
        <div className="dashboard-stats">
          {[
            { icon: '☀️', label: '오늘 매출',   value: `${todayRevenue.toLocaleString()}원` },
            { icon: '📅', label: '이번달 매출', value: `${thisRevenue.toLocaleString()}원` },
            { icon: '📦', label: '이번달 예약', value: `${thisRecords.length}건` },
            { icon: '❌', label: '이번달 취소', value: `${records.filter(r => r.cancelled && r.date?.startsWith(thisMonth)).length}건` },
          ].map(s => (
            <div key={s.label} className="dashboard-stat-item">
              <span className="dashboard-stat-icon">{s.icon}</span>
              <span className="dashboard-stat-value">{s.value}</span>
              <span className="dashboard-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* 전달 비교 */}
        <div className="month-compare-banner">
          <span>전달 대비</span>
          <strong style={{
            color: diffRate === null ? 'var(--text-muted)'
              : diffRate >= 0 ? '#6fcf97' : '#ff6b7a'
          }}>
            {diffRate === null ? '데이터 없음'
              : diffRate >= 0 ? `▲ ${diffRate}%` : `▼ ${Math.abs(diffRate)}%`}
          </strong>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
            (전달: {prevRevenue.toLocaleString()}원)
          </span>
        </div>
      </div>

      {/* 일별 매출 바 차트 */}
      <div className="admin-card">
        <h3>일별 매출 (최근 30일)</h3>
        <div className="daily-chart">
          {Object.entries(dailyRevenue).map(([date, revenue]) => {
            const heightPct = Math.round((revenue / maxDaily) * 100);
            const isToday = date === today;
            return (
              <div key={date} className="daily-bar-wrap" title={`${date}\n${revenue.toLocaleString()}원`}>
                <div
                  className="daily-bar"
                  style={{
                    height: `${Math.max(heightPct, 2)}%`,
                    background: isToday ? 'var(--accent-gold)' : 'rgba(212,168,67,0.4)',
                  }}
                />
                {isToday && <span className="daily-bar-today">오늘</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 방별 매출 */}
      <div className="admin-card">
        <h3>방별 누적 매출</h3>
        {Object.keys(productRevenue).length === 0 ? (
          <p className="admin-empty">데이터가 없어요.</p>
        ) : (
          <div className="theme-stats-table">
            <div className="theme-stats-header" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
              <span>방탈출명</span>
              <span>예약 수</span>
              <span>매출</span>
            </div>
            {Object.entries(productRevenue)
              .sort((a, b) => b[1].revenue - a[1].revenue)
              .map(([name, data]) => (
                <div key={name} className="theme-stats-row" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                  <span>{name}</span>
                  <span>{data.count}건</span>
                  <span>{data.revenue.toLocaleString()}원</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 이번달 vs 전달 방별 비교 */}
      <div className="admin-card">
        <h3>이번달 vs 전달 방별 비교</h3>
        <div className="compare-table">
          <div className="compare-header">
            <span>방탈출명</span>
            <span>{prevMonth}</span>
            <span>{thisMonth}</span>
            <span>증감</span>
          </div>
          {compareByProduct().map(({ name, curr, prev, pct }) => (
            <div key={name} className="compare-row">
              <span>{name}</span>
              <span>{prev.toLocaleString()}원</span>
              <span>{curr.toLocaleString()}원</span>
              <span className={`diff-badge ${pct === null ? 'same' : pct >= 0 ? 'up' : 'down'}`}>
                {pct === null ? '신규' : pct >= 0 ? `▲ ${pct}%` : `▼ ${Math.abs(pct)}%`}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// =============================================
// 예약 관리
// =============================================
function StoreReservations({ records, setRecords }) {
  const [filter, setFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [timeInputId, setTimeInputId] = useState(null);
  const [escapeMinutes, setEscapeMinutes] = useState('');
  const timerRefs = useRef({});

  // 30분 자동 성공
  useEffect(() => {
    const now = Date.now();
    records.forEach(record => {
      if (record.success === null && !record.cancelled && !timerRefs.current[record.id]) {
        const createdAt = new Date(record.createdAt).getTime();
        const remaining = Math.max(0, 30 * 60 * 1000 - (now - createdAt));
        timerRefs.current[record.id] = setTimeout(async () => {
          await handleResultUpdate(record.id, true, null, true);
        }, remaining);
      }
    });
    return () => Object.values(timerRefs.current).forEach(clearTimeout);
  }, [records]);

  const filteredRecords = records.filter(r => {
    const matchFilter =
      filter === 'all'       ? true :
      filter === 'pending'   ? r.success === null && !r.cancelled :
      filter === 'success'   ? r.success === true :
      filter === 'fail'      ? r.success === false :
      filter === 'cancelled' ? r.cancelled : true;
    const matchSearch = searchKeyword
      ? r.productName?.includes(searchKeyword) : true;
    return matchFilter && matchSearch;
  });

  const handleResultUpdate = async (recordId, success, minutes = null, auto = false) => {
    if (timerRefs.current[recordId]) {
      clearTimeout(timerRefs.current[recordId]);
      delete timerRefs.current[recordId];
    }
    const updateData = { success };
    if (auto) updateData.autoSuccess = true;
    if (minutes !== null) updateData.escapeMinutes = minutes;
    try {
      await updateReservationResult(recordId, updateData);
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...updateData } : r));
    } catch (error) {
      alert('업데이트 중 오류가 발생했어요.');
    }
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
            placeholder="방탈출명으로 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <p className="admin-count">총 {filteredRecords.length}건</p>

        {filteredRecords.length === 0 ? (
          <p className="admin-empty">해당하는 예약이 없어요.</p>
        ) : (
          <div className="reservations-list">
            {[...filteredRecords].map(record => (
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
                      {timeInputId === record.id ? (
                        <div className="escape-time-input">
                          <input
                            type="number"
                            className="admin-input"
                            placeholder="탈출 시간 (분)"
                            value={escapeMinutes}
                            onChange={(e) => setEscapeMinutes(e.target.value)}
                            min={1} max={60}
                            style={{ width: '120px' }}
                          />
                          <button
                            className="result-action-btn success"
                            onClick={() => {
                              handleResultUpdate(record.id, true, parseInt(escapeMinutes) || null);
                              setTimeInputId(null);
                              setEscapeMinutes('');
                            }}
                          >
                            ✅ 확인
                          </button>
                          <button
                            className="result-action-btn reset"
                            onClick={() => { setTimeInputId(null); setEscapeMinutes(''); }}
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            className={`result-action-btn success ${record.success === true ? 'active' : ''}`}
                            onClick={() => {
                              if (record.success === true) return;
                              setTimeInputId(record.id);
                              setEscapeMinutes('');
                            }}
                          >
                            🟢 성공
                          </button>
                          <button
                            className={`result-action-btn fail ${record.success === false ? 'active' : ''}`}
                            onClick={() => handleResultUpdate(record.id, false, null)}
                          >
                            🔴 실패
                          </button>
                          {record.success !== null && (
                            <button
                              className="result-action-btn reset"
                              onClick={() => handleResultUpdate(record.id, null, null)}
                            >
                              초기화
                            </button>
                          )}
                        </>
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
                  {record.escapeMinutes && (
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                      ⏱ {record.escapeMinutes}분 탈출
                    </span>
                  )}
                </div>

                {record.success === null && !record.cancelled && (
                  <AutoTimer
                    createdAt={record.createdAt}
                    onExpire={() => handleResultUpdate(record.id, true, null, true)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AutoTimer({ createdAt, onExpire }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const createdTime = new Date(createdAt).getTime();
      const rem = Math.max(0, 30 * 60 * 1000 - (Date.now() - createdTime));
      if (rem === 0) { onExpire(); return; }
      const mins = Math.floor(rem / 60000);
      const secs = Math.floor((rem % 60000) / 1000);
      setRemaining(`${mins}분 ${secs}초 후 자동 성공 처리`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt, onExpire]);

  return <div className="auto-timer">⏱ {remaining}</div>;
}

export default AdminPage;