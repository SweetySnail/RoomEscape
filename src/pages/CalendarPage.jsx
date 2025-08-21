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

  // const handleDateClick = (date) => {
  //   const recordsOnSelectedDate = purchasedRecords.filter(
  //     record => record.date === date.toISOString().slice(0, 10)
  //   );
  //   console.log(`${date.toISOString().slice(0, 10)} 날짜의 기록:`, recordsOnSelectedDate);
  //   if (recordsOnSelectedDate.length > 0) {
  //     alert(`선택한 날짜 (${date.toISOString().slice(0, 10)})에 ${recordsOnSelectedDate.length}개의 기록이 있어요!\n\n` +
  //           recordsOnSelectedDate.map(r => `- ${r.productName} (${r.time}, 평점 ${r.rating})`).join('\n'));
  //   }
  // };

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <div className="calendar-main-content"> {/* ⭐ 캘린더와 세부 내용을 함께 담을 래퍼! */}
        <div className="calendar-section-wrapper"> {/* 기존 캘린더 부분 */}
          <h2>나의 예약 / 기록 캘린더</h2>
          <div className="calendar-container-area">
            <Calendar
              onChange={handleDateChange} // 날짜 변경 이벤트 핸들러
              value={selectedDate} // 캘린더의 현재 선택 날짜를 selectedDate로 연결
              
              // ⭐ tileContent: 각 날짜 타일에 간단한 내용 출력
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const dateString = date.toISOString().slice(0, 10);
                  const eventsOnDate = purchasedRecords.filter(record => record.date === dateString);

                  if (eventsOnDate.length > 0) {
                    // ⭐ 여기에 간단한 내용을 표시 (예: 첫 번째 기록의 이름 또는 'N건')
                    return (
                      <div className="event-summary">
                        <span className="event-count">{eventsOnDate.length}건</span>
                        {/* 더 자세한 내용이 필요하면 첫 번째 상품 이름을 표시 */}
                        {/* <p className="event-title">{eventsOnDate[0].productName}</p> */}
                      </div>
                    );
                  }
                }
                return null;
              }}

              // ⭐ tileClassName: 선택된 날짜에 스타일 적용
              tileClassName={({ date, view }) => {
                if (view === 'month') {
                  const dateString = date.toISOString().slice(0, 10);
                  // 오늘 날짜인지, 기록이 있는 날인지, 선택된 날짜인지에 따라 클래스를 추가할 수 있어!
                  const todayString = new Date().toISOString().slice(0, 10);
                  const isToday = dateString === todayString;
                  const hasRecords = purchasedRecords.some(record => record.date === dateString);
                  const isSelected = selectedDate && dateString === selectedDate.toISOString().slice(0, 10);

                  let classes = [];
                  if (isToday) classes.push('react-calendar__tile--today'); // 오늘 날짜 기본 스타일
                  if (hasRecords) classes.push('has-event'); // 이벤트가 있는 날
                  if (isSelected) classes.push('selected-date'); // 선택된 날짜

                  return classes.join(' ');
                }
                return null;
              }}
            />
          </div>
        </div>

        {/* ⭐ 우측에 세부 일정 보여줄 영역 (새로운 div) */}
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
                  {/* 더 많은 세부 정보를 여기에 표시 */}
                </div>
              ))
            ) : (
              <p className="no-schedule-message">선택된 날짜에는 기록이 없어요.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;