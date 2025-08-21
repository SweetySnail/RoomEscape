import React from 'react';
import Calendar from 'react-calendar';

import 'react-calendar/dist/Calendar.css';
import '../styles/CalendarPage.css';

function CustomCalendar({ purchasedRecords, selectedDate, onDateChange }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="calendar-container-area">
      <Calendar
        onChange={onDateChange}
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
            const compareDate = new Date(date);
            compareDate.setHours(0, 0, 0, 0);
            const isPastDate = compareDate < today;

            let classes = [];
            if (isPastDate) classes.push('is-past-date');
            if (isToday) classes.push('is-today-custom');
            if (hasRecords) classes.push('has-event');
            if (isSelected) classes.push('selected-date');

            return classes.join(' ');
          }
          return null;
        }}
      />
    </div>
  )
}

export default CustomCalendar;