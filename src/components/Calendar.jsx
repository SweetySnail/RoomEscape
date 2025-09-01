import React from 'react';
import Calendar from 'react-calendar';

import 'react-calendar/dist/Calendar.css';
import '../styles/CalendarPage.css';

function CustomCalendar({ purchasedRecords, selectedDate, onDateChange }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const areDatesEqual = (date1, date2) => {
    if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      return false;
    }
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  return (
    <div className="calendar-container-area">
      <Calendar
        onChange={onDateChange}
        value={selectedDate}

        tileContent={({ date, view }) => {
          if (view === 'month') {
            // const dateString = date.toISOString().slice(0, 10);
            // const eventsOnDate = purchasedRecords.filter(record => record.date === dateString);
            const tileDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const eventsOnDate = purchasedRecords.filter(record => {
              const recordDate = new Date(record.date.replace(/-/g, '/')); 
              recordDate.setHours(0, 0, 0, 0);

              return areDatesEqual(tileDate, recordDate);
            });


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
            const classes = [];
            const tileDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            if (tileDate < today) classes.push('is-past-date');
            if (areDatesEqual(tileDate, today)) classes.push('is-today-custom');
            
            const eventsOnDate = purchasedRecords.filter(record => {
              const recordDate = new Date(record.date.replace(/-/g, '/'));
              recordDate.setHours(0, 0, 0, 0);
              return areDatesEqual(tileDate, recordDate);
            });
            if (eventsOnDate.length > 0) classes.push('has-event');
            if (selectedDate && areDatesEqual(tileDate, selectedDate)) classes.push('selected-date');

            return classes.join(' ');
          }
          return null;
        }}
      />
    </div>
  )
}

export default CustomCalendar;