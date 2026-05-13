import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import storesData from '../data/storesData';
import '../styles/Global.css';
import '../styles/AdminPage.css';
import '../styles/SuperAdminPage.css';

function SuperAdminPage() {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [filterOwner, setFilterOwner] = useState('전체');
  const [filterBranch, setFilterBranch] = useState('전체');

  useEffect(() => {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) { alert('로그인이 필요해요!'); navigate('/login'); return; }
    const parsed = JSON.parse(user);
    if (parsed.adminRole !== 'super') {
      alert('총괄 관리자만 접근할 수 있어요!');
      navigate('/');
      return;
    }
    setLoggedInUser(parsed);
  }, [navigate]);

  if (!loggedInUser) return null;

  const allRecords = JSON.parse(localStorage.getItem('reservationRecords') || '[]');
  const thisMonth = new Date().toISOString().slice(0, 7);
  const prevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toISOString().slice(0, 7);

  // 매장별 통계 계산
  const getStoreStats = (store) => {
    const records = allRecords.filter(r =>
      store.themes.includes(r.productName) && !r.cancelled
    );
    const thisRecords = records.filter(r => r.date?.startsWith(thisMonth));
    const prevRecords = records.filter(r => r.date?.startsWith(prevMonth));

    const totalRevenue = records.reduce((sum, r) => sum + (r.price || 0), 0);
    const thisRevenue = thisRecords.reduce((sum, r) => sum + (r.price || 0), 0);
    const prevRevenue = prevRecords.reduce((sum, r) => sum + (r.price || 0), 0);
    const thisFee = Math.floor(thisRevenue * store.discountRate / 100);
    const cancelCount = allRecords.filter(r =>
      store.themes.includes(r.productName) && r.cancelled
    ).length;

    return { totalRevenue, thisRevenue, prevRevenue, thisFee, cancelCount };
  };

  const totalPlatformFee = storesData.reduce((sum, store) => {
    return sum + getStoreStats(store).thisFee;
  }, 0);

  const totalRevenue = storesData.reduce((sum, store) => {
    return sum + getStoreStats(store).totalRevenue;
  }, 0);

  // 필터링
  const allBranches = storesData.flatMap(s =>
    s.branches.map(b => ({ branch: b, owner: s.ownerName }))
  );
  const filteredStores = storesData.filter(store => {
    const ownerMatch = filterOwner === '전체' || store.ownerName === filterOwner;
    const branchMatch = filterBranch === '전체' || store.branches.includes(filterBranch);
    return ownerMatch && branchMatch;
  });

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

          {/* 플랫폼 전체 요약 */}
          <div className="admin-card">
            <h3>📊 플랫폼 전체 요약</h3>
            <div className="dashboard-stats">
              {[
                { icon: '🏪', label: '계약 매장 수', value: `${storesData.length}개` },
                { icon: '💰', label: '전체 누적 매출', value: `${totalRevenue.toLocaleString()}원` },
                {
                  icon: '📅',
                  label: '이번달 예약 수',
                  value: `${allRecords.filter(r => r.date?.startsWith(thisMonth) && !r.cancelled).length}건`
                },
                { icon: '💎', label: '이번달 플랫폼 수익', value: `${totalPlatformFee.toLocaleString()}원` },
              ].map(stat => (
                <div key={stat.label} className="dashboard-stat-item">
                  <span className="dashboard-stat-icon">{stat.icon}</span>
                  <span className="dashboard-stat-value">{stat.value}</span>
                  <span className="dashboard-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 매장별 현황 */}
          <div className="admin-card">
            <h3>🏪 매장별 현황</h3>

            {/* 필터 */}
            <div className="store-filter-row">
              <div className="store-filter-group">
                <label>사장명</label>
                <select
                  className="admin-input admin-select"
                  style={{ width: 'auto' }}
                  value={filterOwner}
                  onChange={(e) => {
                    setFilterOwner(e.target.value);
                    setFilterBranch('전체');
                  }}
                >
                  <option value="전체">전체</option>
                  {storesData.map(s => (
                    <option key={s.ownerName} value={s.ownerName}>{s.ownerName}</option>
                  ))}
                </select>
              </div>

              <div className="store-filter-group">
                <label>지점명</label>
                <select
                  className="admin-input admin-select"
                  style={{ width: 'auto' }}
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                >
                  <option value="전체">전체</option>
                  {(filterOwner === '전체'
                    ? allBranches
                    : allBranches.filter(b => b.owner === filterOwner)
                  ).map(b => (
                    <option key={b.branch} value={b.branch}>{b.branch}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="stores-table">
              <div className="stores-table-header">
                <span>사장명</span>
                <span>지점명</span>
                <span>수수료율</span>
                <span>누적 매출</span>
                <span>이번달 매출</span>
                <span>이번달 수수료</span>
                <span>취소 건수</span>
                <span>상세보기</span>
              </div>
              {filteredStores.map(store => {
                const stats = getStoreStats(store);
                return (
                  <div key={store.id} className="stores-table-row">
                    <span>{store.ownerName}</span>
                    <span style={{ fontSize: '0.85em' }}>
                      {store.branches.join(', ')}
                    </span>
                    <span className="fee-rate">{store.discountRate}%</span>
                    <span>{stats.totalRevenue.toLocaleString()}원</span>
                    <span>{stats.thisRevenue.toLocaleString()}원</span>
                    <span className="fee-amount">{stats.thisFee.toLocaleString()}원</span>
                    <span>{stats.cancelCount}건</span>
                    <button
                      className="detail-btn"
                      onClick={() => setSelectedStore(store)}
                    >
                      상세 →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 이번달 수수료 정산 */}
          <div className="admin-card fee-summary-card">
            <h3>💳 이번달 수수료 정산 요약 ({thisMonth})</h3>
            <div className="fee-summary-list">
              {storesData.map(store => {
                const stats = getStoreStats(store);
                return (
                  <div key={store.id} className="fee-summary-row">
                    <div className="fee-summary-left">
                      <strong>{store.ownerName}</strong>
                      <span>{store.storeName}</span>
                      <span className="fee-contact">{store.contact}</span>
                    </div>
                    <div className="fee-summary-right">
                      <div className="fee-calc">
                        <span>이번달 매출 {stats.thisRevenue.toLocaleString()}원</span>
                        <span>× {store.discountRate}%</span>
                      </div>
                      <div className="fee-total">
                        = {stats.thisFee.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="fee-grand-total">
                <span>이번달 총 플랫폼 수익</span>
                <strong>{totalPlatformFee.toLocaleString()}원</strong>
              </div>
            </div>
          </div>

        </div>
      </BoxMain>

      {/* 매장 상세 모달 */}
      {selectedStore && (
        <StoreDetailModal
          store={selectedStore}
          records={allRecords}
          onClose={() => setSelectedStore(null)}
        />
      )}
    </div>
  );
}

// =============================================
// 매장 상세 모달
// =============================================
function StoreDetailModal({ store, records, onClose }) {
  const storeRecords = records.filter(r =>
    store.themes.includes(r.productName)
  );

  // 지점별 그룹화
  const branchGrouped = store.branches.reduce((acc, branch) => {
    acc[branch] = {
      themes: {},
      totalRevenue: 0,
      totalCount: 0,
      cancelCount: 0,
    };
    return acc;
  }, {});

  storeRecords.forEach(r => {
    const branch = r.branch || store.branches[0];
    if (!branchGrouped[branch]) return;

    if (r.cancelled) {
      branchGrouped[branch].cancelCount++;
      if (!branchGrouped[branch].themes[r.productName]) {
        branchGrouped[branch].themes[r.productName] = { count: 0, revenue: 0, cancel: 0 };
      }
      branchGrouped[branch].themes[r.productName].cancel++;
    } else {
      branchGrouped[branch].totalCount++;
      branchGrouped[branch].totalRevenue += r.price || 0;
      if (!branchGrouped[branch].themes[r.productName]) {
        branchGrouped[branch].themes[r.productName] = { count: 0, revenue: 0, cancel: 0 };
      }
      branchGrouped[branch].themes[r.productName].count++;
      branchGrouped[branch].themes[r.productName].revenue += r.price || 0;
    }
  });

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal store-detail-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ overflowY: 'auto', maxHeight: '85vh' }}
      >
        <button className="admin-modal-close" onClick={onClose}>×</button>
        <h3>{store.storeName} 상세 현황</h3>

        {/* 기본 정보 */}
        <div className="store-detail-info">
          <div className="store-info-row">
            <span>사장명</span>
            <strong>{store.ownerName}</strong>
          </div>
          <div className="store-info-row">
            <span>연락처</span>
            <strong>{store.contact}</strong>
          </div>
          <div className="store-info-row">
            <span>이메일</span>
            <strong>{store.email}</strong>
          </div>
          <div className="store-info-row">
            <span>계약일</span>
            <strong>{store.contractDate}</strong>
          </div>
          <div className="store-info-row">
            <span>수수료율</span>
            <strong className="fee-rate">{store.discountRate}%</strong>
          </div>
          <div className="store-info-row">
            <span>지점 수</span>
            <strong>{store.branches.length}개점</strong>
          </div>
        </div>

        {/* 지점별 분류 */}
        {store.branches.map(branch => {
          const data = branchGrouped[branch];
          if (!data) return null;
          const themeList = Object.entries(data.themes);

          return (
            <div key={branch} className="branch-section">
              <div className="branch-header">
                <span className="branch-name">🏪 {branch}</span>
                <span>예약 {data.totalCount}건</span>
                <span>{data.totalRevenue.toLocaleString()}원</span>
                <span>취소 {data.cancelCount}건</span>
              </div>

              {themeList.length === 0 ? (
                <p className="admin-empty" style={{ padding: '12px 16px' }}>
                  예약 데이터가 없어요.
                </p>
              ) : (
                <div className="theme-stats-table">
                  <div
                    className="theme-stats-header"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}
                  >
                    <span>방탈출명</span>
                    <span>예약</span>
                    <span>매출</span>
                    <span>취소</span>
                  </div>
                  {themeList
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([name, t]) => (
                      <div
                        key={name}
                        className="theme-stats-row"
                        style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}
                      >
                        <span>{name}</span>
                        <span>{t.count}건</span>
                        <span>{t.revenue.toLocaleString()}원</span>
                        <span style={{ color: '#ff6b7a' }}>{t.cancel}건</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}

export default SuperAdminPage;