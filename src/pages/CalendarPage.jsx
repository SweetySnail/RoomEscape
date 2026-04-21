import React, { useState, useEffect } from 'react';
import { getRefundInfo } from '../utils/RefundPolicy';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import CustomCalendar from '../components/Calendar';
import BoxMain from '../components/BoxMain';

import 'react-calendar/dist/Calendar.css';
import '../styles/Global.css';
import '../styles/CalendarPage.css';

function CalendarPage() {
  const [purchasedRecords, setPurchasedRecords] = useState([]);
  const initialSelectedDate = new Date();
  initialSelectedDate.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [recordsOnSelectedDate, setRecordsOnSelectedDate] = useState([]);

  // localStorage에서 예약 기록 불러오기
  useEffect(() => {
    const loadRecords = () => {
      const stored = JSON.parse(localStorage.getItem('reservationRecords') || '[]');
      setPurchasedRecords(stored);
    };

    loadRecords();

    window.addEventListener('storage', loadRecords);
    return () => window.removeEventListener('storage', loadRecords);
  }, []);

  const areDatesEqual = (date1, date2) => {
    if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      return false;
    }
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // 선택된 날짜의 기록 필터링
  useEffect(() => {
    if (selectedDate) {
      const filtered = purchasedRecords.filter(record => {
        const recordDate = new Date(record.date.replace(/-/g, '/'));
        recordDate.setHours(0, 0, 0, 0);
        return areDatesEqual(selectedDate, recordDate);
      });
      setRecordsOnSelectedDate(filtered);
    } else {
      setRecordsOnSelectedDate([]);
    }
  }, [selectedDate, purchasedRecords]);

  const handleDateChange = (date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  };

  // 예약 삭제
  const handleDeleteRecord = (recordId, productName, date, time, price) => {
    const refund = getRefundInfo(date);
    const refundAmount = Math.floor((price * refund.rate) / 100);

    const confirmed = window.confirm(
      `아래 예약을 취소하시겠어요?\n\n` +
      `📌 테마: ${productName}\n` +
      `📅 날짜: ${date} · ${time}\n\n` +
      `💰 환불 정책: ${refund.label}\n` +
      `💸 환불 예상 금액: ${refundAmount.toLocaleString()}원\n\n` +
      `취소 후에는 복구가 불가능해요.`
    );

    if (!confirmed) return;

    const updated = purchasedRecords.map(record =>
      record.id === recordId
        ? { ...record, cancelled: true, refundAmount, refundRate: refund.rate }
        : record
    );
    setPurchasedRecords(updated);
    localStorage.setItem('reservationRecords', JSON.stringify(updated));

    alert(`예약이 취소되었어요.\n환불 금액: ${refundAmount.toLocaleString()}원 (${refund.label})`);
  };

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="calendar-main-content">

          {/* 좌측 달력 */}
          <div className="calendar-left">
            <h2>나의 예약 / 기록 캘린더</h2>
            <CustomCalendar
              purchasedRecords={purchasedRecords}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />

            {/* 범례 */}
            <div className="calendar-legend">
              <span className="legend-item">🟢 성공</span>
              <span className="legend-item">🔴 실패</span>
              <span className="legend-item">⏳ 미완료</span>
            </div>

            {/* 통계 */}
            <div className="calendar-stats">
              <div className="stat-item">
                <span className="stat-number">{purchasedRecords.length}</span>
                <span className="stat-label">총 예약</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {purchasedRecords.filter(r => r.success === true).length}
                </span>
                <span className="stat-label">🟢 성공</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {purchasedRecords.filter(r => r.success === false).length}
                </span>
                <span className="stat-label">🔴 실패</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {purchasedRecords.filter(r => r.success === null).length}
                </span>
                <span className="stat-label">⏳ 미완료</span>
              </div>
            </div>
          </div>

          {/* 우측 예약 목록 */}
          <div className="calendar-right">
            <h3>
              {selectedDate
                ? selectedDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })
                : '날짜를 선택해주세요'}
            </h3>

            <div className="schedule-list">
              {recordsOnSelectedDate.length > 0 ? (
                recordsOnSelectedDate.map(record => (
                  <div key={record.id} className="schedule-item">

                    {/* 헤더: 제목 + 결과 뱃지 */}
                    <div className="schedule-item-header">
                      <h4>{record.productName}</h4>
                      {record.success === true && (
                        <span className="result-badge success">🟢 성공</span>
                      )}
                      {record.success === false && (
                        <span className="result-badge fail">🔴 실패</span>
                      )}
                      {record.success === null && (
                        <span className="result-badge pending">⏳ 미완료</span>
                      )}
                    </div>

                    <p>🕐 시간: {record.time}</p>
                    <p>👥 인원: {record.people}</p>
                    <p>💰 가격: {record.price?.toLocaleString()}원</p>
                    <p>🎭 테마: {record.theme}</p>

                    {/* 성공/실패는 관리자가 등록 */}
                    {record.success === null && (
                      <div className="admin-notice">
                        🔒 성공 · 실패 결과는 관리자가 등록해요.
                      </div>
                    )}

                    {/* 예약 삭제 */}
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteRecord(
                        record.id,
                        record.productName,
                        record.date,
                        record.time,
                        record.price
                      )}
                    >
                      🗑 예약 취소
                    </button>

                  </div>
                ))
              ) : (
                <p className="no-schedule-message">
                  선택된 날짜에는 예약이 없어요.
                </p>
              )}
            </div>
          </div>

        </div>
      </BoxMain>
    </div>
  );
}

export default CalendarPage;