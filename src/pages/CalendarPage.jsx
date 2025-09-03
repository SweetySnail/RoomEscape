import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import CustomCalendar from '../components/Calendar';

import 'react-calendar/dist/Calendar.css';
import '../styles/Global.css';
import '../styles/CalendarPage.css';

// 나중에 삭제
import purchasedRecordsData from '../data/purchasedRecordsData';
import BoxMain from '../components/BoxMain';

function CalendarPage() {
  const navigate = useNavigate();
  const [purchasedRecords, setPurchasedRecords] = useState(purchasedRecordsData);
  const initialSelectedDate = new Date();
  initialSelectedDate.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate); 
  const [recordsOnSelectedDate, setRecordsOnSelectedDate] = useState([]);

  const areDatesEqual = (date1, date2) => {
    if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      return false;
    }
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };
  
  useEffect(() => {
    if (selectedDate) {
      const filteredRecords = purchasedRecords.filter(record => {
        const recordDate = new Date(record.date.replace(/-/g, '/')); 
        recordDate.setHours(0, 0, 0, 0);
        return areDatesEqual(selectedDate, recordDate);
      });
      setRecordsOnSelectedDate(filteredRecords);
    } else {
      setRecordsOnSelectedDate([]);
    }
  }, [selectedDate, purchasedRecords]);

  const handleDateChange = (date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  };

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="calendar-main-content">
          <div className="calendar-left">
            <h2>나의 예약 / 기록 캘린더</h2>
            <CustomCalendar
              purchasedRecords={purchasedRecords} // 기록 데이터 전달
              selectedDate={selectedDate}         // 현재 선택 날짜 전달
              onDateChange={handleDateChange}     // 날짜 변경 시 호출될 함수 전달
            />
          </div>

          <div className="calendar-right">
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