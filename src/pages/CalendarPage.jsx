import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import Calendar from 'react-calendar';

import 'react-calendar/dist/Calendar.css';
import '../styles/Global.css';
import '../styles/CalendarPage.css';

// 나중에 삭제
import purchasedRecordsData from '../data/purchasedRecordsData';
import BoxMain from '../components/BoxMain';

function CalendarPage() {
  const navigate = useNavigate();
  const [purchasedRecords, setPurchasedRecords] = useState(purchasedRecordsData); // ✨ 이렇게!
  // ⭐ 새로 추가된 상태: 사용자가 선택한 날짜 (초기값은 오늘 날짜 또는 null)
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  // ⭐ 선택된 날짜에 해당하는 기록들을 저장할 상태
  const [recordsOnSelectedDate, setRecordsOnSelectedDate] = useState([]);

    // ⭐ 컴포넌트 마운트 시 또는 selectedDate가 변경될 때마다 세부 기록 업데이트
  useEffect(() => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().slice(0, 10);
      const filteredRecords = purchasedRecords.filter(record => record.date === dateString);
      setRecordsOnSelectedDate(filteredRecords);
    } else {
      setRecordsOnSelectedDate([]); // 날짜가 선택되지 않았으면 비움
    }
  }, [selectedDate, purchasedRecords]); // selectedDate나 purchasedRecords가 바뀔 때 실행

  // 캘린더에서 날짜를 선택했을 때 실행될 함수
  const handleDateChange = (date) => {
    setSelectedDate(date); // 선택된 날짜 업데이트!
  };

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="calendar-main-content">
          <div className="calendar-section-wrapper">
            <h2>나의 예약 / 기록 캘린더</h2>
            <div className="calendar-container-area">
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                
                tileContent={({ date, view }) => {
                  if (view === 'month') {
                    const dateString = date.toISOString().slice(0, 10);
                    const eventsOnDate = purchasedRecords.filter(record => record.date === dateString);

                    if (eventsOnDate.length > 0) {
                      return (
                        <div className="event-summary">
                          <span className="event-count">{eventsOnDate.length}건</span>
                        </div>
                      );
                    }
                  }
                  return null;
                }}

                tileClassName={({ date, view }) => {
                  if (view === 'month') {
                    const dateString = date.toISOString().slice(0, 10);
                    const todayString = new Date().toISOString().slice(0, 10);
                    const isToday = dateString === todayString;
                    const hasRecords = purchasedRecords.some(record => record.date === dateString);
                    const isSelected = selectedDate && dateString === selectedDate.toISOString().slice(0, 10);

                    let classes = [];
                    if (isToday) classes.push('react-calendar__tile--today');
                    if (hasRecords) classes.push('has-event');
                    if (isSelected) classes.push('selected-date');

                    return classes.join(' ');
                  }
                  return null;
                }}
              />
            </div>
          </div>

          <div className="daily-schedule-sidebar">
            <h3>
              {selectedDate 
                ? `${selectedDate.toLocaleDateString()} (${selectedDate.toLocaleDateString('ko-KR', { weekday: 'long' })})`
                : '날짜를 선택해주세요'}
            </h3>
            <div className="schedule-list">
              {recordsOnSelectedDate.length > 0 ? (
                recordsOnSelectedDate.map(record => (
                  <div key={record.id} className="schedule-item">
                    <h4>{record.productName}</h4>
                    <p>시간: {record.time}</p>
                    <p>평점: ⭐ {record.rating}</p>
                    <p>테마: {record.theme}</p>
                  </div>
                ))
              ) : (
                <p className="no-schedule-message">선택된 날짜에는 기록이 없어요.</p>
              )}
            </div>
          </div>
        </div>
      </BoxMain>
    </div>
  );
}

export default CalendarPage;