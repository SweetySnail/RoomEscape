// src/pages/AdminPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import { getAllReservations, updateReservationResult } from '../services/reservationService';
import { getStore, updateTheme } from '../services/storeService';
import { updateProduct } from '../services/productService';
import { getEventsByStore, createEvent, updateEvent, deleteEvent } from '../services/eventService';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/Global.css';
import '../styles/AdminPage.css';

function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [store, setStore] = useState(null);
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
    const load = async () => {
      try {
        const [allReservations, storeData] = await Promise.all([
          getAllReservations(),
          loggedInUser.storeId ? getStore(loggedInUser.storeId) : null,
        ]);
        const myThemeNames = storeData
          ? storeData.branches?.flatMap(b => b.themes?.map(t => t.name) || []) || []
          : loggedInUser.managedStores || [];
        setRecords(allReservations.filter(r => myThemeNames.includes(r.productName)));
        setStore(storeData);
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loggedInUser]);

  // BoxRight에서 탭 전환 이벤트 수신
  useEffect(() => {
    const handler = (e) => {
      setActiveTab(e.detail);
      window.__adminActiveTab = e.detail;
    };
    window.addEventListener('adminTabChange', handler);
    return () => window.removeEventListener('adminTabChange', handler);
  }, []);

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

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="admin-content">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">🏪 매장 관리자</h1>
              <p className="admin-subtitle">
                {store
                  ? store.branches?.map(b => b.branchName).join(', ')
                  : loggedInUser.managedStores?.slice(0, 3).join(', ')}
              </p>
            </div>
            <div className="admin-header-info">
              <span>{loggedInUser.nickname}</span>
              <span>{new Date().toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}</span>
            </div>
          </div>

          <div className="admin-tab-content">
            {activeTab === 'dashboard' && (
              <StoreDashboard records={records} store={store} loggedInUser={loggedInUser} />
            )}
            {activeTab === 'reservations' && (
              <StoreReservations records={records} setRecords={setRecords} />
            )}
            {activeTab === 'schedule' && (
              <ScheduleTab store={store} setStore={setStore} loggedInUser={loggedInUser} />
            )}
            {activeTab === 'events' && (
              <StoreEventsTab storeId={loggedInUser.storeId} />
            )}
          </div>
        </div>
      </BoxMain>
    </div>
  );
}

// =============================================
// 운영 시간 설정 탭
// =============================================
function ScheduleTab({ store, setStore }) {
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const branches = store?.branches || [];

  const [localBranches, setLocalBranches] = useState(
    branches.map(b => ({
      ...b,
      themes: b.themes?.map(t => ({
        ...t,
        scheduleType: t.scheduleType || 'auto',
        startTime: t.startTime || '09:00',
        endTime: t.endTime || '22:00',
        intervalMinutes: t.intervalMinutes || 60,
        blockedSlots: t.blockedSlots || [], // 예외 시간 [{start, end}]
        availableTimes: t.availableTimes || [],
      })) || [],
    }))
  );

  // 시작+종료+간격으로 시간 슬롯 자동 생성
  const generateSlots = (startTime, endTime, intervalMinutes, blockedSlots = []) => {
    const slots = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    for (let t = startTotal; t < endTotal; t += intervalMinutes) {
      const h = Math.floor(t / 60).toString().padStart(2, '0');
      const m = (t % 60).toString().padStart(2, '0');
      const timeStr = `${h}:${m}`;

      // 예외 시간 체크
      const isBlocked = blockedSlots.some(slot => {
        const [bsh, bsm] = slot.start.split(':').map(Number);
        const [beh, bem] = slot.end.split(':').map(Number);
        const bStart = bsh * 60 + bsm;
        const bEnd = beh * 60 + bem;
        return t >= bStart && t < bEnd;
      });

      if (!isBlocked) slots.push(timeStr);
    }
    return slots;
  };

  const updateThemeSchedule = (bi, ti, field, value) => {
    const updated = localBranches.map((b, bIdx) => {
      if (bIdx !== bi) return b;
      return {
        ...b,
        themes: b.themes.map((t, tIdx) => {
          if (tIdx !== ti) return t;
          const newTheme = { ...t, [field]: value };
          // 자동으로 availableTimes 재계산
          newTheme.availableTimes = generateSlots(
            newTheme.startTime,
            newTheme.endTime,
            Number(newTheme.intervalMinutes),
            newTheme.blockedSlots,
          );
          return newTheme;
        }),
      };
    });
    setLocalBranches(updated);
  };

  const addBlockedSlot = (bi, ti) => {
    const updated = localBranches.map((b, bIdx) => {
      if (bIdx !== bi) return b;
      return {
        ...b,
        themes: b.themes.map((t, tIdx) => {
          if (tIdx !== ti) return t;
          const newBlocked = [...(t.blockedSlots || []), { start: '12:00', end: '13:00' }];
          const newTheme = { ...t, blockedSlots: newBlocked };
          newTheme.availableTimes = generateSlots(
            newTheme.startTime, newTheme.endTime,
            Number(newTheme.intervalMinutes), newBlocked
          );
          return newTheme;
        }),
      };
    });
    setLocalBranches(updated);
  };

  const updateBlockedSlot = (bi, ti, si, field, value) => {
    const updated = localBranches.map((b, bIdx) => {
      if (bIdx !== bi) return b;
      return {
        ...b,
        themes: b.themes.map((t, tIdx) => {
          if (tIdx !== ti) return t;
          const newBlocked = t.blockedSlots.map((slot, sIdx) =>
            sIdx === si ? { ...slot, [field]: value } : slot
          );
          const newTheme = { ...t, blockedSlots: newBlocked };
          newTheme.availableTimes = generateSlots(
            newTheme.startTime, newTheme.endTime,
            Number(newTheme.intervalMinutes), newBlocked
          );
          return newTheme;
        }),
      };
    });
    setLocalBranches(updated);
  };

  const removeBlockedSlot = (bi, ti, si) => {
    const updated = localBranches.map((b, bIdx) => {
      if (bIdx !== bi) return b;
      return {
        ...b,
        themes: b.themes.map((t, tIdx) => {
          if (tIdx !== ti) return t;
          const newBlocked = t.blockedSlots.filter((_, sIdx) => sIdx !== si);
          const newTheme = { ...t, blockedSlots: newBlocked };
          newTheme.availableTimes = generateSlots(
            newTheme.startTime, newTheme.endTime,
            Number(newTheme.intervalMinutes), newBlocked
          );
          return newTheme;
        }),
      };
    });
    setLocalBranches(updated);
  };

  const handleSave = async () => {
    if (!store?.id) return;
    setSaving(true);
    setSavedMsg('');
    try {
      for (const branch of localBranches) {
        for (const theme of branch.themes) {
          if (branch.id && theme.id) {
            await updateTheme(store.id, branch.id, theme.id, {
              availableTimes: theme.availableTimes,
              startTime: theme.startTime,
              endTime: theme.endTime,
              intervalMinutes: Number(theme.intervalMinutes),
              blockedSlots: theme.blockedSlots || [],
            });
          }

          const q = query(
            collection(db, 'products'),
            where('storeId', '==', store.id),
            where('title', '==', theme.name)
          );
          const snap = await getDocs(q);
          for (const docSnap of snap.docs) {
            await updateProduct(docSnap.id, {
              availableTimes: theme.availableTimes,
              startTime: theme.startTime,
              endTime: theme.endTime,
              intervalMinutes: Number(theme.intervalMinutes),
              blockedSlots: theme.blockedSlots || [],
            });
          }
        }
      }

      setStore(prev => ({ ...prev, branches: localBranches }));
      setSavedMsg('✅ 저장되었어요!');
    } catch (error) {
      setSavedMsg('❌ 저장 실패: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (branches.length === 0) return (
    <div className="tab-section">
      <div className="admin-card">
        <p className="admin-empty">등록된 지점 정보가 없어요. 총괄 관리자에게 문의해주세요.</p>
      </div>
    </div>
  );

  return (
    <div className="tab-section">
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>🕐 테마별 운영 시간 설정</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {savedMsg && (
              <span style={{ color: savedMsg.startsWith('✅') ? '#6fcf97' : '#ff6b7a', fontSize: '0.9em' }}>
                {savedMsg}
              </span>
            )}
            <button className="mypage-btn primary" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '💾 저장'}
            </button>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9em', marginBottom: '16px' }}>
          시작/종료 시간과 진행 간격을 설정하면 예약 가능한 시간이 자동으로 생성돼요.
        </p>

        {localBranches.map((branch, bi) => (
          <div key={bi} style={{ marginBottom: '28px' }}>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: '12px' }}>
              🏪 {branch.branchName}
            </h4>

            {branch.themes?.map((theme, ti) => {
              const preview = theme.availableTimes || [];
              return (
                <div key={ti} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                }}>
                  <strong style={{ display: 'block', marginBottom: '12px' }}>
                    🔐 {theme.name}
                  </strong>

                  {/* 시작/종료/간격 설정 */}
                  <div className="schedule-time-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        시작 시간
                      </label>
                      <input
                        type="time"
                        className="admin-input"
                        value={theme.startTime}
                        onChange={(e) => updateThemeSchedule(bi, ti, 'startTime', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        종료 시간
                      </label>
                      <input
                        type="time"
                        className="admin-input"
                        value={theme.endTime}
                        onChange={(e) => updateThemeSchedule(bi, ti, 'endTime', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        진행 간격 (분)
                      </label>
                      <input
                        type="number"
                        className="admin-input"
                        style={{ width: '80px' }}
                        value={theme.intervalMinutes}
                        min={30} max={180} step={5}
                        onChange={(e) => updateThemeSchedule(bi, ti, 'intervalMinutes', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 예외 시간 설정 */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                        🚫 예약 불가 시간대 (예외 설정)
                      </label>
                      <button className="mypage-btn small" onClick={() => addBlockedSlot(bi, ti)}>
                        + 예외 추가
                      </button>
                    </div>
                    {(theme.blockedSlots || []).map((slot, si) => (
                      <div key={si} className="blocked-slot-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'nowrap' }}>
                        <input
                          type="time"
                          className="admin-input"
                          style={{ width: '150px', minWidth: '150px', flexShrink: 0 }}
                          value={slot.start}
                          onChange={(e) => updateBlockedSlot(bi, ti, si, 'start', e.target.value)}
                        />
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>~</span>
                        <input
                          type="time"
                          className="admin-input"
                          style={{ width: '150px', minWidth: '150px', flexShrink: 0 }}
                          value={slot.end}
                          onChange={(e) => updateBlockedSlot(bi, ti, si, 'end', e.target.value)}
                        />
                        <span className="blocked-slot-label" style={{ flexShrink: 0 }}>예약불가</span>
                        <button
                          className="mypage-btn small danger"
                          style={{ flexShrink: 0 }}
                          onClick={() => removeBlockedSlot(bi, ti, si)}
                        >✕</button>
                      </div>
                    ))}
                  </div>

                  {/* 생성된 시간 미리보기 */}
                  <div>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      📋 생성된 예약 시간 ({preview.length}개)
                    </label>
                    {preview.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {preview.map(time => (
                          <span key={time} style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'rgba(212,168,67,0.15)',
                            border: '1px solid var(--accent-gold)',
                            color: 'var(--accent-gold)',
                            fontSize: '0.85em',
                          }}>
                            {time}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
                        설정값을 입력하면 시간이 자동 생성돼요.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================
// PDF 생성 함수
// =============================================
function generatePDF({ store, loggedInUser, records, targetMonth }) {
  const doc = new jsPDF();
  const month = targetMonth || new Date().toISOString().slice(0, 7);
  const monthRecords = records.filter(r => !r.cancelled && r.date?.startsWith(month));
  const prevMonth = new Date(month + '-01');
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthStr = prevMonth.toISOString().slice(0, 7);
  const prevRecords = records.filter(r => !r.cancelled && r.date?.startsWith(prevMonthStr));

  const thisRevenue = monthRecords.reduce((s, r) => s + (r.price || 0), 0);
  const prevRevenue = prevRecords.reduce((s, r) => s + (r.price || 0), 0);
  const discountRate = store?.discountRate || 0;
  const thisFee = Math.floor(thisRevenue * discountRate / 100);

  const themeStats = {};
  monthRecords.forEach(r => {
    if (!themeStats[r.productName]) themeStats[r.productName] = { count: 0, revenue: 0 };
    themeStats[r.productName].count++;
    themeStats[r.productName].revenue += r.price || 0;
  });

  doc.setFontSize(18);
  doc.text('EscapeHub - Monthly Report', 14, 20);
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text(`${month} 매출 리포트`, 14, 28);
  doc.text(`담당자: ${loggedInUser.nickname}`, 14, 35);
  doc.text(`출력일: ${new Date().toLocaleDateString('ko-KR')}`, 14, 42);
  if (store) doc.text(`매장: ${store.ownerName}`, 14, 49);
  doc.setTextColor(0);

  doc.setFontSize(13);
  doc.text('매출 요약', 14, 62);
  autoTable(doc, {
    startY: 66,
    head: [['항목', '금액']],
    body: [
      ['이번달 총 매출', `${thisRevenue.toLocaleString()}원`],
      ['전달 총 매출', `${prevRevenue.toLocaleString()}원`],
      ['전달 대비', prevRevenue > 0
        ? `${thisRevenue >= prevRevenue ? '▲' : '▼'} ${Math.abs(Math.round((thisRevenue - prevRevenue) / prevRevenue * 100))}%`
        : '-'],
      ['이번달 예약 수', `${monthRecords.length}건`],
      [`플랫폼 수수료 (${discountRate}%)`, `${thisFee.toLocaleString()}원`],
      ['정산 예정액', `${(thisRevenue - thisFee).toLocaleString()}원`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [212, 168, 67] },
  });

  const afterSummary = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.text('테마별 매출', 14, afterSummary);
  autoTable(doc, {
    startY: afterSummary + 4,
    head: [['테마명', '예약 수', '매출']],
    body: Object.entries(themeStats)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([name, s]) => [name, `${s.count}건`, `${s.revenue.toLocaleString()}원`]),
    theme: 'striped',
    headStyles: { fillColor: [212, 168, 67] },
  });

  const afterTheme = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.text('예약 상세 목록', 14, afterTheme);
  autoTable(doc, {
    startY: afterTheme + 4,
    head: [['날짜', '시간', '테마명', '인원', '가격', '결과']],
    body: [...monthRecords]
      .sort((a, b) => a.date?.localeCompare(b.date))
      .map(r => [
        r.date, r.time, r.productName, `${r.people}명`,
        `${(r.price || 0).toLocaleString()}원`,
        r.success === true ? '성공' : r.success === false ? '실패' : '미완료',
      ]),
    theme: 'striped',
    headStyles: { fillColor: [80, 80, 80] },
    styles: { fontSize: 9 },
  });

  doc.save(`EscapeHub_${month}_리포트.pdf`);
}

// =============================================
// 대시보드
// =============================================
function StoreDashboard({ records, store, loggedInUser }) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  // 전달: 로컬 기준 안전하게 계산
  const prevYear  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevMonth = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(thisMonth);

  const activeRecords = records.filter(r => !r.cancelled);
  const todayRecords  = activeRecords.filter(r => r.date === today);
  const thisRecords   = activeRecords.filter(r => r.date?.startsWith(thisMonth));
  const prevRecords   = activeRecords.filter(r => r.date?.startsWith(prevMonth));

  const todayRevenue = todayRecords.reduce((s, r) => s + (r.price || 0), 0);
  const thisRevenue  = thisRecords.reduce((s, r) => s + (r.price || 0), 0);
  const prevRevenue  = prevRecords.reduce((s, r) => s + (r.price || 0), 0);
  const diffRate = prevRevenue > 0
    ? Math.round(((thisRevenue - prevRevenue) / prevRevenue) * 100) : null;

  const dailyRevenue = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyRevenue[d.toISOString().slice(0, 10)] = 0;
  }
  activeRecords.forEach(r => {
    if (dailyRevenue[r.date] !== undefined) dailyRevenue[r.date] += r.price || 0;
  });
  const maxDaily = Math.max(...Object.values(dailyRevenue), 1);

  const productRevenue = activeRecords.reduce((acc, r) => {
    const name = r.productName || '기타';
    if (!acc[name]) acc[name] = { revenue: 0, count: 0 };
    acc[name].revenue += r.price || 0;
    acc[name].count++;
    return acc;
  }, {});

  const allProductNames = [...new Set([
    ...thisRecords.map(r => r.productName),
    ...prevRecords.map(r => r.productName),
  ])];
  const compareData = allProductNames.map(name => {
    const curr = thisRecords.filter(r => r.productName === name).reduce((s, r) => s + (r.price || 0), 0);
    const prev = prevRecords.filter(r => r.productName === name).reduce((s, r) => s + (r.price || 0), 0);
    const pct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
    return { name, curr, prev, pct };
  }).sort((a, b) => b.curr - a.curr);

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  // 월 표시 레이블 (예: "2026-04" → "4월")
  const monthLabel = (ym) => {
    const m = parseInt(ym.split('-')[1], 10);
    return `${m}월`;
  };

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
        <div className="month-compare-banner">
          <span>전달 대비</span>
          <strong style={{ color: diffRate === null ? 'var(--text-muted)' : diffRate >= 0 ? '#6fcf97' : '#ff6b7a' }}>
            {diffRate === null ? '데이터 없음' : diffRate >= 0 ? `▲ ${diffRate}%` : `▼ ${Math.abs(diffRate)}%`}
          </strong>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
            (전달: {prevRevenue.toLocaleString()}원)
          </span>
        </div>
      </div>

      {/* 일별 매출 차트 — 금액 툴팁 + 호버 시 레이블 */}
      <div className="admin-card">
        <h3>일별 매출 (최근 30일)</h3>
        <div className="daily-chart">
          {Object.entries(dailyRevenue).map(([date, revenue]) => {
            const heightPct = Math.round((revenue / maxDaily) * 100);
            const isToday = date === today;
            const label = revenue >= 10000
              ? `${Math.round(revenue / 10000)}만`
              : revenue > 0 ? `${revenue.toLocaleString()}` : '';
            return (
              <div key={date} className="daily-bar-wrap" title={`${date}\n${revenue.toLocaleString()}원`}>
                <div
                  className="daily-bar"
                  style={{
                    height: `${Math.max(heightPct, 2)}%`,
                    background: isToday ? 'var(--accent-gold)' : 'rgba(212,168,67,0.4)',
                  }}
                />
                {revenue > 0 && (
                  <span className="daily-bar-amount">{label}</span>
                )}
                {isToday && <span className="daily-bar-today">오늘</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 테마별 누적 매출 */}
      <div className="admin-card">
        <h3>테마별 누적 매출</h3>
        {Object.keys(productRevenue).length === 0 ? (
          <p className="admin-empty">데이터가 없어요.</p>
        ) : (
          <div className="theme-stats-table">
            <div className="theme-stats-header">
              <span>테마명</span><span>예약 수</span><span>매출</span>
            </div>
            {Object.entries(productRevenue)
              .sort((a, b) => b[1].revenue - a[1].revenue)
              .map(([name, data]) => (
                <div key={name} className="theme-stats-row">
                  <span>{name}</span>
                  <span>{data.count}건</span>
                  <span>{data.revenue.toLocaleString()}원</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 전달 vs 이번달 테마별 비교 */}
      <div className="admin-card">
        <h3>{monthLabel(prevMonth)} vs {monthLabel(thisMonth)} 테마별 비교</h3>
        <div className="compare-table">
          <div className="compare-header">
            <span>테마명</span>
            <span>{monthLabel(prevMonth)} (전달)</span>
            <span>{monthLabel(thisMonth)} (이번달)</span>
            <span>증감</span>
          </div>
          {compareData.map(({ name, curr, prev, pct }) => (
            <div key={name} className="compare-row">
              <span className="compare-name">{name}</span>
              <span className="compare-cell">{prev.toLocaleString()}원</span>
              <span className="compare-cell">{curr.toLocaleString()}원</span>
              <span className={`diff-badge ${pct === null ? 'same' : pct >= 0 ? 'up' : 'down'}`}>
                {pct === null ? '신규' : pct >= 0 ? `▲ ${pct}%` : `▼ ${Math.abs(pct)}%`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PDF 추출 — 대시보드 가장 하단 */}
      <div className="admin-card">
        <h3>📄 월별 리포트 PDF 추출</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
          <select
            className="admin-input admin-select"
            style={{ width: 'auto' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button
            className="mypage-btn primary"
            onClick={() => generatePDF({ store, loggedInUser, records, targetMonth: selectedMonth })}
          >
            PDF 다운로드
          </button>
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

  const handleResultUpdate = useCallback(async (recordId, success, minutes = null, auto = false) => {
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
  }, [setRecords]);

  useEffect(() => {
    const refs = timerRefs.current;
    const now = Date.now();
    records.forEach(record => {
      if (record.success === null && !record.cancelled && !refs[record.id]) {
        const createdAt = new Date(record.createdAt).getTime();
        const remaining = Math.max(0, 30 * 60 * 1000 - (now - createdAt));
        refs[record.id] = setTimeout(async () => {
          await handleResultUpdate(record.id, true, null, true);
        }, remaining);
      }
    });
    return () => Object.values(refs).forEach(clearTimeout);
  }, [records, handleResultUpdate]);

  const filteredRecords = records.filter(r => {
    const matchFilter =
      filter === 'all'       ? true :
      filter === 'pending'   ? r.success === null && !r.cancelled :
      filter === 'success'   ? r.success === true :
      filter === 'fail'      ? r.success === false :
      filter === 'cancelled' ? r.cancelled : true;
    const matchSearch = searchKeyword ? r.productName?.includes(searchKeyword) : true;
    return matchFilter && matchSearch;
  });

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
            {[...filteredRecords].map(record => (
              <div key={record.id} className={`reservation-item ${record.cancelled ? 'cancelled' : ''}`}>
                <div className="reservation-item-top">
                  <div className="reservation-item-info">
                    <strong>{record.productName}</strong>
                    <div className="reservation-badges">
                      {record.success === true && !record.autoSuccess && <span className="admin-badge success">🟢 성공</span>}
                      {record.success === true && record.autoSuccess  && <span className="admin-badge auto">🟢 자동성공</span>}
                      {record.success === false                        && <span className="admin-badge fail">🔴 실패</span>}
                      {record.success === null && !record.cancelled    && <span className="admin-badge pending">⏳ 미완료</span>}
                      {record.cancelled                                && <span className="admin-badge cancelled">❌ 취소</span>}
                      {record.reviewed                                 && <span className="admin-badge reviewed">✍️ 리뷰완료</span>}
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
                          <button className="result-action-btn success" onClick={() => {
                            handleResultUpdate(record.id, true, parseInt(escapeMinutes) || null);
                            setTimeInputId(null); setEscapeMinutes('');
                          }}>✅ 확인</button>
                          <button className="result-action-btn reset" onClick={() => {
                            setTimeInputId(null); setEscapeMinutes('');
                          }}>취소</button>
                        </div>
                      ) : (
                        <>
                          <button
                            className={`result-action-btn success ${record.success === true ? 'active' : ''}`}
                            onClick={() => { if (record.success === true) return; setTimeInputId(record.id); setEscapeMinutes(''); }}
                          >🟢 성공</button>
                          <button
                            className={`result-action-btn fail ${record.success === false ? 'active' : ''}`}
                            onClick={() => handleResultUpdate(record.id, false, null)}
                          >🔴 실패</button>
                          {record.success !== null && (
                            <button className="result-action-btn reset"
                              onClick={() => handleResultUpdate(record.id, null, null)}>
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
      const rem = Math.max(0, 30 * 60 * 1000 - (Date.now() - new Date(createdAt).getTime()));
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

// =============================================
// 이벤트 관리 탭 (매장관리자용)
// =============================================
const STORE_EVENT_TYPES = [
  { value: 'banner',         label: '📢 배너/공지' },
  { value: 'coupon',         label: '🎟 할인쿠폰' },
  { value: 'theme_highlight',label: '✨ 기간한정 테마 노출' },
];

const STORE_EMPTY_FORM = {
  title: '', description: '', type: 'banner',
  imageUrl: '', badgeColor: '#d4a843',
  startDate: '', endDate: '',
  couponCode: '', discountRate: 0,
};

function StoreEventsTab({ storeId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(STORE_EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await getEventsByStore(storeId);
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const isActive = (e) => e.startDate <= today && e.endDate >= today;

  const handleEdit = (event) => {
    setForm({ ...STORE_EMPTY_FORM, ...event });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleNew = () => {
    setForm(STORE_EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.startDate || !form.endDate) {
      setMsg('❌ 제목, 시작일, 종료일은 필수예요.');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      if (editingId) {
        await updateEvent(editingId, form);
      } else {
        await createEvent({ ...form, storeId });
      }
      setMsg('✅ 저장되었어요!');
      setShowForm(false);
      load();
    } catch (e) {
      setMsg('❌ 저장 실패: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이벤트를 삭제할까요?')) return;
    try {
      await deleteEvent(id);
      load();
    } catch (e) {
      alert('삭제 실패: ' + e.message);
    }
  };

  const inputStyle = {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: '0.9em',
    width: '100%',
    boxSizing: 'border-box',
  };

  if (!storeId) return (
    <div className="tab-section">
      <div className="admin-card">
        <p className="admin-empty">매장 정보가 없어요. 총괄 관리자에게 문의해주세요.</p>
      </div>
    </div>
  );

  return (
    <div className="tab-section">
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>🎉 우리 매장 이벤트</h3>
          <button className="mypage-btn primary" onClick={handleNew}>+ 이벤트 등록</button>
        </div>

        {/* 등록/수정 폼 */}
        {showForm && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '20px', marginBottom: '24px', border: '1px solid var(--border)' }}>
            <h4 style={{ marginTop: 0 }}>{editingId ? '✏️ 이벤트 수정' : '➕ 새 이벤트 등록'}</h4>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.82em', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>이벤트 종류</label>
                <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {STORE_EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82em', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>제목 *</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="이벤트 제목" />
              </div>

              <div>
                <label style={{ fontSize: '0.82em', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>설명</label>
                <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="이벤트 설명" />
              </div>

              <div>
                <label style={{ fontSize: '0.82em', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>이미지 URL</label>
                <input style={inputStyle} value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82em', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>시작일 *</label>
                  <input type="date" style={inputStyle} value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82em', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>종료일 *</label>
                  <input type="date" style={inputStyle} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>

              {form.type === 'coupon' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.82em', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>쿠폰 코드</label>
                    <input style={inputStyle} value={form.couponCode} onChange={e => setForm(f => ({ ...f, couponCode: e.target.value }))} placeholder="STORE2025" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82em', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>할인율 (%)</label>
                    <input type="number" style={inputStyle} value={form.discountRate} onChange={e => setForm(f => ({ ...f, discountRate: Number(e.target.value) }))} min={0} max={100} />
                  </div>
                </div>
              )}
            </div>

            {msg && <p style={{ color: msg.startsWith('✅') ? '#6fcf97' : '#ff6b7a', margin: '12px 0 0' }}>{msg}</p>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="mypage-btn primary" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '💾 저장'}
              </button>
              <button className="mypage-btn" onClick={() => { setShowForm(false); setMsg(''); }}>취소</button>
            </div>
          </div>
        )}

        {/* 이벤트 목록 */}
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>불러오는 중...</p>
        ) : events.length === 0 ? (
          <p className="admin-empty">등록된 이벤트가 없어요. 첫 이벤트를 만들어보세요!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map(event => {
              const active = isActive(event);
              return (
                <div key={event.id} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  border: `1px solid ${active ? 'var(--accent-gold)' : 'var(--border)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong>{event.title}</strong>
                        <span style={{
                          fontSize: '0.75em', padding: '2px 8px', borderRadius: '20px',
                          background: active ? 'rgba(212,168,67,0.2)' : 'rgba(255,255,255,0.05)',
                          color: active ? 'var(--accent-gold)' : 'var(--text-muted)',
                          border: `1px solid ${active ? 'var(--accent-gold)' : 'var(--border)'}`,
                        }}>
                          {active ? '🟢 진행중' : '⚪ 종료'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82em', color: 'var(--text-muted)' }}>
                        {STORE_EVENT_TYPES.find(t => t.value === event.type)?.label || event.type} · {event.startDate} ~ {event.endDate}
                        {event.couponCode && ` · 쿠폰: ${event.couponCode}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button className="mypage-btn small" onClick={() => handleEdit(event)}>수정</button>
                      <button className="mypage-btn small danger" onClick={() => handleDelete(event.id)}>삭제</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}