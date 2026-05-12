import React, { useState, useEffect } from 'react';
import { getRefundInfo } from '../utils/RefundPolicy';
import { useAuth } from '../hooks/useAuth';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import CustomCalendar from '../components/Calendar';
import BoxMain from '../components/BoxMain';

import {
  getMyReservations,
  cancelReservation,
} from '../services/reservationService';

import 'react-calendar/dist/Calendar.css';
import '../styles/Global.css';
import '../styles/CalendarPage.css';

function CalendarPage() {
  const { user } = useAuth();
  const [purchasedRecords, setPurchasedRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const initialSelectedDate = new Date();
  initialSelectedDate.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [recordsOnSelectedDate, setRecordsOnSelectedDate] = useState([]);

  // Firestore에서 예약 불러오기
  useEffect(() => {
    const loadRecords = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const records = await getMyReservations(user.uid);
        setPurchasedRecords(records);
      } catch (error) {
        console.error('예약 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [user]);

  const areDatesEqual = (date1, date2) => {
    if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

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

  // 예약 취소
  const handleDeleteRecord = async (recordId, productName, date, time, price) => {
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

    try {
      await cancelReservation(recordId, {
        refundAmount,
        refundRate: refund.rate,
      });

      // 로컬 상태 업데이트
      setPurchasedRecords(prev =>
        prev.map(r =>
          r.id === recordId
            ? { ...r, cancelled: true, refundAmount, refundRate: refund.rate }
            : r
        )
      );

      alert(`예약이 취소되었어요.\n환불 금액: ${refundAmount.toLocaleString()}원 (${refund.label})`);
    } catch (error) {
      console.error('예약 취소 실패:', error);
      alert('예약 취소 중 오류가 발생했어요.');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <BoxTop />
        <BoxRight />
        <BoxMain>
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            데이터를 불러오는 중이에요...
          </div>
        </BoxMain>
      </div>
    );
  }

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

            <div className="calendar-legend">
              <span className="legend-item">🟢 성공</span>
              <span className="legend-item">🔴 실패</span>
              <span className="legend-item">⏳ 미완료</span>
            </div>

            <div className="calendar-stats">
              <div className="stat-item">
                <span className="stat-number">{purchasedRecords.filter(r => !r.cancelled).length}</span>
                <span className="stat-label">총 예약</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{purchasedRecords.filter(r => r.success === true).length}</span>
                <span className="stat-label">🟢 성공</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{purchasedRecords.filter(r => r.success === false).length}</span>
                <span className="stat-label">🔴 실패</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{purchasedRecords.filter(r => r.success === null && !r.cancelled).length}</span>
                <span className="stat-label">⏳ 미완료</span>
              </div>
            </div>
          </div>

          {/* 우측 예약 목록 */}
          <div className="calendar-right">
            <h3>
              {selectedDate
                ? selectedDate.toLocaleDateString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
                  })
                : '날짜를 선택해주세요'}
            </h3>

            <div className="schedule-list">
              {recordsOnSelectedDate.length > 0 ? (
                recordsOnSelectedDate.map(record => (
                  <div key={record.id} className="schedule-item">
                    <div className="schedule-item-header">
                      <h4>{record.productName}</h4>
                      {record.success === true  && <span className="result-badge success">🟢 성공</span>}
                      {record.success === false && <span className="result-badge fail">🔴 실패</span>}
                      {record.success === null  && <span className="result-badge pending">⏳ 미완료</span>}
                    </div>

                    <p>🕐 시간: {record.time}</p>
                    <p>👥 인원: {record.people}</p>
                    <p>💰 가격: {record.price?.toLocaleString()}원</p>
                    <p>🎭 테마: {record.theme}</p>

                    {record.success === null && !record.cancelled && (
                      <div className="admin-notice">
                        🔒 성공 · 실패 결과는 관리자가 등록해요.
                      </div>
                    )}

                    {!record.cancelled && (
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
                    )}

                    {record.cancelled && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: 'rgba(220,53,69,0.1)',
                        borderRadius: '6px',
                        fontSize: '0.85em',
                        color: '#ff6b7a',
                      }}>
                        ❌ 취소된 예약이에요.
                      </div>
                    )}
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