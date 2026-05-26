// src/pages/EventPage.jsx
import React, { useState, useEffect } from 'react';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import { getActiveEvents, getAllEvents } from '../services/eventService';
import '../styles/Global.css';
import '../styles/EventPage.css';

const TYPE_LABEL = {
  banner:         '📢 공지',
  coupon:         '🎟 할인쿠폰',
  theme_highlight:'✨ 기간한정',
  bingo:          '🎯 빙고퀘스트',
};

function EventPage() {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const load = async () => {
      try {
        // isActive=true인 것만 가져와서 날짜로 진행/종료 구분
        const data = await getAllEvents();
        setAllEvents(data.filter(e => e.isActive));
      } catch (e) {
        console.error('이벤트 불러오기 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isActive = (e) => e.startDate <= today && e.endDate >= today;

  const getDday = (endDate) => {
    const diff = Math.ceil((new Date(endDate) - new Date(today)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'D-day';
    if (diff > 0) return `D-${diff}`;
    return '종료';
  };

  // 종료 후 90일 이내만 표시
  const THREE_MONTHS_AGO = new Date();
  THREE_MONTHS_AGO.setDate(THREE_MONTHS_AGO.getDate() - 90);
  const threeMonthsAgoStr = THREE_MONTHS_AGO.toISOString().slice(0, 10);

  const activeEvents = allEvents.filter(e => isActive(e));
  const endedEvents  = allEvents.filter(e => !isActive(e) && e.endDate >= threeMonthsAgoStr);

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="event-page-content">

          {/* 상단 배너 */}
          {activeEvents.length > 0 && (
            <div
              className="event-hero"
              style={activeEvents[0].imageUrl ? { backgroundImage: `url(${activeEvents[0].imageUrl})` } : {}}
              onClick={() => setSelectedEvent(activeEvents[0])}
            >
              <div className="event-hero-overlay">
                <span className="event-hero-badge" style={{ backgroundColor: activeEvents[0].badgeColor || '#d4a843' }}>
                  {TYPE_LABEL[activeEvents[0].type] || activeEvents[0].type}
                </span>
                <h1 className="event-hero-title">{activeEvents[0].title}</h1>
                <p className="event-hero-subtitle">{activeEvents[0].description}</p>
                <div className="event-hero-dday">{getDday(activeEvents[0].endDate)} 마감</div>
              </div>
            </div>
          )}

          {/* 진행 중인 이벤트 */}
          <section className="event-section">
            <h2 className="event-section-title">
              🔥 진행 중인 이벤트
              <span className="event-count">{loading ? '...' : activeEvents.length}개</span>
            </h2>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>불러오는 중...</p>
            ) : activeEvents.length > 0 ? (
              <div className="event-grid">
                {activeEvents.map(event => (
                  <div key={event.id} className="event-card" onClick={() => setSelectedEvent(event)}>
                    <div className="event-card-img-wrapper">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="event-card-img" />
                      ) : (
                        <div className="event-card-img" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                          {TYPE_LABEL[event.type]?.split(' ')[0] || '🎉'}
                        </div>
                      )}
                      <span className="event-card-badge" style={{ backgroundColor: event.badgeColor || '#d4a843' }}>
                        {TYPE_LABEL[event.type] || event.type}
                      </span>
                      <span className="event-card-dday">{getDday(event.endDate)}</span>
                    </div>
                    <div className="event-card-body">
                      <h3>{event.title}</h3>
                      <p className="event-card-subtitle">{event.description}</p>
                      <div className="event-card-date">📅 {event.startDate} ~ {event.endDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="event-empty">현재 진행 중인 이벤트가 없어요.</p>
            )}
          </section>

          {/* 종료된 이벤트 */}
          {!loading && endedEvents.length > 0 && (
            <section className="event-section">
              <h2 className="event-section-title">📁 종료된 이벤트</h2>
              <div className="event-grid">
                {endedEvents.map(event => (
                  <div key={event.id} className="event-card ended" onClick={() => setSelectedEvent(event)}>
                    <div className="event-card-img-wrapper">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="event-card-img" />
                      ) : (
                        <div className="event-card-img" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                          {TYPE_LABEL[event.type]?.split(' ')[0] || '🎉'}
                        </div>
                      )}
                      <div className="event-card-ended-overlay">종료</div>
                    </div>
                    <div className="event-card-body">
                      <h3>{event.title}</h3>
                      <p className="event-card-subtitle">{event.description}</p>
                      <div className="event-card-date">📅 {event.startDate} ~ {event.endDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </BoxMain>

      {/* 이벤트 상세 모달 */}
      {selectedEvent && (
        <div className="event-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="event-modal-close" onClick={() => setSelectedEvent(null)}>×</button>
            {selectedEvent.imageUrl && (
              <img src={selectedEvent.imageUrl} alt={selectedEvent.title} className="event-modal-img" />
            )}
            <div className="event-modal-body">
              <div className="event-modal-badge-row">
                <span className="event-card-badge" style={{ backgroundColor: selectedEvent.badgeColor || '#d4a843' }}>
                  {TYPE_LABEL[selectedEvent.type] || selectedEvent.type}
                </span>
                {isActive(selectedEvent) && (
                  <span className="event-modal-dday">{getDday(selectedEvent.endDate)} 마감</span>
                )}
              </div>
              <h2>{selectedEvent.title}</h2>
              <p className="event-modal-desc">{selectedEvent.description}</p>
              <p className="event-modal-date">📅 {selectedEvent.startDate} ~ {selectedEvent.endDate}</p>
              <hr className="event-modal-divider" />

              {/* 할인/쿠폰 정보 */}
              {(selectedEvent.discountRate > 0 || selectedEvent.couponCode) && (
                <div className="event-detail-box">
                  <h3>🎟 할인 정보</h3>
                  {selectedEvent.discountRate > 0 && (
                    <div className="event-detail-row">
                      <span>할인율</span>
                      <strong className="highlight">{selectedEvent.discountRate}% 할인</strong>
                    </div>
                  )}
                  {selectedEvent.targetThemeIds?.length > 0 && (
                    <div className="event-detail-row">
                      <span>적용 테마 수</span>
                      <strong>{selectedEvent.targetThemeIds.length}개 테마</strong>
                    </div>
                  )}
                  {selectedEvent.couponCode && (
                    <div className="coupon-box">
                      <span>쿠폰 코드</span>
                      <code className="coupon-code">{selectedEvent.couponCode}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventPage;
