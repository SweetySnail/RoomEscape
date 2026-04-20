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
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  return (
    <div className="calendar-container-area">
      <Calendar
        onChange={onDateChange}
        value={selectedDate}

        tileContent={({ date, view }) => {
          if (view !== 'month') return null;

          const tileDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const recordsOnDate = purchasedRecords.filter(record => {
            const recordDate = new Date(record.date.replace(/-/g, '/'));
            recordDate.setHours(0, 0, 0, 0);
            return areDatesEqual(tileDate, recordDate);
          });

          if (recordsOnDate.length === 0) return null;

          return (
            <div className="tile-records">
              {recordsOnDate.map(record => (
                <span key={record.id} className="tile-dot">
                  {record.success === true && '🟢'}
                  {record.success === false && '🔴'}
                  {record.success === null && '⏳'}
                </span>
              ))}
            </div>
          );
        }}

        tileClassName={({ date, view }) => {
          if (view !== 'month') return null;

          const classes = [];
          const tileDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

          if (tileDate < today) classes.push('is-past-date');
          if (areDatesEqual(tileDate, today)) classes.push('is-today-custom');
          if (selectedDate && areDatesEqual(tileDate, selectedDate)) classes.push('selected-date');

          const recordsOnDate = purchasedRecords.filter(record => {
            const recordDate = new Date(record.date.replace(/-/g, '/'));
            recordDate.setHours(0, 0, 0, 0);
            return areDatesEqual(tileDate, recordDate);
          });

          if (recordsOnDate.length > 0) {
            const hasSuccess = recordsOnDate.some(r => r.success === true);
            const hasFail = recordsOnDate.some(r => r.success === false);
            const allPending = recordsOnDate.every(r => r.success === null);

            if (hasSuccess && !hasFail) classes.push('has-success');
            else if (hasFail && !hasSuccess) classes.push('has-fail');
            else if (allPending) classes.push('has-pending');
            else classes.push('has-mixed');
          }

          return classes.join(' ');
        }}
      />
    </div>
  );
}

export default CustomCalendar;