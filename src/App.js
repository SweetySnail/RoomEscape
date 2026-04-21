import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ReservationPage from './pages/ReservationPage';
import CalendarPage from './pages/CalendarPage';
import EventPage from './pages/EventPage';
import MyPage from './pages/MyPage';
import PrivacyPage from './pages/PrivacyPage';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reserve" element={<ReservationPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/event" element={<EventPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </Router>
  );
}

export default App;