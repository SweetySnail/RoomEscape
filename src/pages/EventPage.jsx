import React, { useState } from 'react';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';
import '../styles/Global.css';
import '../styles/EventPage.css';
import eventsData from '../data/eventsData';

function EventPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 오늘 날짜
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 이벤트 진행 여부 판단
  const isActive = (event) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return today >= start && today <= end;
  };

  // D-day 계산
  const getDday = (endDate) => {
    const end = new Date(endDate);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'D-day';
    if (diff > 0) return `D-${diff}`;
    return '종료';
  };

  const activeEvents = eventsData.filter(e => isActive(e));
  const endedEvents = eventsData.filter(e => !isActive(e));

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
              style={{ backgroundImage: `url(${activeEvents[0].thumbnail})` }}
              onClick={() => setSelectedEvent(activeEvents[0])}
            >
              <div className="event-hero-overlay">
                <span className="event-hero-badge" style={{ backgroundColor: activeEvents[0].badgeColor }}>
                  {activeEvents[0].badgeText}
                </span>
                <h1 className="event-hero-title">{activeEvents[0].title}</h1>
                <p className="event-hero-subtitle">{activeEvents[0].subtitle}</p>
                <div className="event-hero-dday">{getDday(activeEvents[0].endDate)} 마감</div>
              </div>
            </div>
          )}

          {/* 진행 중인 이벤트 */}
          <section className="event-section">
            <h2 className="event-section-title">
              🔥 진행 중인 이벤트
              <span className="event-count">{activeEvents.length}개</span>
            </h2>
            {activeEvents.length > 0 ? (
              <div className="event-grid">
                {activeEvents.map(event => (
                  <div
                    key={event.id}
                    className="event-card"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="event-card-img-wrapper">
                      <img src={event.thumbnail} alt={event.title} className="event-card-img" />
                      <span className="event-card-badge" style={{ backgroundColor: event.badgeColor }}>
                        {event.badgeText}
                      </span>
                      <span className="event-card-dday">{getDday(event.endDate)}</span>
                    </div>
                    <div className="event-card-body">
                      <h3>{event.title}</h3>
                      <p className="event-card-subtitle">{event.subtitle}</p>
                      <div className="event-card-date">
                        📅 {event.startDate} ~ {event.endDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="event-empty">현재 진행 중인 이벤트가 없어요.</p>
            )}
          </section>

          {/* 종료된 이벤트 */}
          {endedEvents.length > 0 && (
            <section className="event-section">
              <h2 className="event-section-title">
                📁 종료된 이벤트
              </h2>
              <div className="event-grid">
                {endedEvents.map(event => (
                  <div
                    key={event.id}
                    className="event-card ended"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="event-card-img-wrapper">
                      <img src={event.thumbnail} alt={event.title} className="event-card-img" />
                      <div className="event-card-ended-overlay">종료</div>
                    </div>
                    <div className="event-card-body">
                      <h3>{event.title}</h3>
                      <p className="event-card-subtitle">{event.subtitle}</p>
                      <div className="event-card-date">
                        📅 {event.startDate} ~ {event.endDate}
                      </div>
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

            <img src={selectedEvent.thumbnail} alt={selectedEvent.title} className="event-modal-img" />

            <div className="event-modal-body">
              <div className="event-modal-badge-row">
                <span className="event-card-badge" style={{ backgroundColor: selectedEvent.badgeColor }}>
                  {selectedEvent.badgeText}
                </span>
                {isActive(selectedEvent) && (
                  <span className="event-modal-dday">{getDday(selectedEvent.endDate)} 마감</span>
                )}
              </div>

              <h2>{selectedEvent.title}</h2>
              <p className="event-modal-desc">{selectedEvent.description}</p>
              <p className="event-modal-date">
                📅 {selectedEvent.startDate} ~ {selectedEvent.endDate}
              </p>

              <hr className="event-modal-divider" />

              {/* 할인 이벤트 상세 */}
              {(selectedEvent.type === 'discount' || selectedEvent.type === 'special') &&
                selectedEvent.detail.discountRate > 0 && (
                <div className="event-detail-box">
                  <h3>🎟 할인 정보</h3>
                  <div className="event-detail-row">
                    <span>할인율</span>
                    <strong className="highlight">{selectedEvent.detail.discountRate}% 할인</strong>
                  </div>
                  {selectedEvent.detail.targetThemes && (
                    <div className="event-detail-row">
                      <span>적용 테마</span>
                      <strong>{selectedEvent.detail.targetThemes.join(', ')}</strong>
                    </div>
                  )}
                  <div className="event-detail-row">
                    <span>적용 조건</span>
                    <strong>{selectedEvent.detail.condition}</strong>
                  </div>
                  <div className="coupon-box">
                    <span>쿠폰 코드</span>
                    <code className="coupon-code">{selectedEvent.detail.couponCode}</code>
                  </div>
                </div>
              )}

              {/* 쿠폰만 있는 경우 */}
              {selectedEvent.type === 'special' &&
                selectedEvent.detail.discountRate === 0 && (
                <div className="event-detail-box">
                  <h3>🎁 혜택 정보</h3>
                  <div className="event-detail-row">
                    <span>적용 조건</span>
                    <strong>{selectedEvent.detail.condition}</strong>
                  </div>
                  <div className="coupon-box">
                    <span>쿠폰 코드</span>
                    <code className="coupon-code">{selectedEvent.detail.couponCode}</code>
                  </div>
                </div>
              )}

              {/* 빙고 퀘스트 상세 */}
              {selectedEvent.type === 'bingo' && (
                <div className="event-detail-box">
                  <h3>🎯 빙고 퀘스트</h3>
                  <p className="bingo-reward">🏆 보상: {selectedEvent.detail.reward}</p>
                  <div className="bingo-grid">
                    {selectedEvent.detail.bingoItems.map(item => (
                      <div key={item.id} className="bingo-item">
                        <span className="bingo-icon">{item.icon}</span>
                        <span className="bingo-text">{item.text}</span>
                      </div>
                    ))}
                  </div>
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