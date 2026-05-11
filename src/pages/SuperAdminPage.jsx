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

    return { totalRevenue, thisRevenue, prevRevenue, thisFee, cancelCount, thisCount: thisRecords.length };
  };

  const totalPlatformFee = storesData.reduce((sum, store) => {
    const stats = getStoreStats(store);
    return sum + stats.thisFee;
  }, 0);

  const totalRevenue = storesData.reduce((sum, store) => {
    const stats = getStoreStats(store);
    return sum + stats.totalRevenue;
  }, 0);

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

          {/* 전체 요약 */}
          <div className="admin-card">
            <h3>📊 플랫폼 전체 요약</h3>
            <div className="dashboard-stats">
              {[
                { icon: '🏪', label: '계약 매장 수', value: `${storesData.length}개` },
                { icon: '💰', label: '전체 누적 매출', value: `${totalRevenue.toLocaleString()}원` },
                { icon: '📅', label: '이번달 예약 수', value: `${allRecords.filter(r => r.date?.startsWith(thisMonth) && !r.cancelled).length}건` },
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
            <div className="stores-table">
              <div className="stores-table-header">
                <span>사장명</span>
                <span>매장명</span>
                <span>수수료율</span>
                <span>누적 매출</span>
                <span>이번달 매출</span>
                <span>이번달 수수료</span>
                <span>취소 건수</span>
                <span>상세보기</span>
              </div>
              {storesData.map(store => {
                const stats = getStoreStats(store);
                return (
                  <div key={store.id} className="stores-table-row">
                    <span>{store.ownerName}</span>
                    <span>{store.storeName}</span>
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

          {/* 이번달 수수료 합계 */}
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
                      <div className="fee-total">= {stats.thisFee.toLocaleString()}원</div>
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

function StoreDetailModal({ store, records, onClose }) {
  const storeRecords = records.filter(r => store.themes.includes(r.productName));
  const activeRecords = storeRecords.filter(r => !r.cancelled);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const themeStats = store.themes.map(theme => {
    const recs = activeRecords.filter(r => r.productName === theme);
    return {
      name: theme,
      count: recs.length,
      revenue: recs.reduce((sum, r) => sum + (r.price || 0), 0),
      success: recs.filter(r => r.success === true).length,
      fail: recs.filter(r => r.success === false).length,
      cancel: storeRecords.filter(r => r.productName === theme && r.cancelled).length,
    };
  });

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal store-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onClose}>×</button>
        <h3>{store.storeName} 상세 현황</h3>

        <div className="store-detail-info">
          <div className="store-info-row"><span>사장명</span><strong>{store.ownerName}</strong></div>
          <div className="store-info-row"><span>연락처</span><strong>{store.contact}</strong></div>
          <div className="store-info-row"><span>이메일</span><strong>{store.email}</strong></div>
          <div className="store-info-row"><span>계약일</span><strong>{store.contractDate}</strong></div>
          <div className="store-info-row"><span>수수료율</span><strong className="fee-rate">{store.discountRate}%</strong></div>
        </div>

        <h4>방탈출별 현황</h4>
        <div className="theme-stats-table">
          <div className="theme-stats-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
            <span>방탈출명</span>
            <span>예약</span>
            <span>매출</span>
            <span>성공</span>
            <span>실패</span>
            <span>취소</span>
          </div>
          {themeStats.map(t => (
            <div key={t.name} className="theme-stats-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
              <span>{t.name}</span>
              <span>{t.count}건</span>
              <span>{t.revenue.toLocaleString()}원</span>
              <span style={{ color: '#6fcf97' }}>{t.success}</span>
              <span style={{ color: '#ff6b7a' }}>{t.fail}</span>
              <span style={{ color: '#aaa' }}>{t.cancel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SuperAdminPage;